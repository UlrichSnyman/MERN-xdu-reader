const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuthMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getAllLore,
  getLoreById,
  createLore,
  updateLore,
  deleteLore,
  likeLore
} = require('../controllers/loreController');

// Public routes
router.get('/', getAllLore);

// Routes that can benefit from authentication but don't require it
router.get('/:id', optionalAuthMiddleware, getLoreById);

// User-protected routes
router.post('/:id/like', authMiddleware, likeLore);

// Admin-protected routes
router.post('/', adminMiddleware, createLore);
router.put('/:id', adminMiddleware, updateLore);
router.delete('/:id', adminMiddleware, deleteLore);

module.exports = router;