import { Schema, Model, model, models } from 'mongoose';
import bcrypt from 'bcryptjs';

interface User extends Document {
    username: string;
    email: string;
    password?: string;
    googleId?: string;
    comparePassword(enteredPassword: string): Promise<boolean>;
    forgotPasswordToken: string;
    avatarUrl: string;
    isSignedUpWithGoogle: boolean;
    googleUserName: string;
}

type UserModel = Model<User>;

const userSchema = new Schema<User, UserModel>({
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email alrealy exists'],
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"]
    },
    password: {
        type: String,
        required: function() {
            return !this.isSignedUpWithGoogle; // required only if google id is not present
        },
        minlength: [5, 'Passwords must be at least 5 characters long'],
        trim: true,
        select: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Ensures uniqueness but allows null values
    },
    forgotPasswordToken: { // this key is only for forgot password route, to save a jwt token temporarily.
        type: String,
        required: false,
        trim: true,
        select: false
    },
    avatarUrl: {
        type: String,
        required: false
    },
    isSignedUpWithGoogle: {
        type: Boolean,
        select: false,
        required: [true, 'Please specify whether this user is signed up with google or not']
    },
    googleUserName: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// declaring indexes on these fields
userSchema.index({ username: 1, email: 1 })

userSchema.pre<User>('save', async function (next) {
    const salt = await bcrypt.genSalt(10); // Generate salt
    
    if(this.password) {
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } else if(!this.password && !this.isSignedUpWithGoogle) {
        throw new Error('Cannot hash password');
    }
});

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: UserModel = models.User || model<User, UserModel>('User', userSchema);

export default userModel;