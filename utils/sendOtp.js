const nodemailer = require("nodemailer");

const sendOtp = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "rajmiyani15@gmail.com",
        pass: process.env.EMAIL_PASS || "tfng gipz gwyq stll",
      },
    });

    const mailOptions = {
      from: `"HealthCare System" <${process.env.EMAIL_USER || "rajmiyani15@gmail.com"}>`,
      to: email,
      subject: "🔐 Your OTP Code for Verification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin: auto; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
          <div style="background: #007BFF; color:#fff; padding:15px; text-align:center; font-size:20px;">
            HealthCare System
          </div>
          <div style="padding:20px; text-align:center; background:#f9f9f9;">
            <h2 style="color:#333;">Your One-Time Password</h2>
            <p style="font-size:16px; color:#555;">
              Please use the following OTP to complete your verification. 
              This code is valid for <strong>5 minutes</strong>.
            </p>
            <div style="margin:20px auto; display:inline-block; background:#007BFF; color:#fff; font-size:24px; letter-spacing:4px; padding:12px 24px; border-radius:5px;">
              ${otp}
            </div>
            <p style="font-size:14px; color:#777; margin-top:20px;">
              If you didn’t request this, please ignore this email.
            </p>
          </div>
          <div style="background:#f1f1f1; color:#888; text-align:center; padding:10px; font-size:12px;">
            © ${new Date().getFullYear()} HealthCare System. All rights reserved.
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ OTP email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    throw new Error("Email not sent. Please try again later.");
  }
};

module.exports = sendOtp;
