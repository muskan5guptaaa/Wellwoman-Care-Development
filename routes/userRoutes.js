const express = require("express");
const router = express.Router();
const userController = require("../controllers/userControllers");
const { isUserAuth } = require("../middleware/authmiddleware");


//User flow apis
router.post("/user/signup", userController.signUpUser);
router.post("/user/login",userController.loginUser);
router.post("/user/changePassword",userController.changePassword);
router.put("/user/editProfile",isUserAuth,userController.editProfile);
router.post("/user/forgetPassword",userController.forgetPassword);
router.post("/user/logout",userController.logout);
router.post("/user/sendOtp",userController.sendOtpUser);
router.get("/user/getUserProfile",isUserAuth,userController.getUserProfile)


//Admin flow apis
router.get("/admin/getAllUsers",userController.getAllUsers);




module.exports = router;
