const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    const { service, date, duration } = req.body;
    
    // Check for existing bookings at same time
    const existingBooking = await Booking.findOne({
      date,
      status: { $ne: 'cancelled' }
    });
    
    if (existingBooking) {
      return res.status(400).json({ msg: 'Time slot unavailable' });
    }
    
    // Create new booking
    const newBooking = new Booking({
      userId: req.user.id,
      service,
      date,
      duration
    });
    
    const booking = await newBooking.save();
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user bookings
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;