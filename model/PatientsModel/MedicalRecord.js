// const mongoose = require("mongoose")

// const medicalRecordSchema = new mongoose.Schema(
//   {
//     patientId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Patient",
//       required: [true, "Patient ID is required."],
//     },
//     date: {
//       type: Date,
//       required: [true, "Date is required."],
//       validate: {
//         validator: function(value) {
//           return value <= new Date();
//         },
//         message: "Date cannot be in the future.",
//       },
//     },
//     diagnosis: {
//       type: String,
//       trim: true,
//       maxlength: [400, "Diagnosis should not exceed 400 characters."],
//       required: [true, "Diagnosis information is required."],
//     },
//     prescription: {
//       type: String,
//       trim: true,
//       maxlength: [400, "Prescription should not exceed 400 characters."],
//       default: "",
//     },
//     bloodPressure: {
//       type: String,
//       trim: true,
//       match: [/^\d{2,3}\/\d{2,3}$/, "Blood pressure must be like 120/80"],
//       required: false,
//     },
//     weight: {
//       type: Number,
//       min: [1, "Weight must be greater than 0."],
//       max: [300, "Weight must be less than 300 kg."],
//       required: false,
//     },
//     sugarLevel: {
//       type: String,
//       trim: true,
//       match: [/^\d{1,3}(\.\d{1,2})?$/, "Sugar level must be a valid number."],
//       required: false,
//     },
//     notes: {
//       type: String,
//       trim: true,
//       maxlength: [1000, "Notes should not exceed 1000 characters."],
//       default: "",
//     }
//   },
//   {
//     timestamps: true,
//   }
// );

// const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);
// module.exports = MedicalRecord;