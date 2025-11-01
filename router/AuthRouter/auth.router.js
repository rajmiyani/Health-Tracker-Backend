const express = require("express");
const router = express.Router();
const passport = require("passport");

const authController = require("../../controller/authController/auth.controller.js");

// Patient Authentication
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);

// Password update should only be protected if user is logged in
router.post("/update-password", authController.updatePassword);

// Doctor Static Login
router.post("/doctor-login", authController.doctorLogin);

// Google OAuth
// Initiate Google login
// router.post(
//   "/google-login",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

router.post("/google-login", authController.googleLogin);

// Google OAuth callback
// router.get(
//   "/google/callback",
//   passport.authenticate("google", { failureRedirect: "/login-failure", session: false }),
//   authController.googleCallback
// );

// Failure Route (Optional)
router.get("/login-failure", (req, res) => {
  res.status(401).json({ success: false, message: "Google login failed" });
});

module.exports = router;
