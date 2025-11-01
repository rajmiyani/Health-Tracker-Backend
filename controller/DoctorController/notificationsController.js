const mongoose = require('mongoose');
const Notification = require("../../model/DoctorModel/NotificationModel.js");

exports.getDoctorNotifications = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;

        // Validate doctorId format
        if (
            !doctorId ||
            !mongoose.Types.ObjectId.isValid(doctorId) ||
            String(new mongoose.Types.ObjectId(doctorId)) !== doctorId
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctorId parameter. It must be a valid MongoDB ObjectId."
            });
        }

        // Fetch notifications, sort by creation date (newest first), and limit results
        const notifications = await Notification.find({ doctorId })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Error fetching notifications",
            error: err.message
        });
    }
};
