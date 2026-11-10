import { Router } from "express";
import { sendReminders } from "../controllers/workflow.controller.js";
import requireReminderKey from "../middlewares/reminder-key.middleware.js";

const workflowRouter = Router();

workflowRouter.post('/subscription/reminder', requireReminderKey, sendReminders);

export default workflowRouter;