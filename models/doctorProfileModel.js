const { required } = require("joi");

const doctorProfileSchema=new Schema({
  doctors: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor' }],
  name:{
    type:String,
    required:true
  },
  category:{
    type:String,
    required:true
  },
  location:{
    type:{
    type:String,
    enum:["Point"],
    required:true
    },
    coordinates:{
      type:[Number],
      required:true,

    }
  },
  
})