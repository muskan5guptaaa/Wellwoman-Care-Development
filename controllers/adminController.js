const signUpUser = async (req, res) => {
    try {
      // Validate request body using a schema validator
      const validateReqBody = await signUpUserSV.validateAsync(req.body);
      const { email, password, name ,phone} = validateReqBody;
  
      // Check if the email and phone already exists
      let existingUser = await User.findOne({ email: email, phone: phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email or Phone already registered with Us.",
        });
      }
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create a new user
      const newUser = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        username: email.split("@")[0],        
      });
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    } catch (err) {
      console.log(err);
      if (err.isJoi) {
        return res.status(400).json({
          success: false,
          message: err.details[0].message,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
