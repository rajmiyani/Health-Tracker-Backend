const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor ID is required"],
      validate: {
        validator: function(v) {
          return mongoose.Types.ObjectId.isValid(v);
        },
        message: "Doctor ID must be a valid ObjectId"
      }
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      minLength: [1, "Notification message cannot be empty"]
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
