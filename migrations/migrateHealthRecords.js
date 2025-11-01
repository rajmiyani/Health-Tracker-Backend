// migrations/migrateHealthRecords.js
require("dotenv").config();
const mongoose = require("mongoose");
const Patient = require("../model/DoctorModel/Patient.js");
const HealthRecord = require("../model/DoctorModel/HealthRecord.js");
const connectDB = require("../mongoose.js");

(async () => {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Find old health records with patient name as string
    const oldRecords = await HealthRecord.find({ patient: { $type: "string" } });
    console.log(`🔍 Found ${oldRecords.length} old records to migrate`);

    for (const record of oldRecords) {
      const patient = await Patient.findOne({ name: record.patient });
      if (patient) {
        record.patient = patient._id; // ✅ Replace name with ObjectId
        await record.save();
        console.log(`✅ Migrated record ${record._id} → ${patient.name}`);
      } else {
        console.warn(`⚠️ No matching patient found for "${record.patient}"`);
      }
    }

    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
})();
