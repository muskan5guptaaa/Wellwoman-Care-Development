
const crypto = require("crypto");

// Generate a 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
const sendOtp = async ({ otp, phone, email }) => {
    if (phone) {
        const response = await sendOtpViaSMS(phone, otp);
        return response;
    } else if (email) {
        const response = await sendOtpViaEmail(email, otp);
        return response;
    } else {
        throw new Error("Phone or email is required to send OTP");
    }
};

const sendOtpViaSMS = async (phone, otp) => {
    console.log(`OTP ${otp} sent to phone number ${phone}`);
    return { success: true, message: "OTP sent via SMS" };
};

const sendOtpViaEmail = async (email, otp) => {
    console.log(`OTP ${otp} sent to email ${email}`);
    return { success: true, message: "OTP sent via Email" };
};

module.exports = {
    generateOtp,
    sendOtp
};
