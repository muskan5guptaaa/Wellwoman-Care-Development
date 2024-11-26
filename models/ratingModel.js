const mongoose=require("mongoose");

const schema=mongoose.Schema;
const RatingSchema=new Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor"
    },
    userDocId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,

    },
    customerName: {
        type: String,
        required: true,
      },
      customerProfiles: {
        type: String,
        required: true,
      },
      feedback: {
        type: String,
        required: true,
      },
      images: [String],
      rating: {
        type: Number,
        required: true,
      },
      createdAt: {
        type: Date,
      }
})
mongoose.exports=mongoose.model("Rating",RatingSchema)