const mongoose = require("mongoose");

const doctorNameRegex = /^[a-zA-Z .]{2,50}$/;

function isFutureDate(value) {
  if (!value) return false;
  return value >= new Date();
}

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
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
      enum: ["Pending", "Scheduled", "Upcoming", "Completed", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

// This avoids OverwriteModelError when nodemon reloads
module.exports = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
