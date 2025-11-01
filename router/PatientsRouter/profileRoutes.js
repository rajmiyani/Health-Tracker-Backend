const express = require("express");
const { updateProfile, getProfile, getPatientByAuth } = require("../../controller/PatientsController/ProfileController.js");
const { upload } = require("../../multer.js");
const protect = require("../../middleware/authMiddleware.js");

const router = express.Router();

router.put("/updateProfile", protect, upload.single("profileImage"), updateProfile);
router.get("/getProfile", protect, getProfile);
router.get("/getByAuth", protect, getPatientByAuth);

module.exports = router;