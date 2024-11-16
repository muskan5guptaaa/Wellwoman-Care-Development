const Doctor=require("../models/doctorsModel");
const DoctorKyc= require("../models/kycModel");
const {kycSchemaSV}=require("../schemaValidator/kycValidator")



// Create or update KYC
const createOrUpdateKyc = async (req, res) => {
  try {
    // Validate input data using Joi schema
    const { error } = kycSchemaSV.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { 
      doctorId, 
      fullName, 
      frontImage, 
      backImage, 
      licenseNumber, 
      licenseExpiryDate, 
      documentType,
       documentNumber, 
       documentFileUrl
   } = req.body;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
         success: false, 
         message: "Doctor not found."
       });
    }
    // Check if the KYC is already created for the doctor
    let existingKyc = await DoctorKyc.findOne({ doctorId });
    if (existingKyc) {
      // If KYC already exists, update it
      existingKyc = await DoctorKyc.findOneAndUpdate(
        { doctorId },
        {
           fullName,
           frontImage, 
           backImage, 
           licenseNumber,
           licenseExpiryDate, 
           documentType,
           documentNumber,
          documentFileUrl ,
          kycStatus: "Completed"
         },
        {
           new: true
       }
      );
      return res.status(200).json({ 
        success: true, 
        message: "KYC updated successfully.",
         data: existingKyc ,
         status:existingKyc.isKycVerified ? "Completed":"Pending",
        });
    }

    // Create new KYC
    const newKyc = await DoctorKyc.create({
      doctorId,
      fullName,
      frontImage,
      backImage,
      licenseNumber,
      licenseExpiryDate,
      documentType,
      documentNumber,
      documentFileUrl,
      kycStatus
    });

    return res.status(201).json({
       success: true,
        message: "KYC created successfully.",
         data: newKyc ,
        });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error." 
    });
  }
};

//GET KYC BY ID
const getById = async (req, res) => {
  try {
    const doctorId = req.params.doctorId; 
    const details = await DoctorKyc.findOne({ doctorId: doctorId });

    if (!details) {
      return res.status(400).json({
        success: false,
        msg: "KYC details not found for this doctor.",
      });
    }
    return res.status(200).json({
      success: true,
      data: details, 
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

const getDoctorKycStatus=async(req,res)=>{
  try{
    const {doctorId}=req.body;
    const Kyc =await DoctorKyc.findOne({doctorId}).sort({createdAt:-1});
    return res.status(200).json({
      success:true,
      status:{
        kycStatus:Kyc?Kyc.isKycVerified?"Completed":"Pending":"Not Found",

      }
    });
  }catch(err){
    console.log(err);
    return res.status(500).json({
      success:false,
      message:"Internal Server Error"
    });

  }
}



  module.exports={
    getById,
    createOrUpdateKyc,
    getDoctorKycStatus,
  }