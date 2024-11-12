const { required } = require("joi");
const mongoose=require("mongoose");

const doctorMembershipSchema=new mongoose.Schema({
    doctorId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Doctor",
    },
    transactionId:{
  type:String
    },
    amount:{
        type:Number,
        required:true
    },
    paidAt:{
        type:Date,
    },
    status:{
        type:String,
        enum:["Pending","Completed","Failed"],
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        required:true
    }
});

const DoctorMembership=mongoose.model(
    "Doctor"
)