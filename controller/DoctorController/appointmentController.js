import Appointment from "../models/Appointment.js";
import nodemailer from "nodemailer";

// Book Appointment
export const bookAppointment = async (req, res) => {
    try {
        const { patientId, doctorName, date, reason, patientEmail, patientName } = req.body;

        // ✅ Input validation
        if (!patientId || !doctorName || !date || !patientEmail || !patientName) {
            return res
                .status(400)
                .json({ message: "patientId, doctorName, date, patientEmail, and patientName are required" });
        }

        if (typeof doctorName !== "string" || doctorName.trim().length < 2) {
            return res.status(400).json({ message: "doctorName must be at least 2 characters" });
        }

        const appointmentDate = new Date(date);
        if (isNaN(appointmentDate.getTime()) || appointmentDate < new Date()) {
            return res.status(400).json({ message: "Date must be a valid future date" });
        }

        // ✅ Create appointment in database
        const appointment = await Appointment.create({
            patient: patientId,
            doctorName,
            date,
            reason,
        });

        // ✅ Setup Nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER, // your clinic email
                pass: process.env.EMAIL_PASS, // your app password (not raw password)
            },
        });

        // ✅ Email HTML Template (Professional Clinic Design)
        const mailOptions = {
            from: `"HealthTracker Clinic" <${process.env.EMAIL_USER}>`,
            to: patientEmail,
            subject: "🩺 Appointment Confirmation - HealthTracker Clinic",
            html: `
        <div style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
            
            <div style="background-color: #28a745; padding: 15px 20px; border-top-left-radius: 10px; border-top-right-radius: 10px; color: #fff;">
              <h2 style="margin: 0;">HealthTracker Clinic</h2>
              <p style="margin: 0; font-size: 14px;">Your trusted healthcare partner</p>
            </div>

            <div style="padding: 25px;">
              <h3 style="color: #333;">Appointment Confirmed ✅</h3>
              <p>Dear <strong>${patientName}</strong>,</p>
              <p>We’re happy to inform you that your appointment has been successfully scheduled.</p>

              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Doctor</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">Dr. ${doctorName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${appointmentDate.toDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reason</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${reason || "General Checkup"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Patient ID</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${patientId}</td>
                </tr>
              </table>

              <p style="margin-top: 20px; color: #555;">
                Please arrive 10 minutes before your scheduled time.
              </p>

              <div style="margin-top: 25px; text-align: center;">
                <a href="#" 
                   style="background-color: #28a745; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                   View Appointment
                </a>
              </div>

              <p style="margin-top: 25px; font-size: 13px; color: #888;">
                For any questions or changes, please contact us at <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>.
              </p>
            </div>

            <div style="background-color: #f1f1f1; text-align: center; padding: 10px; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
              <p style="font-size: 12px; color: #666;">© ${new Date().getFullYear()} HealthTracker Clinic. All rights reserved.</p>
            </div>

          </div>
        </div>
      `,
        };

        // ✅ Send Email
        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: "Appointment booked successfully and email sent.",
            appointment,
        });
    } catch (error) {
        console.error("Appointment booking error:", error);

        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);
            return res.status(422).json({ message: "Validation failed", errors });
        }

        res.status(500).json({ message: error.message });
    }
};

// Get all Appointments
export const getAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate("patient", "name age gender phone email");
        if (!appointments || appointments.length === 0) {
            return res.status(404).json({ message: "No appointments found" });
        }
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
