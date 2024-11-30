const Razorpay = require("razorpay");
const Doctor = require("../models/doctorsModel");
const DoctorMembership = require("../models/doctorMembershipModel");
const crypto = require("crypto");
const mongoose=require("mongoose")

// Test API Key
const razorpay = new Razorpay({
  key_id: "rzp_test_Pj0gCrLiWmvapz", 
  key_secret: "nBoX60Pp7uCTv5mJxPpkdfty", 
});

const createMembershipPayment = async (req, res, next) => {
  const { doctorId, amount } = req.body;

  try {
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }
    const membershipPayment = new DoctorMembership({
      doctorId,
      amount,
      transactionId: "",
      paidAt: null,
      status: "Pending",
    });

    await membershipPayment.save();

    razorpay.orders.create(
      {
        amount: amount * 100, // Razorpay accepts amount in paisa
        currency: "INR",
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
          message: "Doctor membership payment initiated successfully",
          order,
          membershipPayment,
        });
      }
    );
  } catch (error) {
    console.error("Error creating doctor membership payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create membership order",
      error: error.message,
    });
  }
};



const verifyMembershipPayment = async (req, res, next) => {
  const {
    doctorId,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  } = req.body;

  try {
    // Ensure doctorId, payment_id, and order_id are provided
    if (!doctorId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }
    // Validate if the payment_id and order_id are unique
    const existingPayment = await DoctorMembership.findOne({
      transactionId: razorpay_payment_id,
    });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already verified",
      });
    }
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    console.log("Generated Signature:", expectedSignature);
    console.log("Provided Signature:", razorpay_signature);

    if (expectedSignature === razorpay_signature) {
      const membershipPayment = await DoctorMembership.findOneAndUpdate(
        { doctorId, 
     
          status: "Pending" },
        {
          transactionId: razorpay_payment_id,
          paidAt: new Date(),
          status: "Completed",
        },
        { new: true }
      );

      if (!membershipPayment) {
        return res.status(404).json({
          success: false,
          message: "Payment record not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: membershipPayment,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }
  } catch (e) {
    console.error("Error verifying doctor membership payment:", e);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: e.message,
    });
  }
};

const getPaymentStatus = async (req, res, next) => {
  const {doctorId }= req.body;
  try {
    const membershipPayment= await DoctorMembership.findOne({ doctorId })
      .sort({
         createdAt: -1 
        })
      .limit(1)
      .exec();

    if (!membershipPayment) {
      return res.status(404).json({
        success: false,
        message: "No Payment Record Found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Payment Details Retrieved Successfully",
      data: {
        status: membershipPayment.status,
        transactionId: membershipPayment.transactionId,
        paidAt: membershipPayment.paidAt,
        amount:membershipPayment.amount,
        createdAt: membershipPayment.createdAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving payment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment status",
      error: error.message,
    });
  }
};

module.exports = {
  createMembershipPayment,
  verifyMembershipPayment,
  getPaymentStatus
};
