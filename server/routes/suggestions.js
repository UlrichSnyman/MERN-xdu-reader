const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getAllSuggestions,
  createSuggestion,
  deleteSuggestion
} = require('../controllers/suggestionController');

// User-protected routes
router.post('/', authMiddleware, createSuggestion);

// Admin-protected routes
router.get('/', adminMiddleware, getAllSuggestions);
router.delete('/:id', adminMiddleware, deleteSuggestion);

module.exports = router;