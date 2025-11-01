const express = require("express");
const { bookAppointment, getMyAppointments, updateAppointment } = require("../../controller/PatientsController/appointmentController.js");
const verifyToken = require("../../middleware/authMiddleware.js"); // ✅ Don't destructure, you exported with module.exports

const router = express.Router();

router.post("/bookAppointment", verifyToken, bookAppointment);

router.get("/getAppointments", getMyAppointments);
router.put("/updateAppointment/:id", updateAppointment);

module.exports = router;
