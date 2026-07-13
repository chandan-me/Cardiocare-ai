const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    // Check if user exists
    const existingUsers = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user (default role is 'user', but if it's the first user, we can make them 'admin' or just let role default to 'user')
    // Let's count existing users. If 0, make first user an admin. This is a very elegant solution!
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    const role = userCount[0].count === 0 ? 'admin' : 'user';

    const insertResult = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    const userId = insertResult.insertId;

    // Create JWT
    const payload = {
      id: userId,
      name,
      email,
      role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        role,
        avatar: null,
        phone: null,
        institution: null,
        specialization: null,
        license: null
      }
    });

  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    // Check user exists
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create JWT with optional longer expiration
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const expiresIn = rememberMe ? '7d' : '24h';
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        institution: user.institution,
        specialization: user.specialization,
        license: user.license
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

exports.updateAvatar = async (req, res) => {
  const { avatar } = req.body;
  const userId = req.user.id;

  try {
    await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userId]);
    res.json({ message: 'Avatar updated successfully', avatar });
  } catch (err) {
    console.error('Update avatar error:', err.message);
    res.status(500).json({ error: 'Server error while updating avatar' });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, phone, institution, specialization, license } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    await db.query(
      `UPDATE users 
       SET name = ?, phone = ?, institution = ?, specialization = ?, license = ? 
       WHERE id = ?`,
      [name, phone || null, institution || null, specialization || null, license || null, userId]
    );

    res.json({ 
      message: 'Profile updated successfully', 
      user: {
        id: userId,
        name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        phone,
        institution,
        specialization,
        license
      } 
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Server error while updating profile details' });
  }
};
