const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuthMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getAllLore,
  getLoreById,
  createLore,
  updateLore,
  deleteLore,
  likeLore,
  unlikeLore
} = require('../controllers/loreController');

// Public routes
router.get('/', optionalAuthMiddleware, getAllLore);

// Routes that can benefit from authentication but don't require it
router.get('/:id', optionalAuthMiddleware, getLoreById);

// User-protected routes
router.post('/:id/like', authMiddleware, likeLore);
router.delete('/:id/like', authMiddleware, unlikeLore);

// Admin-protected routes
router.post('/', adminMiddleware, createLore);
router.put('/:id', adminMiddleware, updateLore);
router.delete('/:id', adminMiddleware, deleteLore);

module.exports = router;