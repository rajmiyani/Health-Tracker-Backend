const mongoose = require("mongoose");

// Utility regex for HH:mm 24-hour time format validation
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const availabilitySchema = new mongoose.Schema({
  days: {
    type: [String],
    enum: {
      values: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      message: "Day must be a valid weekday",
    },
    validate: {
      validator: function (arr) {
        // if emergency -> allow empty
        if (this.emergency) return true;
        return Array.isArray(arr) && arr.length > 0;
      },
      message: "Days array cannot be empty",
    },
  },
  startTime: {
    type: String,
    validate: {
      validator: function (v) {
        if (this.emergency) return true; // skip check if emergency
        return TIME_REGEX.test(v);
      },
      message: "Start time must be in HH:mm format (e.g., 09:00)",
    },
  },
  endTime: {
    type: String,
    validate: {
      validator: function (v) {
        if (this.emergency) return true; // skip check if emergency
        return TIME_REGEX.test(v);
      },
      message: "End time must be in HH:mm format (e.g., 17:00)",
    },
  },
  emergency: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Cross-field validator: Ensure startTime < endTime (only if not emergency)
availabilitySchema.pre("validate", function (next) {
  if (!this.emergency && this.startTime && this.endTime) {
    const [startHour, startMinute] = this.startTime.split(":").map(Number);
    const [endHour, endMinute] = this.endTime.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    if (start >= end) {
      return next(new Error("Start time must be before end time"));
    }
  }
  next();
});

module.exports = mongoose.model("Availability", availabilitySchema);
