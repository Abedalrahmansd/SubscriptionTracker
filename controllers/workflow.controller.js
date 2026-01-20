import { checkAndSendReminders } from '../utils/send-email.js';

/**
 * Manual endpoint to trigger reminder checks
 * POST /api/v1/workflow/subscription/reminder
 */
const sendReminders = async (req, res, next) => {
    try {
        const result = await checkAndSendReminders();

        res.status(200).json({
            success: true,
            message: `Reminder emails processed successfully`,
            data: result
        });

    } catch (e) {
        next(e);
    }
};

export { sendReminders };
