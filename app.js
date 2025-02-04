const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authMiddleware = require("./middleware/authmiddleware"); 
const userRoutes = require('./routes/userRoutes'); 
const membershipRoutes=require('./routes/doctorMembershipRoute')
const doctorRoutes = require('./routes/doctorsRoute');
const kycRoute = require("./routes/kycRoute");
const adminRoute = require("./routes/adminRoute");
const ratingRoute=require("./routes/ratingRoute");
const notificationRoute=require("./routes/notificationRoute")

dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log('MongoDB connection error:', err));

// Load routes
app.use('/api', userRoutes);
app.use('/api', doctorRoutes);
app.use('/api', kycRoute);
app.use('/api',adminRoute);
app.use('/api',membershipRoutes);
app.use('/api',notificationRoute)
app.use('/api',ratingRoute)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
