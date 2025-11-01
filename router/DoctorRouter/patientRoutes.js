const express = require("express");
const router = express.Router();
const {
  addPatient,
  getPatients,
  getPatientById,
  updatePatient,
  addHistory,
  addAppointment,
  addPrescription,
  updateAppointment,
  deleteAppointment,
  updatePrescription,
  deletePrescription
} = require("../../controller/DoctorController/patientController.js");
const authMiddleware = require("../../middleware/authMiddleware.js");

router.post("/addPatient", authMiddleware, addPatient);

router.get("/allPatient", getPatients);

router.get("/allPatient/:id", getPatientById);

router.put("/updatePatient/:id", updatePatient);

router.post("/addHistory/:id", addHistory);

router.post("/addAppointment/:id", addAppointment);

router.post("/addPrescription/:id", addPrescription);

router.put("/updateAppointment/:id/:appointmentId", updateAppointment);
router.delete("/deleteAppointment/:id/:appointmentId", deleteAppointment);

router.put("/updatePrescription/:id/:prescriptionId", updatePrescription);
router.delete("/deletePrescription/:id/:prescriptionId", deletePrescription);

module.exports = router;
