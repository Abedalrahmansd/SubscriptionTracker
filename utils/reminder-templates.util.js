const reminderTemplates = [
    {
        daysRange: [1, 3],
        template: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>⚠️ Urgent: Subscription Renewing Soon</h2>
                <p>Hi {{userName}},</p>
                <p>Your subscription <strong>{{subscriptionName}}</strong> renews in just <strong>{{daysRemaining}} day{{plural}}</strong>!</p>
                <div style="background-color: #ffe6e6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Subscription Details:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Name:</strong> {{subscriptionName}}</li>
                        <li><strong>Price:</strong> {{price}} {{currency}}</li>
                        <li><strong>Frequency:</strong> {{frequency}}</li>
                        <li><strong>Renewal Date:</strong> {{renewalDate}}</li>
                    </ul>
                </div>
                <p>Best regards,<br>Subscription Tracker Team</p>
            </div>
        `
    },
    {
        daysRange: [4, 7],
        template: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>📋 Reminder: Subscription Renewing Soon</h2>
                <p>Hi {{userName}},</p>
                <p>Your subscription <strong>{{subscriptionName}}</strong> will renew in <strong>{{daysRemaining}} day{{plural}}</strong>.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Subscription Details:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Name:</strong> {{subscriptionName}}</li>
                        <li><strong>Price:</strong> {{price}} {{currency}}</li>
                        <li><strong>Frequency:</strong> {{frequency}}</li>
                        <li><strong>Renewal Date:</strong> {{renewalDate}}</li>
                    </ul>
                </div>
                <p>Best regards,<br>Subscription Tracker Team</p>
            </div>
        `
    },
    {
        daysRange: [8, 30],
        template: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>🔔 Subscription Renewal Notice</h2>
                <p>Hi {{userName}},</p>
                <p>Friendly reminder: <strong>{{subscriptionName}}</strong> renews in <strong>{{daysRemaining}} day{{plural}}</strong>.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Subscription Details:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Name:</strong> {{subscriptionName}}</li>
                        <li><strong>Price:</strong> {{price}} {{currency}}</li>
                        <li><strong>Frequency:</strong> {{frequency}}</li>
                        <li><strong>Renewal Date:</strong> {{renewalDate}}</li>
                    </ul>
                </div>
                <p>Best regards,<br>Subscription Tracker Team</p>
            </div>
        `
    }
];

const getEmailTemplate = (daysRemaining) => {
    return reminderTemplates.find(t => daysRemaining >= t.daysRange[0] && daysRemaining <= t.daysRange[1]);
};

const replaceTemplateVariables = (template, user, subscription, daysRemaining) => {
    return template
        .replace(/{{userName}}/g, user.name)
        .replace(/{{subscriptionName}}/g, subscription.name)
        .replace(/{{daysRemaining}}/g, daysRemaining)
        .replace(/{{plural}}/g, daysRemaining !== 1 ? 's' : '')
        .replace(/{{price}}/g, subscription.price)
        .replace(/{{currency}}/g, subscription.carrency)
        .replace(/{{frequency}}/g, subscription.frequency)
        .replace(/{{renewalDate}}/g, new Date(subscription.renewalDate).toLocaleDateString());
};


export { getEmailTemplate, replaceTemplateVariables };
