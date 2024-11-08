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
  
      console.log(12);
      // Validate the request body against the schema
      const validateReqBody = await kycSchemaSV.validateAsync(req.body);
      const {
        nameOnDocument,
        documentType,
        documentNumber,
        frontImage,
        backImage,
      } = validateReqBody;
  
      // Check if a KYC entry already exists for the partnerDocId
      const existingEntry = await KYC.findOne({ doctorDocId: doctorId });
  
      if (existingEntry) {
        // Update the existing KYC entry
        existingEntry.nameOnDocument = nameOnDocument;
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
          nameOnDocument,
          documentType,
          documentNumber,
          frontImage,
          backImage,
        });
  
        return res.status(200).json({
          success: true,
          message: `${documentType} verification will take some time!`,
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