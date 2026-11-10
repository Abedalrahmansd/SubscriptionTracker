import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startReplSet, startApp } from './helpers/harness.js';

describe('POST /api/v1/auth/sign-up', () => {
    let replSet, app;
    before(async () => {
        replSet = await startReplSet();
        app = await startApp(replSet, 'signup_tests');
    });
    after(async () => {
        await app?.stop();
        await replSet?.stop();
    });

    it('saves the user, returns a token, and the server stays up', async () => {
        const res = await app.request('POST', '/api/v1/auth/sign-up', {
            body: { name: 'Demo User', email: 'demo.user@example.com', password: 'demo-pass-123' },
        });
        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.ok(res.body.data.token);
        assert.equal(res.body.data.user.email, 'demo.user@example.com');
        assert.equal('password' in res.body.data.user, false, 'the password hash must not be returned');

        // Give a (previously) unhandled commit rejection time to crash the process.
        await new Promise(r => setTimeout(r, 500));
        assert.equal(app.isAlive(), true, `server crashed after sign-up:\n${app.logs()}`);

        const saved = await app.db.collection('users').countDocuments({ email: 'demo.user@example.com' });
        assert.equal(saved, 1, 'the new user was not persisted');
    });

    it('can sign in with the account that was just created', async () => {
        const res = await app.request('POST', '/api/v1/auth/sign-in', {
            body: { email: 'demo.user@example.com', password: 'demo-pass-123' },
        });
        assert.equal(res.status, 200);
        assert.ok(res.body.data.token);
        assert.equal('password' in res.body.data.user, false, 'the password hash must not be returned');
    });

    it('rejects a duplicate email with 409 and keeps a single user', async () => {
        const res = await app.request('POST', '/api/v1/auth/sign-up', {
            body: { name: 'Demo User', email: 'demo.user@example.com', password: 'another-pass-1' },
        });
        assert.equal(res.status, 409);
        assert.equal(await app.db.collection('users').countDocuments({ email: 'demo.user@example.com' }), 1);
        assert.equal(app.isAlive(), true);
    });
});
