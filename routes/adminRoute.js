const express = require("express");
const router = express.Router();
const userController=require("../controllers/userControllers")
const adminController = require("../controllers/adminController");

router.get("/admin/getAllUsers",userController.getAllUsers);

module.exports = router;
