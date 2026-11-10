import Subscription from '../models/subscription.model.js';


const createSubscription = async (req, res, next) => {
    try {

        const newSubscription = await Subscription.create({
            ...req.body,
            user: req.user._id
        });

        res.status(201).json({
            success: true,
            data: newSubscription
        });

    } catch (e) {
        next(e);
    }
}

const getAllSubscriptions = async (req, res, next) => {
    try {

        const subscriptions = await Subscription.find({ user: req.user._id });

        res.status(200).json({
            success: true,
            data: subscriptions
        });

    } catch (e) {
        next(e);
    }
}

const getSubscriptionDetails = async (req, res, next) => {
    try {
        const subscription = await Subscription.findById(req.params.id);
        if(!subscription){
            const error = new Error('Subscription not found');
            error.statusCode = 404;
            throw error;
        }

        if(req.user._id != subscription.user.toString()){
            const error = new Error('Unauthorized access to this subscription');
            error.statusCode = 403;
            throw error;
        }

        res.status(200).json({
            success: true,
            data: subscription
        });
    } catch (e) {
        next(e);
    }
}

const getUserSubscriptions = async (req, res, next) => {
    try {
        if(req.user._id != req.params.id){
            const error = new Error('Unauthorized access to get subscriptions for this user');
            error.statusCode = 403;
            throw error;
        }
        const subscriptions = await Subscription.find({ user: req.params.id });
        res.status(200).json({
            success: true,
            data: subscriptions
        });
    } catch (e) {
        next(e);
    }
}

const updateSubscription = async (req, res, next) => {
    try {
        const subscription = await Subscription.findById(req.params.id);
        if(!subscription){
            const error = new Error('Subscription not found');
            error.statusCode = 404;
            throw error;
        }

        if(req.user._id != subscription.user.toString()){
            const error = new Error('Unauthorized access to update this subscription');
            error.statusCode = 403;
            throw error;
        }

        // Never let the request body change ownership or the document id
        const updates = { ...req.body };
        delete updates.user;
        delete updates._id;
        Object.assign(subscription, updates);
        await subscription.save();

        res.status(200).json({
            success: true,
            data: subscription
        });
    } catch (e) {
        next(e);
    }
}

const deleteSubscription = async (req, res, next) => {
    try {
        const subscription = await Subscription.findById(req.params.id);
        if(!subscription){
            const error = new Error('Subscription not found');
            error.statusCode = 404;
            throw error;
        }

        // Check ownership BEFORE deleting anything
        if(req.user._id != subscription.user.toString()){
            const error = new Error('Unauthorized access to delete this subscription');
            error.statusCode = 403;
            throw error;
        }

        await subscription.deleteOne();


        res.status(200).json({
            success: true,
            message: 'Subscription deleted successfully'
        });
    } catch (e) {
        next(e);
    }
}

const upcomingRenewals = async (req, res, next) => {
    try {
        const now = new Date();
        const subscriptions = await Subscription.find({ user: req.user._id, renewalDate: { $gte: now, $lte: new Date(now.getTime() + 7*24*60*60*1000) } }); // Next 7 days
        res.status(200).json({
            success: true,
            data: subscriptions
        });
    } catch (e) {
        next(e);
    }
}

export {
    createSubscription,
    getAllSubscriptions,
    getSubscriptionDetails,
    getUserSubscriptions,
    updateSubscription,
    deleteSubscription,
    upcomingRenewals
};