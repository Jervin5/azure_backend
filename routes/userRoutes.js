const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const roles = require('../utils/roles');

// Admin-only route
router.get('/admin/dashboard', authenticateToken, authorizeRoles(roles.ADMIN), (req, res) => {
  res.json({ message: `Welcome admin ${req.user.username}` });
});



// All valid roles can view their own profile
router.get('/user/profile',
  authenticateToken,
  authorizeRoles(
    roles.ADMIN,
    roles.User
  ),
  (req, res) => {
    res.json({
      message: `Profile for ${req.user.username}`,
      role: req.user.userRole,
    });
  }
);

module.exports = router;
 