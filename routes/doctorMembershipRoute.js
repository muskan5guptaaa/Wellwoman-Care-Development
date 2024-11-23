const express=require("express");
const router=express.Router();
const membershipController=require("../controllers/doctorMembershipController")


router.post("/memebership/create-payment",membershipController.createMembershipPayment);



module.exports = router;