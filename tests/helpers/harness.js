// Test harness: starts a throw-away in-memory MongoDB replica set (sign-up uses a
// transaction, which needs a replica set) and runs the real app.js as a child
// process against it. Nothing here touches a real database or sends real email.
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const JWT_SECRET = 'test-only-secret';
// The app's rate limiter allows 10 requests per IP per 2 minutes, and it is in-memory per
// process, so every test group starts its own app instance and stays under that limit.
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';

const freePort = () => new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
        const { port } = srv.address();
        srv.close(() => resolve(port));
    });
    srv.on('error', reject);
});

export const startReplSet = () => MongoMemoryReplSet.create({ replSet: { count: 1 } });

export const REMINDER_KEY = 'test-only-reminder-key';

export const startApp = async (replSet, dbName, extraEnv = {}) => {
    const port = await freePort();
    const uri = replSet.getUri(dbName);
    const child = spawn(process.execPath, ['app.js'], {
        cwd: ROOT,
        env: {
            ...process.env,
            NODE_ENV: 'test',
            PORT: String(port),
            DB_URI: uri,
            JWT_SECRET,
            JWT_EXPIRES_IN: '1h',
            EMAIL_USER: 'test@example.invalid',
            EMAIL_PASSWORD: 'not-a-real-password',
            REMINDER_TRIGGER_KEY: REMINDER_KEY,
            ...extraEnv,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    let logs = '';
    child.stdout.on('data', d => { logs += d; });
    child.stderr.on('data', d => { logs += d; });

    // Ready once Mongo is connected and the startup reminder check has finished.
    const deadline = Date.now() + 30000;
    while (!/Scheduled task: Reminder checks/.test(logs)) {
        if (child.exitCode !== null) throw new Error(`app exited early:\n${logs}`);
        if (Date.now() > deadline) throw new Error(`app did not start:\n${logs}`);
        await new Promise(r => setTimeout(r, 100));
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const base = `http://127.0.0.1:${port}`;

    const request = async (method, url, { token, body, headers: extraHeaders } = {}) => {
        const headers = { 'Content-Type': 'application/json', 'User-Agent': BROWSER_UA, ...extraHeaders };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(base + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { json = text; }
        return { status: res.status, body: json };
    };

    return {
        request,
        db,
        isAlive: () => child.exitCode === null,
        logs: () => logs,
        stop: async () => {
            await client.close();
            child.kill();
            await new Promise(r => (child.exitCode !== null ? r() : child.once('exit', r)));
        },
    };
};

// Insert a user straight into the database (so the test does not spend rate-limited
// requests on sign-up) and return a valid token for it.
export const seedUser = async (db, name, email) => {
    const _id = new ObjectId();
    const now = new Date();
    await db.collection('users').insertOne({ _id, name, email, password: 'x'.repeat(60), createdAt: now, updatedAt: now });
    return { _id, id: _id.toString(), token: jwt.sign({ id: _id.toString() }, JWT_SECRET, { expiresIn: '1h' }) };
};

export const seedSubscription = async (db, user, overrides = {}) => {
    const _id = new ObjectId();
    const now = new Date();
    await db.collection('subscriptions').insertOne({
        _id,
        name: 'Netflix',
        price: 15.99,
        carrency: 'USD',
        frequency: 'monthly',
        catagory: 'entertainment',
        paymentMethod: 'Credit Card',
        status: 'active',
        startDate: new Date(now.getTime() - 20 * 86400000),
        // Far from the 1/3/5/7-day reminder windows so the startup job never tries to send mail.
        renewalDate: new Date(now.getTime() + 20 * 86400000),
        user: user._id,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    });
    return { _id, id: _id.toString() };
};
