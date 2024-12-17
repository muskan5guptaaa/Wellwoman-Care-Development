const express = require('express');
const router = express.Router();
const doctorController = require("../controllers/doctorsController");
const appointmentController = require("../controllers/appointmentController");
const { isDoctorAuth } = require('../middleware/authmiddleware');
const { createBankDetail, getBankDetails, updateBankDetail, deleteBankDetail } = require('../controllers/bankdetailsController');
const clinicController = require("../controllers/clinicController");

// Doctor signup routes
router.post('/doctor/signup', doctorController.signUpDoctor);
router.post('/doctor/login', doctorController.loginDoctor);
router.post('/doctor/forgetPasswordDoctor', doctorController.forgetPasswordDoctor);
router.post('/doctor/changePassword', doctorController.changePasswordDoctor);
router.post('/doctor/update-address', doctorController.updateAddress);

router.post('/doctor/sendOtp', doctorController.sendOtpDoctor);
router.post('/doctor/logout',  doctorController.logoutDoctor);
router.get("/doctor/nearby",clinicController.getNearbyClinics);
router.post("/doctor/clinicCredentials",clinicController.saveDoctorCredentials)
router.get("/user/toprating",doctorController.getTopRatedDoctors)
router.get("/doctor/detail/:doctorId",doctorController.getDoctorDetails)
router.post("/doctor/personalInfo/:doctorId",doctorController.saveDoctorPersonalInfo)

// Doctor availability and appointments
router.put('/doctor/:doctorId/availability', doctorController.updateAvailabilityDoctor);
router.get("/appointments/upcoming/:doctorId",appointmentController.getUpcomingAppointmentsForDoctor)

// Bank details routes
router.post("/doctor/bank-details", createBankDetail);


// Nearby doctors
router.post("/doctor/clinic",clinicController.createClinic)
router.get("/doctor/:doctorId",clinicController.getClinicById)
router.get("/doctor/allClinic",clinicController.getAllClinics)
// Admin routes
router.get('/admin/getAllDoctors', doctorController.getAllDoctors);

module.exports = router; 