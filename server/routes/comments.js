const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getCommentsByContentId,
  createComment,
  deleteComment
} = require('../controllers/commentController');

// Public routes
router.get('/:contentId', getCommentsByContentId);

// User-protected routes
router.post('/', authMiddleware, createComment);

// Admin-protected routes
router.delete('/:id', adminMiddleware, deleteComment);

module.exports = router;