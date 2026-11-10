import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startReplSet, startApp, seedUser, seedSubscription } from './helpers/harness.js';

// Each describe block uses its own app instance: the app's rate limiter allows only
// 10 requests per IP per 2 minutes, so every group stays below 10 requests.

describe('unauthenticated requests are refused', () => {
    let replSet, app, alice, sub;
    before(async () => {
        replSet = await startReplSet();
        app = await startApp(replSet, 'authz_unauth');
        alice = await seedUser(app.db, 'Alice', 'alice@example.com');
        sub = await seedSubscription(app.db, alice);
    });
    after(async () => {
        await app?.stop();
        await replSet?.stop();
    });

    it('GET /subscriptions without a token -> 401 and no data', async () => {
        const res = await app.request('GET', '/api/v1/subscriptions');
        assert.equal(res.status, 401);
        assert.equal(JSON.stringify(res.body).includes('Netflix'), false);
    });

    it('GET /subscriptions/:id, PUT and DELETE without a token -> 401, data untouched', async () => {
        assert.equal((await app.request('GET', `/api/v1/subscriptions/${sub.id}`)).status, 401);
        assert.equal((await app.request('PUT', `/api/v1/subscriptions/${sub.id}`, { body: { price: 1 } })).status, 401);
        assert.equal((await app.request('DELETE', `/api/v1/subscriptions/${sub.id}`)).status, 401);
        const doc = await app.db.collection('subscriptions').findOne({ _id: sub._id });
        assert.equal(doc.price, 15.99);
    });
});

describe('one user cannot read another user\'s data', () => {
    let replSet, app, alice, bob, aliceSub, bobSub;
    before(async () => {
        replSet = await startReplSet();
        app = await startApp(replSet, 'authz_read');
        alice = await seedUser(app.db, 'Alice', 'alice@example.com');
        bob = await seedUser(app.db, 'Bob', 'bob@example.com');
        aliceSub = await seedSubscription(app.db, alice, { name: 'Netflix' });
        bobSub = await seedSubscription(app.db, bob, { name: 'Spotify' });
    });
    after(async () => {
        await app?.stop();
        await replSet?.stop();
    });

    it('GET /subscriptions returns only the signed-in user\'s subscriptions', async () => {
        const res = await app.request('GET', '/api/v1/subscriptions', { token: alice.token });
        assert.equal(res.status, 200);
        assert.deepEqual(res.body.data.map(s => s.name), ['Netflix']);
    });

    it('GET /subscriptions/:id of someone else\'s subscription -> 403 without leaking it', async () => {
        const res = await app.request('GET', `/api/v1/subscriptions/${bobSub.id}`, { token: alice.token });
        assert.equal(res.status, 403);
        assert.equal(JSON.stringify(res.body).includes('Spotify'), false);
        assert.equal((await app.request('GET', `/api/v1/subscriptions/${aliceSub.id}`, { token: alice.token })).status, 200);
    });

    it('GET /subscriptions/upcoming-renewals only includes the caller\'s subscriptions', async () => {
        const soon = new Date(Date.now() + 2 * 86400000);
        await app.db.collection('subscriptions').updateMany({}, { $set: { renewalDate: soon } });
        const res = await app.request('GET', '/api/v1/subscriptions/upcoming-renewals', { token: alice.token });
        assert.equal(res.status, 200);
        assert.deepEqual(res.body.data.map(s => s.name), ['Netflix']);
    });

    it('GET /subscriptions/user/:id for another user -> 403', async () => {
        const res = await app.request('GET', `/api/v1/subscriptions/user/${bob.id}`, { token: alice.token });
        assert.equal(res.status, 403);
    });

    it('GET /users/:id for another user -> 403; own profile still works, without the password', async () => {
        const other = await app.request('GET', `/api/v1/users/${bob.id}`, { token: alice.token });
        assert.equal(other.status, 403);
        const own = await app.request('GET', `/api/v1/users/${alice.id}`, { token: alice.token });
        assert.equal(own.status, 200);
        assert.equal(own.body.data.email, 'alice@example.com');
        assert.equal('password' in own.body.data, false);
    });

    it('GET /users does not list other users', async () => {
        const res = await app.request('GET', '/api/v1/users', { token: alice.token });
        assert.equal(res.status, 200);
        assert.deepEqual(res.body.data.map(u => u.email), ['alice@example.com']);
    });
});

describe('one user cannot change or delete another user\'s data', () => {
    let replSet, app, alice, bob, aliceSub;
    before(async () => {
        replSet = await startReplSet();
        app = await startApp(replSet, 'authz_write');
        alice = await seedUser(app.db, 'Alice', 'alice@example.com');
        bob = await seedUser(app.db, 'Bob', 'bob@example.com');
        aliceSub = await seedSubscription(app.db, alice);
    });
    after(async () => {
        await app?.stop();
        await replSet?.stop();
    });

    const stored = () => app.db.collection('subscriptions').findOne({ _id: aliceSub._id });

    it('DELETE by another user -> 403 and the subscription still exists', async () => {
        const res = await app.request('DELETE', `/api/v1/subscriptions/${aliceSub.id}`, { token: bob.token });
        assert.equal(res.status, 403);
        assert.ok(await stored(), 'the subscription was deleted despite the 403');
    });

    it('PUT by another user -> 403 and nothing changes', async () => {
        const res = await app.request('PUT', `/api/v1/subscriptions/${aliceSub.id}`, { token: bob.token, body: { price: 1 } });
        assert.equal(res.status, 403);
        assert.equal((await stored()).price, 15.99);
    });

    it('PUT /:id/cancel by another user -> 403 and nothing changes', async () => {
        const res = await app.request('PUT', `/api/v1/subscriptions/${aliceSub.id}/cancel`, { token: bob.token, body: { status: 'cancelled' } });
        assert.equal(res.status, 403);
        assert.equal((await stored()).status, 'active');
    });

    it('the owner cannot hand a subscription to another user through PUT', async () => {
        const res = await app.request('PUT', `/api/v1/subscriptions/${aliceSub.id}`, { token: alice.token, body: { price: 20, user: bob.id } });
        assert.equal(res.status, 200);
        const doc = await stored();
        assert.equal(doc.price, 20, 'the owner\'s legitimate update should still apply');
        assert.equal(doc.user.toString(), alice.id, 'ownership must not be changeable through the request body');
    });

    it('DELETE of a subscription that does not exist -> 404; the owner can delete their own', async () => {
        const missing = await app.request('DELETE', '/api/v1/subscriptions/000000000000000000000000', { token: alice.token });
        assert.equal(missing.status, 404);
        const own = await app.request('DELETE', `/api/v1/subscriptions/${aliceSub.id}`, { token: alice.token });
        assert.equal(own.status, 200);
        assert.equal(await stored(), null);
    });
});
