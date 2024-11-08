// otpHelpers.js

const crypto = require("crypto");

// Generate a 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP based on payload type (SMS or Email)
const sendOtp = async ({ otp, phone, email }) => {
    if (phone) {
        // Logic for sending OTP via SMS
        const response = await sendOtpViaSMS(phone, otp);
        return response;
    } else if (email) {
        // Logic for sending OTP via Email
        const response = await sendOtpViaEmail(email, otp);
        return response;
    } else {
        throw new Error("Phone or email is required to send OTP");
    }
};

// Mock function for SMS
const sendOtpViaSMS = async (phone, otp) => {
    // Integration with SMS service provider here
    console.log(`OTP ${otp} sent to phone number ${phone}`);
    return { success: true, message: "OTP sent via SMS" };
};

// Mock function for Email
const sendOtpViaEmail = async (email, otp) => {
    // Integration with Email service provider here
    console.log(`OTP ${otp} sent to email ${email}`);
    return { success: true, message: "OTP sent via Email" };
};

module.exports = {
    generateOtp,
    sendOtp
};
