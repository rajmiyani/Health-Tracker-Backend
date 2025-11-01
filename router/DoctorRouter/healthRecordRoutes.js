const express = require("express");
const router = express.Router();

const {
  addHealthRecord,
  getHealthRecords,
  updateHealthRecord,
  deleteHealthRecord
} = require("../../controller/DoctorController/healthRecordsController.js");

// const authMiddleware = require("../../middleware/authMiddleware.js");

// Routes
router.post("/addRecord", addHealthRecord);
router.get("/allRecords", getHealthRecords);
router.put("/updateRecord/:id", updateHealthRecord);
router.delete("/deleteRecord/:id", deleteHealthRecord);

module.exports = router;