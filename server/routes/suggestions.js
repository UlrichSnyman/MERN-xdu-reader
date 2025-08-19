const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllSuggestions,
  createSuggestion,
  deleteSuggestion
} = require('../controllers/suggestionController');

// Public routes
router.post('/', createSuggestion);

// Protected admin routes
router.get('/', authMiddleware, getAllSuggestions);
router.delete('/:id', authMiddleware, deleteSuggestion);

module.exports = router;