const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  likeChapter
} = require('../controllers/chapterController');

// Public routes
router.get('/:id', getChapterById);

// User-protected routes
router.post('/:id/like', authMiddleware, likeChapter);

// Admin-protected routes
router.post('/', adminMiddleware, createChapter);
router.put('/:id', adminMiddleware, updateChapter);
router.delete('/:id', adminMiddleware, deleteChapter);

module.exports = router;