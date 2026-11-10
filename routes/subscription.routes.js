import { Router } from "express";
import { createSubscription, getAllSubscriptions, getSubscriptionDetails, getUserSubscriptions, updateSubscription, deleteSubscription, upcomingRenewals  } from "../controllers/subscription.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const subscriptionRouter = Router();

subscriptionRouter.get('/', authorize, getAllSubscriptions);

subscriptionRouter.get('/upcoming-renewals', authorize, upcomingRenewals);

subscriptionRouter.get('/:id', authorize,getSubscriptionDetails);

subscriptionRouter.post('/', authorize, createSubscription);

subscriptionRouter.put('/:id', authorize, updateSubscription);
subscriptionRouter.delete('/:id', authorize, deleteSubscription);

subscriptionRouter.get('/user/:id', authorize, getUserSubscriptions);

subscriptionRouter.put('/:id/cancel', authorize, updateSubscription);


export default subscriptionRouter;