const express = require("express");
const router = express.Router();
const Doctor=require("../controllers/doctorsController")
const kycController = require("../controllers/kycController");
const { isDoctorAuth } = require("../middleware/authmiddleware");


router.post('/kyc/upload', isDoctorAuth,kycController.uploadKYC);
router.get('/kyc/getId',  isDoctorAuth,kycController.getKYCById);

router.post('/kyc/createKyc',kycController.createOrUpdateKyc)



module.exports = router;