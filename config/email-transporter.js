import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASSWORD } from '../config/env.js';

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
    },
});
export default transporter;