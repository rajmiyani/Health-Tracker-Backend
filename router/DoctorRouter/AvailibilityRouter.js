const express = require("express");
const router = express.Router();
const availabilityController = require("../../controller/DoctorController/setAvailibilityController.js");


router.post("/setAvailability", availabilityController.setAvailability);
router.get("/getAvailability", availabilityController.getMyAvailability);

module.exports = router;
