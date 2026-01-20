import mongoose from 'mongoose';

const reminderLogSchema = new mongoose.Schema({
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true,
        index: true
    },
    daysBeforeReminder: {
        type: Number,
        required: true,
        enum: [7, 5, 3, 1]
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    recipientEmail: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Compound index to ensure we don't send duplicate reminders
reminderLogSchema.index({ subscription: 1, daysBeforeReminder: 1 }, { unique: true });

const ReminderLog = mongoose.model('ReminderLog', reminderLogSchema);

export default ReminderLog;
