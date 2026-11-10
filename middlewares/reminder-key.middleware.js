import crypto from 'node:crypto';
import { REMINDER_TRIGGER_KEY } from '../config/env.js';

// Guards the manual "run the reminder job now" endpoint with a secret key that only the
// operator knows (there is no admin role). Send it as the `x-reminder-key` header.
// If REMINDER_TRIGGER_KEY is not configured the endpoint is disabled (fails closed).
const requireReminderKey = (req, res, next) => {
    if (!REMINDER_TRIGGER_KEY) {
        return res.status(503).json({ success: false, error: 'Manual reminder trigger is disabled' });
    }

    const provided = Buffer.from(String(req.headers['x-reminder-key'] || ''));
    const expected = Buffer.from(REMINDER_TRIGGER_KEY);

    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    next();
};

export default requireReminderKey;
