const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
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
router.post('/:id/like', likeWork);

// Protected admin routes
router.post('/', authMiddleware, createWork);
router.put('/:id', authMiddleware, updateWork);
router.delete('/:id', authMiddleware, deleteWork);

module.exports = router;