const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  work: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Work',
    required: true
  },
  pageNumber: {
    type: Number,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure pages are ordered properly within a work
pageSchema.index({ work: 1, pageNumber: 1 }, { unique: true });

module.exports = mongoose.model('Page', pageSchema);