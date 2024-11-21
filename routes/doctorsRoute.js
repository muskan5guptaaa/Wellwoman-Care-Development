const express = require('express');
const router = express.Router();
const doctorController = require("../controllers/doctorsController");
const appointmentController=require("../controllers/appointmentController")
const { signUpDoctor,loginDoctor,forgetPasswordDoctor } = require('../controllers/doctorsController');
const { isDoctorAuth } = require('../middleware/authmiddleware');
const { createBankDetail, getBankDetails, updateBankDetail, deleteBankDetail } = require('../controllers/bankdetailsController');


// Doctor signup route
router.post('/doctor/signup', doctorController.signUpDoctor);
router.post('/doctor/login',doctorController.loginDoctor);
router.post('/doctor/forgetPasswordDoctor',doctorController.forgetPasswordDoctor);
router.post('/doctor/changePassword',doctorController.changePasswordDoctor);
router.post('/doctor/sendOtp',doctorController.sendOtpDoctor);
router.post('/doctor/logout',isDoctorAuth,doctorController.logoutDoctor);

router.put('/doctor/:doctorId/availability',doctorController.updateAvailabilityDoctor)
router.post("/doctor/:doctorId/book",appointmentController.bookAppointment);

//bank details
router.post("/doctor/bank-details", createBankDetail);
router.get("/doctor/:doctorId", getBankDetails)
router.put("/doctor/update/:doctorId", updateBankDetail)
router.delete("/doctor/delete/:doctorId",deleteBankDetail)


//admin
router.get('/admin/getAllDoctors',doctorController.getAllDoctors);





module.exports = router;
