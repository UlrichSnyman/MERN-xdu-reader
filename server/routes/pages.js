const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getPageById,
  createPage,
  updatePage,
  deletePage,
  likePage
} = require('../controllers/pageController');

// Public routes
router.get('/:id', getPageById);

// User-protected routes
router.post('/:id/like', authMiddleware, likePage);

// Admin-protected routes
router.post('/', adminMiddleware, createPage);
router.put('/:id', adminMiddleware, updatePage);
router.delete('/:id', adminMiddleware, deletePage);

module.exports = router;