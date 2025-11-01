const express = require("express");

const { getDoctorNotifications } = require("../../controller/DoctorController/notificationsController.js");

const router = express.Router();

router.get("/notifications/:doctorId", getDoctorNotifications);


module.exports = router;
