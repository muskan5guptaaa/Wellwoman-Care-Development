const express = require('express');
const router = express.Router();
const doctorController = require("../controllers/doctorsController");
const appointmentController=require("../controllers/appointmentController")
const { signUpDoctor,loginDoctor,forgetPasswordDoctor } = require('../controllers/doctorsController');
const { isDoctorAuth } = require('../middleware/authmiddleware');

// Doctor signup route
router.post('/doctor/signup',     doctorController.signUpDoctor);
router.post('/doctor/login',doctorController.loginDoctor);
router.post('/doctor/forgetPasswordDoctor',doctorController.forgetPasswordDoctor);
router.post('/doctor/changePassword',doctorController.changePasswordDoctor);
router.post('/doctor/sendOtp',doctorController.sendOtpDoctor);
router.post('/doctor/logout',isDoctorAuth,doctorController.logoutDoctor);

router.put('/doctor/:doctorId/availability',doctorController.updateAvailabilityDoctor)
router.post('/doctor/book',appointmentController.bookAppointment)
//admin
router.get('/admin/getAllDoctors',doctorController.getAllDoctors);





module.exports = router;
