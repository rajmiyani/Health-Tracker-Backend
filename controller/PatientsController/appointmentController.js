const Appointment = require("../../model/PatientsModel/Appointment.js");
const Patient = require("../../model/DoctorModel/Patient.js");
const Availability = require("../../model/DoctorModel/Availibility.js");
const Notification = require("../../model/DoctorModel/NotificationModel.js");
const cron = require("node-cron");
const nodemailer = require("nodemailer");

// 📩 Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.bookAppointment = async (req, res) => {
  try {
    const { date, reason } = req.body;
    const authId = req.user?._id;

    if (!authId || !date)
      return res.status(400).json({ message: "Date and patient identity are required" });

    const patient = await Patient.findOne({ authRef: authId });
    if (!patient)
      return res.status(403).json({ message: "You are not registered as a patient" });

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime()) || appointmentDate < new Date())
      return res.status(400).json({ message: "Invalid appointment date" });

    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await Appointment.findOne({
      patient: authId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    if (existing) return res.status(400).json({ message: "You already have an appointment that day" });

    const availability = await Availability.findOne().sort({ updatedAt: -1 });
    if (!availability) return res.status(400).json({ message: "Doctor availability not set" });

    if (availability.emergency)
      return res.status(400).json({ message: "Doctor is currently in Emergency mode ⚡" });

    const dayName = appointmentDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Kolkata" });
    if (!availability.days.includes(dayName))
      return res.status(400).json({ message: `Doctor is not available on ${dayName}` });

    // Time validation
    const [startH, startM] = availability.startTime.split(":").map(Number);
    const [endH, endM] = availability.endTime.split(":").map(Number);
    const localDate = new Date(appointmentDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    const start = new Date(localDate);
    start.setHours(startH, startM, 0, 0);
    const end = new Date(localDate);
    end.setHours(endH, endM, 0, 0);
    if (localDate < start || localDate > end)
      return res.status(400).json({ message: `Doctor available between ${availability.startTime} and ${availability.endTime}` });

    let appointment = await Appointment.create({
      patient: patient._id,
      doctorName: "Dr. Raj Miyani",
      date: appointmentDate,
      reason: reason || "",
    });

    appointment = await Appointment.findById(appointment._id).populate("patient", "name email phone");

    await Notification.create({
      doctorId: "68e8d8fcfd1132a6352c63e6",
      message: `📅 New appointment on ${appointmentDate.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })}`,
    });

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("Book appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// ⏰ CRON JOB FOR REMINDERS
// =========================
cron.schedule("0 9 * * *", async () => {
  console.log("🔔 Running daily appointment reminder job...");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayEnd = new Date(tomorrow);
  dayEnd.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    date: { $gte: tomorrow, $lte: dayEnd },
    status: "Scheduled",
  }).populate("patient", "name email");

  for (const appointment of appointments) {
    if (!appointment.patient?.email) continue;

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px;">
        <div style="max-width: 600px; background: white; margin: auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <div style="background: #007bff; color: white; padding: 20px 30px;">
            <h2>Appointment Reminder</h2>
          </div>
          <div style="padding: 25px; color: #333;">
            <p>Dear <strong>${appointment.patient.name}</strong>,</p>
            <p>This is a friendly reminder that you have an appointment scheduled for <strong>${new Date(appointment.date).toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
    })}</strong> with <strong>${appointment.doctorName}</strong>.</p>
            <p>Please make sure to arrive 10–15 minutes early.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 14px; color: #666;">Thank you,<br />Health Record Tracker Team</p>
          </div>
          <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #555;">
            © ${new Date().getFullYear()} Health Record Tracker for Rural Clinics
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Health Record Tracker" <${process.env.EMAIL_USER}>`,
      to: appointment.patient.email,
      subject: "📅 Appointment Reminder - Tomorrow",
      html: emailHTML,
    });

    console.log(`✅ Reminder sent to ${appointment.patient.email}`);
  }
});


exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: "patient",
        select: "name phone email",
        model: "Patient",
      });

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: "No appointments found" });
    }

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params; // appointment ID from URL
    const { date, time, type, status } = req.body;

    // Find appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update fields if provided
    if (date && time) {
      const [year, month, day] = date.split("-");
      const [hours, minutes] = time.split(":");
      appointment.date = new Date(year, month - 1, day, hours, minutes);
    }

    if (type) appointment.type = type;
    if (status) appointment.status = status;

    await appointment.save();

    // Populate patient data before sending response
    await appointment.populate("patient", "name phone");

    res.status(200).json({
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};