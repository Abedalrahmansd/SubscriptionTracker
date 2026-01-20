import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [ true, 'Subscription Name is required' ],
        minlength: 2,
        maxlength: 100,
        trim: true
    },

    price:{
        type: Number,
        required: [ true, 'Subscription Price is required' ],
        min: 0
    },

    carrency:{
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD', 'LBP', 'EGP'],
        default: 'USD'
    },

    frequency:{
        type: String,
        required: [ true, 'Subscription Frequency is required' ],
        enum: ['monthly', 'yearly', 'weekly', 'daily']
    },

    catagory:{
        type: String,
        enum: ['sports','entertainment', 'education', 'productivity', 'health', 'fitness', 'news', 'other'],
        required: [ true, 'Subscription Catagory is required' ]
    },

    paymentMethod:{
        type: String,
        required: [ true, 'Payment Method is required' ],
        trim: true
    },

    status:{
        type: String,
        enum: ['active', 'cancelled', 'expired'],
        default: 'active'
    },

    startDate:{
        type: Date,
        required: [ true, 'Subscription Start Date is required' ],
        validate: {
            validator: function(value) {
                return value <= new Date();
            },
            message: 'Start date cannot be in the future'
        }
    },

    renewalDate:{
        type: Date,
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'Renewal date must be after start date'
        }
    },

    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [ true, 'Associated User is required' ],
        index: true
    }


}, { timestamps: true });

subscriptionSchema.pre('save', function() {
    if (!this.renewalDate) {
        const periods = {
            'daily': 1,
            'weekly': 7,
            'monthly': 30,
            'yearly': 365};
        
        this.renewalDate = new Date(this.startDate);
        this.renewalDate.setDate(this.renewalDate.getDate() + periods[this.frequency]);
        }

    //auto-update status if renewal date has passed
    if(this.renewalDate < new Date()){
        this.status = 'expired';
    }
    
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;

//sample subscription document
/*
{
    "name": "Netflix",
    "price": 15.99,
    "currency": "USD",
    "frequency": "monthly",
    "catagory": "entertainment",
    "paymentMethod": "Credit Card",
    "startDate": "2023-01-15T00:00:00.000Z",
}
*/