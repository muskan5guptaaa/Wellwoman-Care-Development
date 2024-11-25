const express=require("express");
const router=express.Router();
const membershipController=require("../controllers/doctorMembershipController")


router.post("/memebership/create-payment",membershipController.createMembershipPayment);
router.post("/membership/failed",membershipController.verifyDoctorMembershipPayment)
router.get(
    "/membership/status",

    membershipController.getPaymentStatus
  );
  

module.exports = router;