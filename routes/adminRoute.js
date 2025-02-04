const express = require("express");
const router = express.Router();
const userController=require("../controllers/userController")
const adminController = require("../controllers/adminController");
const appointmentController=require("../controllers/appointmentController")
const { bookAppointment } = require("../controllers/appointmentController");



router.post("/admin/signup",adminController.adminSignup)
router.post("/admin/login",adminController.adminLogin)
router.post("/admin/addProduct",adminController.addMedicalProduct)
router.get("/admin/allProduct",adminController.getAllProducts)
router.get("/admin/getAllUsers",userController.getAllUsers);
module.exports = router;
