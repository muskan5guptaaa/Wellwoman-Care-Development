const Razorpay = require("razorpay");
const Doctor = require("../models/doctorsModel");
const Membership = require("../models/doctorMembershipModel");
const crypto = require("crypto");

// Test API Key
const razorpay = new Razorpay({
  key_id: "rzp_test_Pj0gCrLiWmvapz", 
  key_secret: "nBoX60Pp7uCTv5mJxPpkdfty", 
});

const createMembershipPayment = async (req, res, next) => {
  const { doctorId, amount } = req.body;

  try {
    // Validate doctor and amount
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        success: false,
         message: "Invalid amount" 
        });
    }

    // Create a new membership payment record
    const membershipPayment = new Membership({
      doctorId,
      amount,
      transactionId: "",
      paidAt: null,
      status: "Pending",
    });
    await membershipPayment.save();

    // Create Razorpay order
    razorpay.orders.create(
        {
          amount: amount * 100, // Amount in paisa
          currency: "INR",
          receipt: `doc_${doctorId}_${Date.now()}`.slice(0, 40), // Shortened receipt
        },
        (err, order) => {
          if (err) {
            console.error("Order creation error:", err);
            return res.status(400).json({
              success: false,
              message: "Order creation failed",
              error: err,
            });
          }
      
          res.status(200).json({
            success: true,
            message: "Membership order created successfully",
            order,
            membershipPayment,
          });
        }
      );
      
  } catch (error) {
    console.error("Error creating membership payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create membership payment",
      error: error.message,
    });
  }
};

module.exports = {
  createMembershipPayment,
};
