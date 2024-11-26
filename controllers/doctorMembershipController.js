const Razorpay = require("razorpay");
const Doctor = require("../models/doctorsModel");
const DoctorMembership = require("../models/doctorMembershipModel");
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
      return res.status(404).json({ 
        success: false, message: "Doctor not found" 
    });
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        success: false,
         message: "Invalid amount" 
        });
    }
    // Create a new membership payment record
    const membershipPayment = new DoctorMembership({
      doctorId:mongoose.Types.ObjectId(doctorId),
      razorpay_order_id: order.id, // Save Razorpay Order ID
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

const verifyDoctorMembershipPayment = async (req, res, next) => {
  const {
    doctorId,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  } = req.body;

  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    console.log("Verifying payment for doctorId:", doctorId);
    console.log("Generated Signature:", expectedSignature);
    console.log("Provided Signature:", razorpay_signature);

    if (expectedSignature === razorpay_signature) {
      const membershipPayment = await DoctorMembership.findOneAndUpdate(
        { doctorId, status: "Pending" },
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
      .sort({ createdAt: -1 })
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
  verifyDoctorMembershipPayment,
  getPaymentStatus
};
