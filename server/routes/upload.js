const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware/authMiddleware');
const { upload, uploadPDF } = require('../controllers/uploadController');

// Admin-only PDF upload route
router.post('/pdf', adminMiddleware, upload.single('pdf'), uploadPDF);

module.exports = router;