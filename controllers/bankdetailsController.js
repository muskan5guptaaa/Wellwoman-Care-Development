const Doctor = require("../models/doctorsModel");
const BankDetails=require("../models/bankdetailsmodel")
const {
  bankDetailsSV,
  updateBankDetailsSV,
} = require("../schemaValidator/bankDetailsValidator");

const createBankDetail = async (req, res) => {
    try {
      const validateReqBody = await bankDetailsSV.validateAsync(req.body);
      const { doctorId, bankName, accountHolderName, accountNumber, IFSCcode, primary } = validateReqBody;
  
      // Ensure the doctor exists
      const doctorExists = await Doctor.findById(doctorId);
      if (!doctorExists) {
        return res.status(404).json({ success: false, message: "Doctor not found" });
      }
  
      const bankDetail = new BankDetails({
        doctorId,
        bankName,
        accountHolderName,
        accountNumber,
        IFSCcode,
        primary,
      });
  
      await bankDetail.save();
  
      return res.status(201).json({
        success: true,
        data: bankDetail,
        message: "Bank details created successfully",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
  const getBankDetails = async (req, res) => {
    try {
      const { doctorId } = req.params;
  
      const bankDetails = await BankDetails.find({ doctorId });
  
      if (!bankDetails || bankDetails.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No bank details found for this doctor",
        });
      }
  
      return res.status(200).json({
        success: true,
        data: bankDetails,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  const updateBankDetail = async (req, res) => {
    try {
      const { id } = req.params;
      const validateReqBody = await updateBankDetailsSV.validateAsync(req.body);
  
      const updatedBankDetail = await BankDetails.findByIdAndUpdate(
        id,
        validateReqBody,
        { new: true }
      );
  
      if (!updatedBankDetail) {
        return res.status(404).json({
          success: false,
          message: "Bank detail not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        data: updatedBankDetail,
        message: "Bank detail updated successfully",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
  
  const deleteBankDetail = async (req, res) => {
    try {
      const { doctorId } = req.params;
  
      const deletedBankDetail = await BankDetails.findByIdAndDelete(doctorId);
  
      if (!deletedBankDetail) {
        return res.status(404).json({
          success: false,
          message: "Bank detail not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Bank detail deleted successfully",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
  
module.exports={
    createBankDetail,
    getBankDetails,
    updateBankDetail,
    deleteBankDetail
}