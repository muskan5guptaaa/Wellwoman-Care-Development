const Admin=require("../models/adminModel");
const Token=require("../models/tokenmodel")
const Product = require('../models/productModel');


const adminSignup=async(req,res)=>{
  const {name,email,password}=req.body;
     try{
      const existingAdmin=await Admin.findOne({email});
      if(existingAdmin){
        return res.status(400).json({
          message:"Admin already exisrs"
        })
    

      }

      const admin=new Admin({name,email,password});
      await admin.save();
      res.status(201).json({
        message:"Admin registered successfully"
      });
     }catch(error){
            res.status(500).json({
              message:"Error registering admin,error"
     });
  }
};

const adminLogin=async(req,res)=>{
  const{email,password}=req.body;
  try{
    const admin=await Admin.findOne({email});
    if(!admin){
      return res.status(404).json({
        message:"Admin not Found"
      });
    }

    const isPasswordValid=await admin.comparePassword(password);
    if(!isPasswordValid){
      return res.status(401).json({
        message:"Invalid credentials"
      })
    }
        // Generate a token
        const token = jwt.sign(
          { 
            adminId: admin._id, 
            email: admin.email
         },
          process.env.ACCESS_TOKEN_SECRET,                 
          { 
            expiresIn: '1h'
         }                      
      );
  // Store token in the database
  await Token.create({
    token: token,
    objectDocId: admin._id,
    userType: "Admin",
    expired_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  });

      res.status(200).json({
       message: 'Login successful', 
       token 
    });
  } catch (error) {
      res.status(500).json({
       message: 'Error logging in', error
      });
  }
}

const addProduct = async (req, res) => {
    const { name, description, price, stock, category, image } = req.body;
    const { user } = req; 
    try {
        if (user.role !== 'admin') {
            return res.status(403).json({
             message: 'Only admins can add products'
           });
        }
        const product = new Product({
            name,
            description,
            price,
            stock,
            category,
            image,
            createdBy: admin._id, 
        });
        await product.save();
        res.status(201).json({
         message: 'Product added successfully', 
         product });
    } catch (error) {
        res.status(500).json({ 
        message: 'Error adding product', 
        error
       });
    }
};



module.exports={
  adminSignup,
  adminLogin,
  addProduct
}