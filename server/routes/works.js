const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getAllWorks,
  getWorkById,
  createWork,
  updateWork,
  deleteWork,
  likeWork
} = require('../controllers/workController');

// Public routes
router.get('/', getAllWorks);
router.get('/:id', getWorkById);

// User-protected routes
router.post('/:id/like', authMiddleware, likeWork);

// Admin-protected routes
router.post('/', adminMiddleware, createWork);
router.put('/:id', adminMiddleware, updateWork);
router.delete('/:id', adminMiddleware, deleteWork);

module.exports = router;