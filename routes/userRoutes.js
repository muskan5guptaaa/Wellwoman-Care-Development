const express = require("express");
const router = express.Router();
const userController = require("../controllers/userControllers");
const { isUserAuth } = require("../middleware/authmiddleware");

const authMiddleware = require("../middleware/authmiddleware"); // Path to your authentication middleware

//User flow apis
router.post("/user/signup", userController.signUpUser);
router.post("/user/login",userController.loginUser);
router.post("/user/changePassword",isUserAuth,userController.changePassword);
router.put("/user/editProfile",isUserAuth,userController.editProfile);
router.post("/user/forgetPassword",userController.forgetPassword);
router.post("/user/logout",userController.logout);
router.post("/user/sendOtp",userController.sendOtpUser);
router.get("/user/getUserProfile",isUserAuth,userController.getUserProfile)


//Admin flow apis
router.get("/user/getAllUsers",userController.getAllUsers);




module.exports = router;
