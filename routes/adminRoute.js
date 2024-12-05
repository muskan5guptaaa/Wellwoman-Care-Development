const express = require("express");
const router = express.Router();
const userController=require("../controllers/userController")
const adminController = require("../controllers/adminController");
const appointmentController=require("../controllers/appointmentController")
const { bookAppointment } = require("../controllers/appointmentController");

router.get("/admin/getAllUsers",userController.getAllUsers);
router.post ("/user/appointment",appointmentController.bookAppointment)
module.exports = router;
