const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes'); // Import user routes
const doctorRoutes = require('./routes/doctorsRoute');
const kycRoute = require("./routes/kycRoute");
 // Import doctor routes
const authMiddleware = require("./middleware/authmiddleware"); // Path to your authentication middleware

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    //useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log('MongoDB connection error:', err));

// Load routes
app.use('/api', userRoutes); // This will let `/user/signup` work directly as `http://localhost:5000/api/user/signup`
app.use('/api', doctorRoutes); // Same for doctor routes if needed
app.use("/api", kycRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
