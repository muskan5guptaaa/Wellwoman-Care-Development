const express=require("express");
const router=express.Router();
const membershipController=require("../controllers/doctorMembershipController")


router.post("/memebership/create-payment",membershipController.createMembershipPayment);
router.post("/membership/verify",membershipController.verifyDoctorMembershipPayment)

router.post(
    "/membership/status",

    membershipController.getPaymentStatus
  );
  

module.exports = router;