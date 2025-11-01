const jwt = require("jsonwebtoken");
const Auth = require("../model/AuthModel/auth.model.js"); // Import the Auth model

const verifyToken = async (req, res, next) => {
  try {
    // 1️⃣ Get token from multiple possible sources:
    let token =
      req.cookies?.token || // from cookies
      req.headers["authorization"] || // from header
      req.query.token; // ✅ from query param (for downloads)

    // If it’s from header like "Bearer xxxxx", remove the prefix
    if (token && token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trim();
    }

    // 2️⃣ If still no token, deny access
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. No token provided.",
      });
    }

    // 3️⃣ Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "developer");
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token. Please login again.",
        error: err.message,
      });
    }

    // 4️⃣ Ensure payload has user ID
    if (!decoded || !decoded.id) {
      return res.status(400).json({
        success: false,
        message: "Invalid token payload. User ID missing.",
      });
    }

    // 5️⃣ Find user in DB
    const authUser = await Auth.findById(decoded.id).select("-password");
    if (!authUser) {
      return res.status(404).json({
        success: false,
        message: "User account not found. Please register or login again.",
      });
    }

    // 6️⃣ Attach user info to request
    req.user = authUser;

    // 7️⃣ Continue
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error while verifying token.",
      error: error.message,
    });
  }
};

module.exports = verifyToken;
