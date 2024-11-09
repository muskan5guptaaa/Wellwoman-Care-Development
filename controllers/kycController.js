const Doctor=require("../models/doctorsModel");
const KYC= require("../models/kycModel");
const {
   kycSchemaSV,
   verifyKycSchemaSV 
}=require("../schemaValidator/kycValidator")


//upload KYC Documents
const uploadKYC = async (req, res) => {
    try {
      const doctorId = req.doctorId;
      // Validate the request body against the schema
      const validateReqBody = await kycSchemaSV.validateAsync(req.body);
      const {
       fullName,
        documentType,
        documentNumber,
        frontImage,
        backImage,
      } = validateReqBody;
  
      // Check if a KYC entry already exists for the partnerDocId
      const existingEntry = await KYC.findOne({ doctorDocId: doctorId });
  
      if (existingEntry) {
        existingEntry.fullName = fullName;
        existingEntry.documentType = documentType;
        existingEntry.documentNumber = documentNumber;
        existingEntry.frontImage = frontImage;
        existingEntry.backImage = backImage;
        await existingEntry.save();
  
        return res.status(200).json({
          success: true,
          message: `${documentType} updated successfully!`,
        });
      } else {
        // Create a new KYC entry
        const createEntry = await KYC.create({
          doctorId: doctorId,
          fullName,
          documentType,
          documentNumber,
          frontImage,
          backImage,
        });
  
       
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  const getKYCById = async (req, res) => {
    try {
      const doctorId = req.doctorId; 
  
      // Find the KYC entry for the doctorId
      const kycEntry = await KYC.findOne({ doctorId: doctorId });
  
      if (!kycEntry) {
        return res.status(404).json({
          success: false,
          message: 'KYC details not found for this doctor.',
        });
      }
  
      return res.status(200).json({
        success: true,
        data: kycEntry, // Return the KYC details for the doctor
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  };
  const showDoctorKYC = async (req, res) => {
    try {
      const doctorId = req.doctorId; 
      // Find the KYC entry based on the doctorId
      const details = await KYC.findOne({ doctorId });
  
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
  
  

  module.exports={
    uploadKYC,
    getKYCById,
    showDoctorKYC
  }