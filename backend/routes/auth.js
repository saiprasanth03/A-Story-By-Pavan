import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';
import { getMailer } from '../mailer.js';

const router = express.Router();

// Middleware to authenticate JWT
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Authorization header missing' });
  }
};

// Middleware to check Super Admin
export const requireSuperAdmin = (req, res, next) => {
  const hasPermissionsTab = req.user && req.user.permissions && req.user.permissions.includes('permissions');
  if (req.user && (req.user.isSuperAdmin || hasPermissionsTab)) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Super Admin access required' });
  }
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await AdminUser.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, email: user.email, isSuperAdmin: user.isSuperAdmin, permissions: user.permissions },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, email: user.email, isSuperAdmin: user.isSuperAdmin, permissions: user.permissions } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// GET /api/auth/me
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = await AdminUser.findById(req.user.id).select('-password -otp -otpExpiry');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await AdminUser.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    user.otp = otp;
    user.otpExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // Send email
    const transporter = getMailer(
      process.env.EMAIL_USER || 'test@gmail.com',
      process.env.EMAIL_PASS || 'password'
    );

    const appName = process.env.APP_NAME || 'Studio OS';
    const mailOptions = {
      from: `"${appName}" <${process.env.EMAIL_USER || 'no-reply@example.com'}>`,
      to: email,
      subject: `${appName} - Password Reset OTP`,
      text: `Your OTP for password reset is: ${otp}. It is valid for 15 minutes.`
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      console.log('OTP sent to', email);
    } else {
      console.log('No EMAIL_USER/EMAIL_PASS in env. Dev OTP is:', otp);
    }

    res.json({ message: 'OTP sent successfully. Check your email or server logs.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await AdminUser.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
