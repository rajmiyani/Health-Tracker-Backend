const mongoose = require("mongoose")

// Custom validator for doctor name (at least 2 chars, only letters, spaces, and dots)
const doctorNameRegex = /^[a-zA-Z .]{2,50}$/;

// Custom validator to check for future date
function isFutureDate(value) {
    if (!value) return false;
    return value >= new Date();
}

const appointmentSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Auth",
            required: [true, "Patient reference is required"],
        },
        doctorName: {
            type: String,
            required: [true, "Doctor name is required"],
            minlength: [2, "Doctor name must be at least 2 characters"],
            maxlength: [50, "Doctor name cannot exceed 50 characters"],
            match: [doctorNameRegex, "Doctor name can only contain letters, spaces, and periods"],
            trim: true,
        },
        date: {
            type: Date,
            required: [true, "Appointment date is required"],
            validate: {
                validator: isFutureDate,
                message: "Appointment date must be today or in the future",
            },
        },
        reason: {
            type: String,
            maxlength: [100, "Reason cannot exceed 100 characters"],
            trim: true,
            default: "",
        },
        status: {
            type: String,
            enum: {
                values: ["Scheduled", "Completed", "Cancelled"],
                message: "Status must be Scheduled, Completed, or Cancelled",
            },
            default: "Scheduled",
        },
    },
    { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;