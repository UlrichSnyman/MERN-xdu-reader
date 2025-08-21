const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuthMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getAllWorks,
  getWorkById,
  createWork,
  updateWork,
  deleteWork,
  likeWork,
  unlikeWork,
  updateReadingProgress,
  getReadingProgressStats
} = require('../controllers/workController');

// Public routes
router.get('/', optionalAuthMiddleware, getAllWorks);

// Routes that can benefit from authentication but don't require it
router.get('/:id', optionalAuthMiddleware, getWorkById);

// User-protected routes
router.post('/:id/like', authMiddleware, likeWork);
router.delete('/:id/like', authMiddleware, unlikeWork);
router.post('/progress', authMiddleware, updateReadingProgress);

// Admin-protected routes
router.post('/', adminMiddleware, createWork);
router.put('/:id', adminMiddleware, updateWork);
router.delete('/:id', adminMiddleware, deleteWork);
router.get('/admin/progress-stats', adminMiddleware, getReadingProgressStats);

module.exports = router;