const Patient = require("../../model/DoctorModel/Patient.js");
const PatientData = require("../../model/AuthModel/auth.model.js");
const nodemailer = require("nodemailer");

// Utility functions for validation
const isValidDate = (date) => !isNaN(Date.parse(date));
const isNonEmptyString = (str) => typeof str === "string" && str.trim().length > 0;

// Add Patient Controller
const addPatient = async (req, res) => {
  try {
    const doctorId = req.user._id; // doctor logged in
    const { name, age, gender, phone, email, allergies, nextVisit, status } = req.body;

    // 🔹 Step 0: Validations
    if (!name || !email || !phone || !gender || !age) {
      return res.status(400).json({
        message: "Validation error",
        errors: {
          name: !name ? "Name is required" : undefined,
          email: !email ? "Email is required" : undefined,
          phone: !phone ? "Phone number is required" : undefined,
          gender: !gender ? "Gender is required" : undefined,
          age: !age ? "Age is required" : undefined,
        },
      });
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    // 🔹 Step 1: Ensure patient exists in AuthModel
    const registeredPatient = await PatientData.findOne({ email: email.toLowerCase(), phone });
    console.log("Registered Patient:", registeredPatient);

    if (!registeredPatient) {
      return res.status(404).json({ message: "This patient is not registered. Please ask patient to register first." });
    }

    // 🔹 Step 2: Check if already linked to this doctor
    const existingPatient = await Patient.findOne({ doctorId, authRef: registeredPatient._id });
    console.log("Existing Patient Check:", existingPatient);
    if (existingPatient) {
      return res.status(409).json({ message: "This patient is already in your list." });
    }

    // 🔹 Step 3: Create new patient record
    const newPatient = new Patient({
      doctorId,
      authRef: registeredPatient._id,
      name: name.trim(),
      age: parseInt(age, 10),
      gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(),
      phone: phone.trim(),
      email: email.toLowerCase(),
      allergies: Array.isArray(allergies) ? allergies.join(", ") : allergies || "",
      nextVisit: nextVisit ? new Date(nextVisit) : null,
      status: status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "Active",
    });

    await newPatient.save();

    return res.status(201).json({
      message: "Patient added successfully to doctor's list",
      patient: newPatient,
    });
  } catch (error) {
    console.error("Add Patient Error:", error.message);
    res.status(500).json({ message: "Server error while adding patient" });
  }
};


// Get Patients Controller
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error("Get Patients Error:", error);
    res.status(500).json({ message: "Server error while fetching patients" });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Validate updatable fields (example: name, age)
    if (req.body.name && !isNonEmptyString(req.body.name)) {
      return res.status(400).json({ message: "Name must be a non-empty string" });
    }
    if (req.body.age && (typeof req.body.age !== "number" || req.body.age < 0 || req.body.age > 120)) {
      return res.status(400).json({ message: "Age must be a number between 0 and 120" });
    }
    if (req.body.nextVisit && !isValidDate(req.body.nextVisit)) {
      return res.status(400).json({ message: "nextVisit must be a valid date" });
    }
    // Add more checks as needed...

    Object.assign(patient, req.body); // Merge request body fields
    const updatedPatient = await patient.save();
    res.json(updatedPatient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const addHistory = async (req, res) => {
  try {
    const { date, details } = req.body;
    if (!date || !isValidDate(date)) {
      return res.status(400).json({ message: "Valid date is required" });
    }
    if (!details || !isNonEmptyString(details)) {
      return res.status(400).json({ message: "History details are required" });
    }
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    patient.history.push({ date: new Date(date), details: details.trim() });
    await patient.save();
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const addAppointment = async (req, res) => {
  try {
    const { date, doctor, status } = req.body;

    // ✅ Find Patient
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Ensure appointments array exists
    if (!Array.isArray(patient.appointments)) {
      patient.appointments = [];
    }

    // Create appointment object
    const appointmentDate = date ? new Date(date) : new Date();
    const appointment = {
      date: appointmentDate,
      doctor: doctor || "Dr. Raj Miyani",
      status: status || "Pending",
    };

    // ✅ Push and Save Appointment
    patient.appointments.push(appointment);
    await patient.save();

    // ✅ Email Reminder
    if (patient.email) {
      // Configure Email Transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Professional HTML Template
      const mailOptions = {
        from: `"HealthTracker Clinic" <${process.env.EMAIL_USER}>`,
        to: patient.email,
        subject: "🩺 Appointment Confirmation - HealthTracker Clinic",
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="background-color: #198754; padding: 15px 20px; border-top-left-radius: 10px; border-top-right-radius: 10px;">
                <h2 style="margin: 0; color: #fff;">HealthTracker Clinic</h2>
                <p style="margin: 0; color: #d1e7dd;">Your Health, Our Priority</p>
              </div>

              <!-- Content -->
              <div style="padding: 25px;">
                <h3 style="color: #333;">Appointment Confirmed ✅</h3>
                <p>Dear <strong>${patient.name}</strong>,</p>
                <p>Your appointment has been successfully scheduled.</p>

                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Doctor</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${appointment.doctor}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${appointmentDate.toDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Status</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${appointment.status}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Patient ID</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${patient._id}</td>
                  </tr>
                </table>

                <p style="margin-top: 20px; color: #555;">
                  Please arrive 10 minutes before your appointment time. If you need to reschedule, contact us early.
                </p>

                <div style="text-align: center; margin-top: 25px;">
                  <a href="#"
                    style="background-color: #198754; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    View Appointment
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f1f1f1; text-align: center; padding: 10px; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
                <p style="font-size: 12px; color: #666;">© ${new Date().getFullYear()} HealthTracker Clinic. All rights reserved.</p>
              </div>

            </div>
          </div>
        `,
      };

      // Send Email
      await transporter.sendMail(mailOptions);
    }

    // ✅ Response
    res.json({
      message: "Appointment added successfully and email sent.",
      patient,
    });
  } catch (err) {
    console.error("Error adding appointment:", err);
    res.status(500).json({ message: err.message });
  }
};


// @desc Add prescription
// @route POST /api/patients/:id/prescriptions
const addPrescription = async (req, res) => {
  try {
    const { date, medicine, duration } = req.body;
    if (!date || !isValidDate(date)) {
      return res.status(400).json({ message: "Valid date is required" });
    }
    if (!medicine || !isNonEmptyString(medicine)) {
      return res.status(400).json({ message: "Medicine is required" });
    }
    if (!duration || !isNonEmptyString(duration)) {
      return res.status(400).json({ message: "Duration is required" });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    patient.prescriptions.push({
      date: new Date(date),
      medicine: medicine.trim(),
      duration: duration.trim()
    });
    await patient.save();
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { id, appointmentId } = req.params;
    const { date, doctor, status } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const appointment = patient.appointments.id(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (date && isValidDate(date)) appointment.date = new Date(date);
    if (doctor && isNonEmptyString(doctor)) appointment.doctor = doctor.trim();
    if (status && isNonEmptyString(status)) appointment.status = status.trim();

    await patient.save();
    res.json({ message: "Appointment updated successfully", patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Delete Appointment
// @route DELETE /api/patients/:id/appointments/:appointmentId
const deleteAppointment = async (req, res) => {
  try {
    const { id, appointmentId } = req.params;

    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const appointment = patient.appointments.id(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    appointment.deleteOne();
    await patient.save();

    res.json({ message: "Appointment deleted successfully", patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Update Prescription
// @route PUT /api/patients/:id/prescriptions/:prescriptionId
const updatePrescription = async (req, res) => {
  try {
    const { id, prescriptionId } = req.params;
    const { date, medicine, duration } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const prescription = patient.prescriptions.id(prescriptionId);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    if (date && isValidDate(date)) prescription.date = new Date(date);
    if (medicine && isNonEmptyString(medicine)) prescription.medicine = medicine.trim();
    if (duration && isNonEmptyString(duration)) prescription.duration = duration.trim();

    await patient.save();
    res.json({ message: "Prescription updated successfully", patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Delete Prescription
// @route DELETE /api/patients/:id/prescriptions/:prescriptionId
const deletePrescription = async (req, res) => {
  try {
    const { id, prescriptionId } = req.params;

    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const prescription = patient.prescriptions.id(prescriptionId);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    prescription.deleteOne();
    await patient.save();

    res.json({ message: "Prescription deleted successfully", patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addPatient, getPatients, getPatientById, updatePatient, addHistory, addAppointment, addPrescription, updateAppointment, deleteAppointment, updatePrescription, deletePrescription };