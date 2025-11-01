const mongoose = require("mongoose");

const healthRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient reference is required"],
    },

    date: {
      type: Date,
      required: [true, "Date of record is required"],
    },
    type: {
      type: String,
      enum: {
        values: ["Consultation", "Lab Results"],
        message: "Type must be either 'Consultation' or 'Lab Results'",
      },
      required: [true, "Record type is required"],
    },

    provider: {
      type: String,
      required: [true, "Provider name is required"],
      trim: true,
    },

    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
      trim: true,
    },

    treatment: {
      type: String,
      required: [true, "Treatment is required"],
      trim: true,
    },

    vitals: {
      type: String,
      default: "N/A",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HealthRecord", healthRecordSchema);
