const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
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
router.get('/:id', getLoreById);

// User-protected routes
router.post('/:id/like', authMiddleware, likeLore);

// Admin-protected routes
router.post('/', adminMiddleware, createLore);
router.put('/:id', adminMiddleware, updateLore);
router.delete('/:id', adminMiddleware, deleteLore);

module.exports = router;