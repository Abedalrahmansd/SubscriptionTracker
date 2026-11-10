import { Router } from "express";
import { sendReminders } from "../controllers/workflow.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const workflowRouter = Router();

workflowRouter.post('/subscription/reminder', authorize, sendReminders);

export default workflowRouter;