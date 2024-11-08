const express = require('express');
const router = express.Router();
const doctorController = require("../controllers/doctorsController");

const { signUpDoctor,loginDoctor,forgetPasswordDoctor } = require('../controllers/doctorsController');

// Doctor signup route
router.post('/doctor/signup', doctorController.signUpDoctor);
router.post('/doctor/login',doctorController.loginDoctor);
router.post('/doctor/forgetPasswordDoctor',doctorController.forgetPasswordDoctor);
router.post('/doctor/changePassword',doctorController.changePasswordDoctor);
router.get('/doctor/getAllDoctors',doctorController.getAllDoctors);




module.exports = router;
