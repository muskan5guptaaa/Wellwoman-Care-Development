const express = require("express");
const router = express.Router();
const kycController = require("../controllers/kycController");
const { isDoctorAuth } = require("../middleware/authmiddleware");


router.post('/kyc/upload', kycController.uploadKYC);
router.get('/kyc/getId',  kycController.getKYCById);




module.exports = router;