const authModel = require("../../model/AuthModel/auth.model.js");
const Patient = require("../../model/DoctorModel/Patient.js"); // Full profile
const validator = require("validator");

// Update patient profile
const updateProfile = async (req, res) => {
  try {
    const patientId = req.user?._id;

    // Find patient profile by authRef
    let patient = await Patient.findOne({ authRef: patientId });
    if (!patient) {
      // If profile doesn't exist, create new
      patient = new Patient({ authRef: patientId });
    }

    const allowedFields = [
      "name",
      "email",
      "phone",
      "dob",
      "gender",
      "bloodGroup",
      "address",
      "medicalHistory",
      "allergies",
      "emergencyContact",
      "insurance",
    ];

    // Validation
    if (req.body.email && !validator.isEmail(req.body.email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (req.body.phone && !validator.isMobilePhone(req.body.phone, "any")) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (req.body.emergencyContact && !validator.isMobilePhone(req.body.emergencyContact, "any")) {
      return res.status(400).json({ message: "Invalid emergency contact number" });
    }

    if (req.body.name && req.body.name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters long" });
    }

    if (req.body.dob) {
      const dobDate = new Date(req.body.dob);
      if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
        return res.status(400).json({ message: "Invalid Date of Birth" });
      }
    }

    if (req.body.gender && !["Male", "Female", "Other"].includes(req.body.gender)) {
      return res.status(400).json({ message: "Gender must be Male, Female, or Other" });
    }

    if (
      req.body.bloodGroup &&
      !["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].includes(req.body.bloodGroup)
    ) {
      return res.status(400).json({ message: "Invalid blood group" });
    }

    // Update allowed fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        patient[field] = req.body[field];
      }
    });

    // Handle profile image
    if (req.file) {
      patient.profileImage = `/uploads/${req.file.filename}`;
    }

    const updatedPatient = await patient.save();

    res.json({
      message: "Profile updated successfully",
      patient: updatedPatient,
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    console.error(error.stack);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// Get patient profile
const getProfile = async (req, res) => {
  try {
    const patientId = req.user?._id;
    let profile = await Patient.findOne({ authRef: patientId });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = new Patient({
        authRef: patientId,
        name: req.user.name || undefined,
        email: req.user.email || undefined,
        phone: req.user.phone || undefined,
        dob: req.user.dob || undefined,
        gender: req.user.gender || undefined,
        bloodGroup: req.user.bloodGroup || undefined,
        address: req.user.address || undefined,
        medicalHistory: req.user.medicalHistory || undefined,
        allergies: req.user.allergies || undefined,
        emergencyContact: req.user.emergencyContact || undefined,
        insurance: req.user.insurance || undefined,
        profileImage: req.user.profileImage || undefined,
      });


      await profile.save();
    }

    res.json({
      success: true,
      patient: profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 Get patient by authRef (authId from token)
const getPatientByAuth = async (req, res) => {
  try {
    const authId = req.user?._id; // from token

    if (!authId) {
      return res.status(400).json({ message: "Missing auth user ID" });
    }

    // Find existing patient
    let patient = await Patient.findOne({ authRef: authId });

    // 🆕 Auto-create patient if not found
    if (!patient) {

      // Optional: fetch Auth user info if available
      const authUser = await authModel.findById(authId);

      patient = await Patient.create({
        authRef: authId,
        name: authUser?.name || "Unnamed Patient",
        email: authUser?.email || "noemail@temp.com",
        phone: authUser?.phone || "",
        gender: authUser?.gender || "Other",
      });
    }

    res.status(200).json({ patientId: patient._id, patient });
  } catch (err) {
    console.error("getPatientByAuth error:", err);
    res.status(500).json({ message: "Error fetching patient", error: err.message });
  }
};



module.exports = { updateProfile, getProfile, getPatientByAuth };
