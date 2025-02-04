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
router.put("/user/edit",userController.editProfile)


router.get("/user/schedule",appointmentController.getDoctorSchedule)
router.get("/user/all/:userId",appointmentController.getAllAppointmentsForUser)
router.post("/appointments/offline",clinicController.bookOfflineAppointment);
router.post("/appointments/online",appointmentController.bookOnlineAppointment)


//Products apis
router.post("/user/add",userController.addToCart)
router.get("/user/cart/:userId",userController.getUserCart)
router.get("/user/searchProducts",userController.searchProducts)
router.post("/user/save",userController.saveProduct)
router.get("/user/getSaveProduct",userController.getSavedProducts)
//Admin flow apis
router.get("/admin/getAllUsers",userController.getAllUsers);

router.post("/user/clinicrating",clinicController.addClinicRating)


module.exports = router;
