const express = require("express");
const connectDB = require("./mongoose.js");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("express-flash");
const morgan = require("morgan");
const passport = require("passport");
require("dotenv").config();

// Import controllers and DB
require("./controller/authController/auth.controller.js");
require("./mongoose");

const app = express();
connectDB();

/* ------------------ 🧩 CORS CONFIGURATION ------------------ */
// ✅ Allow both local and live frontend
const allowedOrigins = [
  "http://localhost:3000", // Local development
  "https://health-record-tracker-for-rural-clinics.vercel.app", // Production (Vercel)
];

// Manual CORS setup for full control (handles OPTIONS preflight properly)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

/* ------------------ 🧠 FORCE HTTPS ON RENDER ------------------ */
app.use((req, res, next) => {
  if (
    req.headers["x-forwarded-proto"] !== "https" &&
    process.env.NODE_ENV === "production"
  ) {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

/* ------------------ ⚙️ MIDDLEWARE ------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Session middleware (keep before routes)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "developer",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
  })
);

app.use(flash());

/* ------------------ 🗂 STATIC FILES ------------------ */
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ------------------ 🧭 ROUTES ------------------ */
app.use("/auth", require("./router/AuthRouter/auth.router.js"));
app.use("/patient", require("./router/PatientsRouter/appointmentRoutes.js"));
app.use("/patient", require("./router/PatientsRouter/profileRoutes.js"));
app.use("/patient", require("./router/PatientsRouter/medicalRecordRouter.js"));
app.use("/doctor", require("./router/DoctorRouter/patientRoutes.js"));
app.use("/doctor", require("./router/DoctorRouter/healthRecordRoutes.js"));
app.use("/doctor", require("./router/DoctorRouter/DashboardRouter.js"));
app.use("/doctor", require("./router/DoctorRouter/AvailibilityRouter.js"));
app.use("/doctor", require("./router/DoctorRouter/NotificationRouter.js"));

/* ------------------ 🚫 ERROR HANDLING ------------------ */
// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message || err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

/* ------------------ 🚀 SERVER START ------------------ */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// Handle startup errors
server.on("error", (err) => {
  console.error("❌ Server failed to start:", err);
});
