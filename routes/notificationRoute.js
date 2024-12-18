const express = require("express");
const router = express.Router();
const notification=require("../models/notificationModel");
const { createNotification } = require("../controllers/notificationController");

router.post('/notifications/create', createNotification);


module.exports = router;