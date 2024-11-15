const scheduleAppointment = async (req, res) => {
    try {
        const { doctorId, date } = req.body;
        const userId = req.user.id; 

        // Validate doctor existence
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Create new appointment
        const appointment = new Appointment({
            userId,
            doctorId,
            date,
            duration
            
        });

        await appointment.save();

        res.status(201).json({ message: 'Appointment scheduled successfully', appointment });
    } catch (error) {
        
    }
};
