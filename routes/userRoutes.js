const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const appointmentController = require("../controllers/appointmentController");
const clinicController = require("../controllers/clinicController");
const { isUserAuth } = require("../middleware/authmiddleware");


//User flow apis
router.post("/user/signup", userController.signUpUser);
router.post("/user/login",userController.loginUser);
router.post("/user/changePassword",isUserAuth,userController.changePassword);
router.put("/user/editProfile",userController.editProfile);
router.post("/user/forgetPassword",userController.forgetPassword);
router.post("/user/logout",userController.logout);
router.post("/user/sendOtp",userController.sendOtpUser);
router.get("/user/getUserProfile",userController.getUserProfile)


router.post("/user/:doctorId/new", appointmentController.bookAppointment);
router.get("/user/schedule",appointmentController.getDoctorSchedule)
router.get("/user/all/:userId",appointmentController.getAllAppointmentsForUser)


//Admin flow apis
router.get("/admin/getAllUsers",userController.getAllUsers);

router.post("/user/clinicrating",clinicController.addClinicRating)


module.exports = router;
