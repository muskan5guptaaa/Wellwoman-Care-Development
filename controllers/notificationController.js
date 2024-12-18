const Notification = require('../models/notificationModel'); // Adjust path as needed
const User = require('../models/userModel'); // Assuming you're using a User model

// Create a notification
const createNotification = async (req, res) => {
  try {
    const { recipient, type, message, metadata } = req.body;

    if (!recipient || !message) {
      return res.status(400).json({ error: 'Recipient and message are required' });
    }

    // Create new notification
    const notification = new Notification({
      recipient,
      type,
      message,
      metadata,
    });

    // Save notification to the database
    await notification.save();

    // Optionally, add the notification to the user's list (if embedded)
    await User.findByIdAndUpdate(recipient, {
      $push: { notifications: notification._id },
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch notifications for the user
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 }) // Optional: Sort by most recent
      .populate('recipient', 'name email'); // Optional: Populate user info

    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;

    // Find notification by ID and update its status
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get unread notifications for a user
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch unread notifications
    const unreadNotifications = await Notification.find({
      recipient: userId,
      isRead: false,
    })
      .sort({ createdAt: -1 }) // Optional: Sort by most recent
      .populate('recipient', 'name email'); // Optional: Populate user info

    res.status(200).json(unreadNotifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  getUnreadNotifications,
};
