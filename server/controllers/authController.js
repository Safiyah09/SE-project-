const User = require('../models/User');
const { validationResult } = require('express-validator');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin Login — validate credentials, return JWT
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => e.msg),
      });
    }

    const { email, password } = req.body;

    //console.log("Login attempt:", email);

    // Find user by email — explicitly select password (it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

   // console.log("User found:", user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact the administrator.',
      });
    }

    // Verify password
    //console.log("Entered password:", password);
    //console.log("Stored password:", user?.password);
    const isMatch = await user.matchPassword(password);
    //console.log("Password match:", isMatch);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate JWT
    //console.log("JWT_SECRET:", process.env.JWT_SECRET);
    let token;
    try {
      token = user.generateToken();
    } catch (jwtError) {
      console.error("JWT Generation Error:", jwtError);
      throw jwtError;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Logout — instructs client to clear token
// @route   POST /api/auth/logout
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear your token on the client.',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify if token is still valid
// @route   GET /api/auth/verify
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const verifyToken = async (req, res) => {
  res.status(200).json({
    success: true,
    valid: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = { login, getMe, logout, verifyToken };
