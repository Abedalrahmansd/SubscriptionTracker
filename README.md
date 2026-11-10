# Subscription Tracker API

A REST API for tracking your recurring subscriptions (Netflix, Spotify, gym, …) and getting an email reminder before each one renews.

It started from the structure of a public tutorial app, which is credited at the top of `app.js` ([adrianhajdin/subscription-tracker-api](https://github.com/adrianhajdin/subscription-tracker-api)), and was then extended (reminder log, security middleware, email templates, tests).

## What it does

- Sign up / sign in with email + password (bcrypt-hashed passwords, JWT access token).
- Create, read, update and delete **your own** subscriptions (name, price, currency, frequency, category, payment method, start/renewal date, status).
- See which of your subscriptions renew in the next 7 days.
- Sends an HTML reminder email **7, 5, 3 and 1 day(s)** before a renewal. A cron job runs every hour (and once at startup); a `ReminderLog` collection with a unique index makes sure each reminder is sent only once, and a reminder is only logged after the email was actually sent, so failures are retried.

## Tech

Node.js (ES modules), Express 4, MongoDB + Mongoose, JWT, bcryptjs, Nodemailer (Gmail SMTP), node-cron, Helmet, CORS, express-rate-limit, bot-guardian-js.

## Run it

Requirements: Node.js 22+ and a MongoDB database (a MongoDB Atlas cluster or a local replica set; sign-up uses a transaction, which MongoDB only supports on replica sets).

```bash
npm install
```

Create `.env.development.local` in the project root (it is git-ignored; use `.env.production.local` when `NODE_ENV=production`):

```
PORT=3000
NODE_ENV=development
DB_URI=<your MongoDB connection string>
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=1d
EMAIL_USER=<gmail address that sends the reminders>
EMAIL_PASSWORD=<a Gmail app password>
```

See `EMAIL_SETUP_GUIDE.md` for how to get a Gmail app password. Then:

```bash
npm run dev     # nodemon
npm start       # plain node
```

Note: the CORS allow-list in `app.js` is hard-coded per environment (`http://localhost:5500` in development).

## Endpoints

Base path `/api/v1`. Send the token as `Authorization: Bearer <token>`. The API allows 10 requests per IP per 2 minutes.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/sign-up` | no | Create an account → `{ token, user }` |
| POST | `/auth/sign-in` | no | Sign in → `{ token, user }` |
| GET | `/subscriptions` | yes | Your subscriptions |
| POST | `/subscriptions` | yes | Create a subscription (owner is taken from the token) |
| GET | `/subscriptions/:id` | yes | One of your subscriptions (403 if it is someone else's) |
| PUT | `/subscriptions/:id` | yes | Update one of your subscriptions (403 if not yours; `user`/`_id` in the body are ignored) |
| DELETE | `/subscriptions/:id` | yes | Delete one of your subscriptions (403 if not yours, nothing is deleted) |
| GET | `/subscriptions/user/:id` | yes | Your subscriptions by user id (403 for any other id) |
| GET | `/subscriptions/upcoming-renewals` | yes | Your subscriptions renewing in the next 7 days |
| PUT | `/subscriptions/:id/cancel` | yes | Same handler as the update route |
| GET | `/users` | yes | Your own user record (there is no admin role) |
| GET | `/users/:id` | yes | Your own user record (403 for any other id) |
| POST | `/workflow/subscription/reminder` | no | Run the reminder job now and return the counts |

`POST /auth/sign-out` is a disabled stub, and `POST /users`, `PUT /users/:id`, `DELETE /users/:id` are placeholders. Errors look like `{ "success": false, "error": "<message>" }`.

## Tests

```bash
npm test
```

Uses Node's built-in test runner (`node:test`) and `mongodb-memory-server`, so no real database or mail account is needed: each test group starts a throw-away in-memory MongoDB replica set and runs the real `app.js` against it. The first run downloads a MongoDB binary (several hundred MB) into a local cache. The tests cover sign-up persistence, and that unauthenticated requests are refused and one user cannot list, read, change or delete another user's data.

## Known limitations

- `POST /workflow/subscription/reminder` has no authentication.
- Sign-up and sign-in responses include the stored password hash in `user`.
- `PUT /subscriptions/:id/cancel` does not set the status by itself.
- Renewal dates are not rolled forward after a renewal.
- No input validation beyond the Mongoose schemas; field names `carrency` and `catagory` are misspelled and part of the API.
