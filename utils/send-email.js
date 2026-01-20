import Subscription from '../models/subscription.model.js';
import ReminderLog from '../models/reminderLog.model.js';
import { getEmailTemplate, replaceTemplateVariables } from './reminder-templates.util.js';
import transporter from '../config/email-transporter.js';
import { EMAIL_USER } from '../config/env.js';
/**
 * Check and send reminders for subscriptions
 * This function:
 * 1. Finds all active subscriptions within 7 days of renewal
 * 2. For each applicable reminder day, checks if reminder was already sent
 * 3. Sends email if not already sent
 * 4. Logs the reminder attempt
 */

const REMINDER_DAYS = [7, 5, 3, 1];


const calculateDaysUntilRenewal = (renewalDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const renewal = new Date(renewalDate);
    renewal.setHours(0, 0, 0, 0);
    
    const diffTime = renewal - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
};

const sendReminderEmail = async (user, subscription, daysRemaining) => {
    try {
        const templateObj = getEmailTemplate(daysRemaining);
        const html = replaceTemplateVariables(templateObj.template, user, subscription, daysRemaining);

        const mailOptions = {
            from: EMAIL_USER,
            to: user.email,
            subject: `⏰ Reminder: ${subscription.name} renews in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
            html
        };

        await transporter.sendMail(mailOptions);
        console.log(`Reminder email sent to ${user.email} for ${subscription.name}`);
        return true;
    } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
        return false;
    }
};

const checkAndSendReminders = async () => {
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        // Get subscriptions that are active and within 7 days of renewal
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        const subscriptions = await Subscription.find({
            status: 'active',
            renewalDate: {
                $gte: now,
                $lte: sevenDaysFromNow
            }
        }).populate('user', 'name email');
        console.log(`Found ${subscriptions.length} subscriptions nearing renewal.`);

        let sentCount = 0;
        let failedCount = 0;
        let skippedCount = 0;

        for (const subscription of subscriptions) {
            const daysRemaining = calculateDaysUntilRenewal(subscription.renewalDate);

            // Check if this subscription needs a reminder for this day
            if (REMINDER_DAYS.includes(daysRemaining)) {
                
                // Check if reminder was already sent
                const existingLog = await ReminderLog.findOne({
                    subscription: subscription._id,
                    daysBeforeReminder: daysRemaining
                });

                if (existingLog) {
                    console.log(`Reminder already sent for ${subscription.name} (${daysRemaining} days before)`);
                    skippedCount++;
                    continue;
                }

                // Send email
                const emailSent = await sendReminderEmail(
                    subscription.user,
                    subscription,
                    daysRemaining
                );

                if (emailSent) {
                // Log the reminder attempt
                await ReminderLog.create({
                    subscription: subscription._id,
                    daysBeforeReminder: daysRemaining,
                    emailSent,
                    recipientEmail: subscription.user.email
                });
                    sentCount++;
                } else {
                    failedCount++;
                }
            }
        }

        return {
            success: true,
            sentCount,
            failedCount,
            skippedCount,
            totalProcessed: subscriptions.length
        };

    } catch (error) {
        console.error('Error checking and sending reminders:', error);
        throw error;
    }
};

export { checkAndSendReminders };