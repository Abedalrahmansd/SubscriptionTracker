import mongoos from 'mongoose';

const userSchema = new mongoos.Schema({

    name:{
        type: String,
        required: [ true, 'User Name is required' ],
        minlength: 2,
        maxlength: 50,
        trim: true
    },

    email:{
        type: String,
        required: [ true, 'User Email is required' ],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },

    password:{
        type: String,
        required: [ true, 'User Password is required' ],
        minlength: 6
    },

}, { timestamps: true });

const User = mongoos.model('User', userSchema);

export default User;