import User from '../models/user.model.js';

export const getUsers = async (req, res, next) => {
    try {
        
        // Only the signed-in user's own record: there is no admin role, so listing everyone would expose other users' emails
        const users = await User.find({ _id: req.user._id }).select('-password');

        res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        next(error);
    }
}

export const getUser = async (req, res, next) => {
    try {

        if (req.user._id != req.params.id) {
            const error = new Error('Unauthorized access to this user');
            error.statusCode = 403;
            throw error;
        }

        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        next(error);
    }
}