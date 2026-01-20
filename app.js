//Toturial Reference: https://github.com/adrianhajdin/subscription-tracker-api | https://youtu.be/rOpEN1JDaD0?si=WfOjLV57WfR9x6QK

import express from 'express';
import { PORT } from './config/env.js';
import { NODE_ENV } from './config/env.js';

import connectDB from './database/mongodb.js';

//Routers Imports
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import workflowRouter from './routes/workflow.routes.js';

//Middlewares Imports
import errorMiddleware from './middlewares/error.middleware.js';
import cookieParser from 'cookie-parser';
import limiter from './middlewares/limiter.middleware.js';

//Security and logging middlewares
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
// bot-guardian-js
import { createGuardianMiddleware } from 'bot-guardian-js/express';

//Cron Jobs
import cron from 'node-cron';
import { checkAndSendReminders } from './utils/send-email.js';

//Main App Initialization
const app = express();

//Body Parser Middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); //To parse URL-encoded bodies, mostly for html form submissions
app.use(cookieParser()); //To get cookies from requests

// Security and logging middleware
app.use(helmet()); //Security first
app.use(morgan('combined')); //Log all requests
app.use(cors({
  origin: NODE_ENV === 'production' ? 'https://abedalrahman.bilalsaad.com' : 'http://localhost:5500',
  credentials: true
})); //Enable Flutter access
app.use(createGuardianMiddleware());
app.use((req, res, next) => {
  if (req.botDetection.isBot) {
    return res.status(403).json({ error: 'Access denied, Bot Detected!' });
  }
  next();
}); //Block bots

//Rate Limiter Middleware
app.use(limiter); //Rate Limiter Middleware



//Middlewares
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);
app.use('/api/v1/workflow', workflowRouter);

//error handling middleware
app.use(errorMiddleware);

//Additional Routes
app.get('/', (req, res) => {
    res.send("Welcome to Subscription Tracker API!");
});

//Server Initialization
app.listen(PORT, async()=>{
    console.log(`Subscribtion Tracker API is running on http://localhost:${PORT}`);
    await connectDB();

    // Schedule reminder checks to run every hour
    // This ensures reminders are sent as soon as subscriptions enter the 7-day window
    cron.schedule('0 * * * *', async () => {
        console.log('Running scheduled reminder check...');
        try {
            const result = await checkAndSendReminders();
            console.log('Reminder check completed:', result);
        } catch (error) {
            console.error('Error running reminder check:', error);
        }
    });
    
    // Also run on startup to catch any missed reminders
    try {
        console.log('Running initial reminder check on startup...');
        const result = await checkAndSendReminders();
        console.log('Initial reminder check completed:', result);
    } catch (error) {
        console.error('Error running initial reminder check:', error);
    }
    
    console.log('✓ Scheduled task: Reminder checks will run every hour');
});

export default app; 

