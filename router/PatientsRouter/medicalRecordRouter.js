const express = require("express");
const medicalHistory = require("../../controller/PatientsController/MedicalRecordController.js");
const verifyToken = require("../../middleware/authMiddleware.js");

const router = express.Router();

router.get("/history/:patientId", medicalHistory.getMedicalHistory);

router.get("/history/pdf/:patientId", verifyToken, medicalHistory.exportMedicalHistoryPDF);

router.get("/history/excel/:patientId", verifyToken, medicalHistory.exportMedicalHistoryExcel);

router.get("/history/image/:patientId", verifyToken, medicalHistory.exportMedicalHistoryImage);


module.exports = router;
