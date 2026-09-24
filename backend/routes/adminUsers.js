import express from 'express';
import bcrypt from 'bcryptjs';
import AdminUser from '../models/AdminUser.js';
import { authenticateJWT, requireSuperAdmin } from './auth.js';

const router = express.Router();

// Apply auth and super admin checks to all routes
router.use(authenticateJWT);
router.use(requireSuperAdmin);

// GET /api/admin-users - List all admin users
router.get('/', async (req, res) => {
  try {
    const users = await AdminUser.find().select('-password -otp -otpExpiry');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin-users - Create new admin user
router.post('/', async (req, res) => {
  const { email, password, permissions, isSuperAdmin } = req.body;
  try {
    let user = await AdminUser.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new AdminUser({
      email,
      password: hashedPassword,
      permissions: permissions || [],
      isSuperAdmin: isSuperAdmin || false
    });

    await user.save();
    const userToReturn = user.toObject();
    delete userToReturn.password;
    res.status(201).json(userToReturn);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// PUT /api/admin-users/:id - Update admin user (permissions, etc)
router.put('/:id', async (req, res) => {
  const { email, password, permissions, isSuperAdmin } = req.body;
  try {
    const user = await AdminUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email) user.email = email;
    if (permissions) user.permissions = permissions;
    if (typeof isSuperAdmin !== 'undefined') user.isSuperAdmin = isSuperAdmin;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    const userToReturn = user.toObject();
    delete userToReturn.password;
    res.json(userToReturn);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// DELETE /api/admin-users/:id - Delete admin user
router.delete('/:id', async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent deleting the root super admin
    const rootAdminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    if (user.email === rootAdminEmail) {
      return res.status(400).json({ message: 'Cannot delete the root super admin' });
    }

    await AdminUser.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
