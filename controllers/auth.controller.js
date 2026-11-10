import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

export const signUp = async (req, res, next) => 
    {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            const {name, email, password} = req.body;

            //check for existing user
            const existingUser = await User.findOne({email});

            if(existingUser){
                const error = new Error('User already exists with this email');
                error.statusCode = 409;
                throw error;
            }

            //hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            //create user
            const newUsers = await User.create([{
                name,
                email,
                password: hashedPassword
            }], {session});

            //create token
            const token = jwt.sign({id:newUsers[0]._id}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});

            await session.commitTransaction();
            session.endSession();

            res.status(201).json({
                success: true,
                data: {
                    token: token,
                    user: newUsers[0]
                }
            });
            
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            next(error);
    };
}

export const signIn = async (req, res, next) => 
    {

        try {

            const {email, password} = req.body;

            //check for existing user
            const user = await User.findOne({email});
            
            if(!user){
                const error = new Error('User does not exist with this email');
                error.statusCode = 404;
                throw error;
            }

            //compare password
            const isMatch = await bcrypt.compare(password, user.password);

            if(!isMatch){
                const error = new Error('Invalid Password');
                error.statusCode = 401;
                throw error;
            }

            //create token
            const token = jwt.sign({id:user._id}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});

            res.status(200).json({
                success: true,
                data: {
                    token,
                    user
                }
            });
        } catch (error) {
            next(error);
        }

}
// export const signOut = async (req, res, next) => {};