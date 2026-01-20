# Email Reminder Setup Guide

## Overview
Your subscription tracker now sends email reminders **7, 5, 3, and 1 day before** a subscription renews.

## Installation

1. **Install required packages:**
   ```bash
   npm install nodemailer node-cron
   ```

2. **Add email configuration to your `.env.development.local` file:**
   ```
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

## Gmail Setup (Using App Password)

Follow these steps to get your Gmail app password:

1. **Enable 2-Factor Authentication on your Google Account:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Scroll to "How you sign in to Google"
   - Enable "2-Step Verification"

2. **Generate an App Password:**
   - Go back to [Google Account Security](https://myaccount.google.com/security)
   - Find "App passwords" (appears only after 2FA is enabled)
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password to your `.env.development.local` as `EMAIL_PASSWORD`

## How It Works

### Automatic Reminders
- **Scheduled Task:** Reminders run automatically **every day at 9 AM**
- **Days Checked:** 7, 5, 3, and 1 day before renewal
- **Email Content:** Professional HTML email with subscription details

### Manual Trigger
You can also manually trigger reminders via API:
```bash
POST /api/v1/workflow/subscription/reminder
```

Response:
```json
{
  "success": true,
  "message": "Reminder emails sent successfully",
  "data": {
    "sentCount": 5,
    "failedCount": 0,
    "totalProcessed": 25
  }
}
```

## Email Content

Users receive emails containing:
- Subscription name and renewal date
- Price and billing frequency
- Payment method details
- Option to cancel if needed

## Customization

### Change Reminder Days
Edit `controllers/workflow.controller.js`:
```javascript
const REMINDER_DAYS = [7, 5, 3, 1]; // Modify these numbers
```

### Change Scheduled Time
Edit `app.js`:
```javascript
// Change '0 9 * * *' to your preferred time (cron format)
// Current: 9 AM daily
// Examples:
// '0 0 * * *' = Midnight daily
// '0 8 * * 1' = 8 AM every Monday
cron.schedule('0 9 * * *', async () => { ... });
```

### Email Template
Customize the HTML email in `controllers/workflow.controller.js` in the `sendReminderEmail` function.

## Troubleshooting

### Emails Not Sending
1. **Check credentials:** Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
2. **Check subscription status:** Only 'active' subscriptions trigger reminders
3. **Check renewal dates:** Ensure subscription `renewalDate` is set correctly
4. **Check logs:** Look for errors in console output

### Common Issues
- **"Invalid login"** → Wrong app password or email address
- **"Less secure apps"** → Gmail now uses app passwords only (follow Gmail Setup above)
- **No emails sent** → Verify subscriptions have status: 'active'

## Advanced: Using Different Email Services

Want to use a different email service? Replace the transporter config in `workflow.controller.js`:

### Example: Outlook/Hotmail
```javascript
const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
    }
});
```

### Example: SendGrid
```javascript
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
    }
});
```

## Testing

Test the reminder system:

```bash
# Start your server
npm run dev

# In another terminal, trigger reminders manually
curl -X POST http://localhost:5500/api/v1/workflow/subscription/reminder
```

Check console logs to verify emails are being sent.
