const express = require("express");
const { getDoctorDashboard } = require("../../controller/DoctorController/DashboardController.js");

const router = express.Router();

router.get("/dashboard", getDoctorDashboard);

module.exports = router;
