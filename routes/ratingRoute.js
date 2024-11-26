
const express=require("express");
const { giveRating, getRatings, updateRating, deleteRating } = require("../controllers/ratingController");
const router=express.Router();


router.post("/rating/user-create",giveRating)
router.get("/rating/user-get",getRatings)
router.patch("/rating/user-update/:ratingId", updateRating)
router.delete("/rating/user-delete/:ratingId",deleteRating)
module.exports = router;