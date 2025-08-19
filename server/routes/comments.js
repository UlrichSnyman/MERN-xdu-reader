const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getCommentsByContentId,
  createComment,
  deleteComment
} = require('../controllers/commentController');

// Public routes
router.get('/:contentId', getCommentsByContentId);
router.post('/', createComment);

// Protected admin routes
router.delete('/:id', authMiddleware, deleteComment);

module.exports = router;