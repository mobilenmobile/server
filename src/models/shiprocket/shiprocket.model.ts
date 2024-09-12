import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const SALT_ROUNDS = 10; // Number of salt rounds for hashing

// Define the schema for the User model
const ShipRocketSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    tokenUpdatedAt: {
        type: Date,
        default: Date.now
    },

}, {
    timestamps: true,
});

ShipRocketSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const hashedPassword = await bcrypt.hash(this.password, SALT_ROUNDS);
        this.password = hashedPassword;
        next();
    } catch (error) {
        console.log(error)
    }
});

// Method to compare provided password with hashed password
ShipRocketSchema.methods.comparePassword = function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Create and export the User model based on the schema
export const ShipRocket = mongoose.model('ShipRocket', ShipRocketSchema);
