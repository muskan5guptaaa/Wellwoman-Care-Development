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
router.post('/doctor/sendOtp', doctorController.sendOtpDoctor);
router.post('/doctor/logout',  doctorController.logoutDoctor);
router.get("/doctor/nearby",clinicController.getNearbyClinics);
router.get("/user/toprating",doctorController.getTopRatedDoctors)
router.get("/user/detail",doctorController.getDoctorDetails)
router.post("/doctor/personalInfo/:doctorId",doctorController.saveDoctorPersonalInfo)

// Doctor availability and appointments
router.put('/doctor/:doctorId/availability', doctorController.updateAvailabilityDoctor);


// Bank details routes
router.post("/doctor/bank-details", createBankDetail);
router.get("/doctor/:doctorId", getBankDetails);
router.put("/doctor/update/:doctorId", updateBankDetail);
router.delete("/doctor/delete/:doctorId", deleteBankDetail);

// Nearby doctors
router.post("/doctor/clinic",clinicController.createClinic)
router.get("/doctor/:doctorId",clinicController.getClinicById)
router.get("/doctor/allClinic",clinicController.getAllClinics)
// Admin routes
router.get('/admin/getAllDoctors', doctorController.getAllDoctors);

module.exports = router; 