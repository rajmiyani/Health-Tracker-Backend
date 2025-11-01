const Availability = require("../../model/DoctorModel/Availibility.js");

exports.setAvailability = async (req, res) => {
  try {
    const { days, startTime, endTime, emergency } = req.body;

    // Validate emergency
    if (typeof emergency !== "boolean") {
      return res.status(400).json({ message: "Emergency must be boolean" });
    }

    // Validate days if not emergency
    const validDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    if (!emergency) {
      if (!Array.isArray(days) || days.length === 0) {
        return res.status(400).json({ message: "At least one working day is required" });
      }
      if (!days.every(d => validDays.includes(d))) {
        return res.status(400).json({ message: "Invalid days selected" });
      }

      // Validate startTime and endTime (HH:MM)
      const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
      if (!startTime || !endTime || !timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return res.status(400).json({ message: "Invalid start or end time" });
      }
      if (startTime >= endTime) {
        return res.status(400).json({ message: "Start time must be before end time" });
      }
    }

    // Find the single availability (static doctor system)
    let availability = await Availability.findOne();
    console.log("Existing availability:", availability);
    

    if (availability) {
      // Update
      availability.days = emergency ? [] : days;
      availability.startTime = emergency ? null : startTime;
      availability.endTime = emergency ? null : endTime;
      availability.emergency = emergency;
      await availability.save();
    } else {
      // Create new
      availability = await Availability.create({
        days: emergency ? [] : days,
        startTime: emergency ? null : startTime,
        endTime: emergency ? null : endTime,
        emergency,
      });
    }

    res.status(200).json({
      message: "Availability saved successfully ✅",
      availability,
    });
  } catch (error) {
    console.error("Set availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyAvailability = async (req, res) => {
  try {
    const availability = await Availability.findOne();

    if (!availability) {
      return res.status(404).json({ message: "No availability set yet" });
    }

    res.status(200).json(availability);
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
};