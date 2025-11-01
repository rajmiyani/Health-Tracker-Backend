const { default: mongoose } = require("mongoose");
const HealthRecord = require("../../model/DoctorModel/HealthRecord.js");
const Patient = require("../../model/DoctorModel/Patient.js");


// ➝ Add Health Record
const addHealthRecord = async (req, res) => {
    try {
        const { patient, date, type, provider, diagnosis, treatment, vitals } = req.body;

        // ✅ Validate required fields
        if (!patient || !date || !type || !provider || !diagnosis || !treatment) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        // ✅ Check if patient exists by name
        const patientExists = await Patient.findOne({ name: patient });
        if (!patientExists) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // ✅ Create record with ObjectId reference
        const healthRecord = await HealthRecord.create({
            patient: patientExists._id,
            date,
            type,
            provider,
            diagnosis,
            treatment,
            vitals: vitals || "N/A",
        });

        res.status(201).json({
            success: true,
            message: "Health record added successfully",
            healthRecord,
        });
    } catch (error) {
        console.error("❌ Error adding health record:", error);
        res.status(500).json({
            success: false,
            message: "Server error while adding health record",
            error: error.message,
        });
    }
};


// ➝ Get All Health Records
const getHealthRecords = async (req, res) => {
    try {
        const records = await HealthRecord.find()
            .populate("patient", "name age gender") // ✅ Populate patient name, age, gender
            .sort({ date: -1 });

        res.status(200).json(records);
    } catch (error) {
        console.error("❌ Error fetching health records:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching health records",
            error: error.message,
        });
    }
};

// ➝ Update Health Record
const updateHealthRecord = async (req, res) => {
    try {
        const updated = await HealthRecord.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Health record not found" });
        }
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ➝ Delete Health Record
const deleteHealthRecord = async (req, res) => {
    try {
        const deleted = await HealthRecord.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Health record not found" });
        }
        res.json({ message: "Health record deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = { addHealthRecord, getHealthRecords, updateHealthRecord, deleteHealthRecord };