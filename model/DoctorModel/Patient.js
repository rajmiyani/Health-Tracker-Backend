const mongoose = require("mongoose");

// Custom validator for phone numbers (10 digit Indian format)
const phoneRegex = /^[6-9]\d{9}$/;
const validatePhone = {
    validator: (v) => phoneRegex.test(v),
    message: "Phone number must be a valid 10-digit Indian number.",
};

// Custom validator for email format
const emailRegex = /^\S+@\S+\.\S+$/;

const patientSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
        },
        authRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Auth",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Name is required"],
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
            trim: true,
        },
        age: {
            type: Number,
            required: [true, "Age is required"],
            min: [0, "Age must be at least 0"],
            max: [120, "Age cannot exceed 120"],
        },
        gender: {
            type: String,
            enum: { values: ["Male", "Female"], message: "Gender must be Male or Female" },
            required: [true, "Gender is required"],
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            validate: validatePhone,
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            match: [emailRegex, "Please enter a valid email address"],
            lowercase: true,
            trim: true,
        },
        allergies: {
            type: String,
            maxlength: [100, "Allergies description can't exceed 100 characters"],
            default: "",
        },
        status: {
            type: String,
            enum: { values: ["Active", "Critical"], message: "Status must be Active or Critical" },
            default: "Active",
        },
        nextVisit: { type: Date, default: null },
        history: [
            {
                date: { type: Date, required: true },
                details: { type: String, required: true, trim: true },
            },
        ],
        appointments: [
            {
                date: { type: Date, required: true },
                doctor: { type: String, required: true, trim: true },
                status: {
                    type: String,
                    enum: ["Pending", "Scheduled", "Upcoming", "Completed", "Cancelled"],
                    default: "Pending",
                },
            },
        ],
        prescriptions: [
            {
                date: { type: Date, required: true },
                medicine: { type: String, required: true, trim: true },
                duration: { type: String, required: true, trim: true },
            },
        ],
    },
    { timestamps: true }
);

// 🔹 Ensure one patient per doctor
patientSchema.index({ doctorId: 1, authRef: 1 }, { unique: true });

module.exports = mongoose.model("Patient", patientSchema);
