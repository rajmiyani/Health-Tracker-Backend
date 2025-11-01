const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Indian-style phone validation (10-digit starting with 6-9)
const phoneRegex = /^[6-9]\d{9}$/;

// Generic email regex
const emailRegex = /^\S+@\S+\.\S+$/;

// Blood group validation
const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const patientSchema = new mongoose.Schema(
  {
    authRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth", // Match your auth.model name
      required: true,
      unique: true, // One profile per auth account
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
    //   unique: true,
      trim: true,
      lowercase: true,
      match: [emailRegex, "Please provide a valid email address"],
    },

    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || phoneRegex.test(v);
        },
        message: "Phone number must be a valid 10-digit Indian number",
      },
    },

    profileImage: {
      type: String,
      default: "",
      maxlength: [300, "Image URL/path is too long"],
      trim: true,
    },

    dob: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v <= new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    bloodGroup: {
      type: String,
      enum: {
        values: bloodGroups,
        message: "Invalid blood group",
      },
    },

    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },

    medicalHistory: {
      type: String,
      trim: true,
      maxlength: [500, "Medical history cannot exceed 500 characters"],
    },

    allergies: {
      type: String,
      trim: true,
      maxlength: [300, "Allergies info cannot exceed 300 characters"],
    },

    emergencyContact: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || phoneRegex.test(v);
        },
        message: "Emergency contact must be a valid 10-digit Indian number",
      },
    },

    insurance: {
      type: String,
      trim: true,
      maxlength: [100, "Insurance details cannot exceed 100 characters"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientProfile", patientSchema);
