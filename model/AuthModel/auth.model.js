const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define Auth Schema
const authSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [3, "Name must be at least 3 characters long"],
            maxlength: [50, "Name cannot exceed 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            match: [/^[0-9]{10}$/, "Phone number must be exactly 10 digits"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
            select: false, // prevent password from being returned in queries
        },
        otp: {
            type: String,
            default: null,
        },
        otpExpiry: {
            type: Date,
            default: null,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        canResetPassword: { type: Boolean, default: false }, // flag to allow password reset after OTP verification
    },
    { timestamps: true }
);

// 🔐 Pre-save hook to hash password
authSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next(); // only hash if password is modified
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// 🔑 Method to compare password during login
authSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Export Model
module.exports = mongoose.model("Auth", authSchema);
