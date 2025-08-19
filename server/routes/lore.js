const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
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
router.post('/:id/like', likeLore);

// Protected admin routes
router.post('/', authMiddleware, createLore);
router.put('/:id', authMiddleware, updateLore);
router.delete('/:id', authMiddleware, deleteLore);

module.exports = router;