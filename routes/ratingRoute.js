
const express=require("express")
const router=express.Router();
const { giveRating } = require("../controllers/ratingController");

router.post("/rating/user-create",    giveRating)