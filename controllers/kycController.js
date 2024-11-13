const Doctor=require("../models/doctorsModel");
const DoctorKyc= require("../models/kycModel");
const {
   kycSchemaSV,
   verifyKycSchemaSV 
}=require("../schemaValidator/kycValidator")





const createOrUpdateKyc = async (req, res) => {
  try {
    const { doctorId, fullName, frontImage, backImage, licenseNumber, licenseExpiryDate, documentType, documentNumber, documentFileUrl } = req.body;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    // Check if the KYC is already created for the doctor
    let existingKyc = await DoctorKyc.findOne({ doctorId });
    if (existingKyc) {
      // If KYC already exists, update it
      existingKyc = await DoctorKyc.findOneAndUpdate(
        { doctorId },
        { fullName, frontImage, backImage, licenseNumber, licenseExpiryDate, documentType, documentNumber, documentFileUrl },
        { new: true }
      );
      return res.status(200).json({ success: true, message: "KYC updated successfully.", data: existingKyc });
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
    });

    return res.status(201).json({ success: true, message: "KYC created successfully.", data: newKyc });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

//upload KYC Documents
const uploadKYC = async (req, res) => {
    try {
      const doctorId = req.doctorId;
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
        data: kycEntry, 
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
      const id = req.params.id;
      const details = await KYC.findById(id);
  
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
    showDoctorKYC,
    createOrUpdateKyc
  }