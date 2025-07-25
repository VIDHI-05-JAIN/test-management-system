const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/login', (req, res) => {
  console.log("Login API hit with:", req.body);

  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ message: 'Mobile number and OTP are required.' });
  }

  // Step 1: Check if user exists
  const checkQuery = 'SELECT id, mobile, role FROM users WHERE mobile = ?';

  db.query(checkQuery, [mobile], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err });

    if (results.length > 0) {
      // ✅ User exists → validate OTP
      const otpQuery = 'SELECT id, mobile, role FROM users WHERE mobile = ? AND otp = ?';
      db.query(otpQuery, [mobile, otp], (otpErr, otpResults) => {
        if (otpErr) return res.status(500).json({ message: 'OTP validation failed', error: otpErr });

        if (otpResults.length === 0) {
          return res.status(401).json({ message: 'Invalid OTP' });
        }

        const user = otpResults[0];
        return res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            mobile: user.mobile,
            role: user.role
          }
        });
      });

    } else {
      // 🚀 Auto-create user if not exists
      const insertQuery = 'INSERT INTO users (mobile, otp, role) VALUES (?, ?, "user")';
      db.query(insertQuery, [mobile, otp], (insertErr, insertResult) => {
        if (insertErr) return res.status(500).json({ message: 'User creation failed', error: insertErr });

        return res.status(201).json({
          message: 'New user created and logged in',
          user: {
            id: insertResult.insertId,
            mobile,
            role: 'user'
          }
        });
      });
    }
  });
});

module.exports = router;
