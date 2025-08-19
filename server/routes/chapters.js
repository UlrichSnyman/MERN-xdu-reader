const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  likeChapter
} = require('../controllers/chapterController');

// Public routes
router.get('/:id', getChapterById);
router.post('/:id/like', likeChapter);

// Protected admin routes
router.post('/', authMiddleware, createChapter);
router.put('/:id', authMiddleware, updateChapter);
router.delete('/:id', authMiddleware, deleteChapter);

module.exports = router;