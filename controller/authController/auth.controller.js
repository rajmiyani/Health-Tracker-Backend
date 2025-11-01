// ===============================
// Imports
// ===============================
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const NotificationModel = require("../../model/DoctorModel/NotificationModel.js");

const AuthModel = require("../../model/AuthModel/auth.model.js");
const sendOtp = require("../../utils/sendOtp");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "developer", {
        expiresIn: "1d",
    });
};

// ✅ Register
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Validation
        if (!name || !email || !phone || !password)
            return res.status(400).json({ message: "All fields are required" });

        if (!/^\S+@\S+\.\S+$/.test(email))
            return res.status(400).json({ message: "Invalid email format" });

        if (!/^[0-9]{10}$/.test(phone))
            return res.status(400).json({ message: "Phone must be 10 digits" });

        if (password.length < 8)
            return res
                .status(400)
                .json({ message: "Password must be at least 8 characters long" });

        const existingUser = await AuthModel.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "User already exists" });

        // Create new user (password will be auto-hashed)
        const newUser = await AuthModel.create({ name, email, phone, password });

        // Create notification for doctor (non-blocking)
        try {
            const doctorId = "68e8d8fcfd1132a6352c63e6";
            await NotificationModel.create({
                doctorId,
                message: `🧍‍♂️ New patient "${newUser.name}" registered with email ${newUser.email}`,
            });
        } catch (notificationErr) {
            console.error("Notification Error:", notificationErr);
        }

        // Response
        res.status(201).json({
            success: true,
            message: "Registered successfully",
            data: { name, email, phone },
        });
    } catch (err) {
        console.error("Register Error:", err);
        res
            .status(500)
            .json({ message: "Server error", error: err.message });
    }
};

// ===============================
// LOGIN
// ===============================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: "Email and password are required" });

        // Find user and include password
        const user = await AuthModel.findOne({ email }).select("+password");
        if (!user)
            return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });

        const token = generateToken(user._id);
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: user,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ===============================
// Google Login (JWT Verification)
// ===============================
exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Token missing" });

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        let user = await AuthModel.findOne({ email });
        if (!user) {
            user = new AuthModel({ name, email, password: "" });
            await user.save();
        }

        const jwtToken = generateToken(user._id);
        res.json({ success: true, token: jwtToken, data: user });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: "Google login failed", error: err.message });
    }
};

// ===============================
// Forgot Password (Send OTP)
// ===============================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await AuthModel.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpiry = Date.now() + 5 * 60 * 1000;
        await user.save();

        await sendOtp(email, otp);

        res.json({ success: true, message: "OTP sent to email" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ===============================
// Verify OTP
// ===============================
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

        const user = await AuthModel.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.otp !== otp || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        user.otp = null;
        user.otpExpiry = null;
        user.canResetPassword = true;
        user.verified = true;
        await user.save();

        res.json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ===============================
// Update Password
// ===============================
exports.updatePassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!email) return res.status(400).json({ message: "Email is required" });
        if (!newPassword || !confirmPassword) return res.status(400).json({ message: "Passwords required" });
        if (newPassword.length < 8) return res.status(400).json({ message: "Password too short" });
        if (newPassword !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });

        const user = await AuthModel.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.canResetPassword) return res.status(400).json({ message: "OTP verification required" });

        user.password = await bcrypt.hash(newPassword, 10);
        user.canResetPassword = false;
        await user.save();

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error("Update Password Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ===============================
// Doctor Static Login
// ===============================
exports.doctorLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: "Username and password required" });

        if (username === (process.env.DOCTOR_USER || "Doctor") && password === (process.env.DOCTOR_PASS || "Doctor@1")) {
            const doctorData = { id: "doctor-001", username, role: "doctor" };
            const token = generateToken(doctorData.id);

            return res.json({ success: true, message: "Doctor logged in successfully", token, data: doctorData });
        }

        return res.status(400).json({ message: "Invalid doctor credentials" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
