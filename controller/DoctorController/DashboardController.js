const Patient = require("../../model/DoctorModel/Patient.js");
const Appointment = require("../../model/DoctorModel/Appointment.js");
const HealthRecord = require("../../model/DoctorModel/HealthRecord.js");

const getDoctorDashboard = async (req, res) => {
  try {
    // Total Patients
    const totalPatients = await Patient.countDocuments();

    // Critical Patients (status === "Critical")
    const criticalPatients = await Patient.countDocuments({ status: "Critical" });

    // Active Patients (exclude critical patients)
    const activePatients = await Patient.countDocuments({ status: { $ne: "Critical" } });

    // Upcoming Appointments (next 30 days)
    const today = new Date();
    const next15Days = new Date();
    next15Days.setDate(today.getDate() + 15);

    const upcomingAppointments = await Appointment.find({
      date: { $gte: today, $lte: next15Days  },
    }).populate("patient", "name");

    // Recent Activity (last 3 health records)
    const recentActivity = await HealthRecord.find()
      .populate("patient", "name")
      .sort({ date: -1 })
      .limit(3);

    res.json({
      stats: {
        totalPatients,
        activePatients,
        criticalPatients,
        upcomingAppointments: upcomingAppointments.length,
      },
      recentActivity,
      upcomingAppointments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { getDoctorDashboard };