const express = require("express");
const router = express.Router();
const Doctor=require("../controllers/doctorsController")
const kycController = require("../controllers/kycController");
const { isDoctorAuth } = require("../middleware/authmiddleware");



router.post('/kyc/createKyc',kycController.createOrUpdateKyc)
router.get('/kyc/:doctorId',  kycController.getById);





module.exports = router;