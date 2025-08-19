const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
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
  chapterNumber: {
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

// Ensure chapters are ordered properly within a work
chapterSchema.index({ work: 1, chapterNumber: 1 }, { unique: true });

module.exports = mongoose.model('Chapter', chapterSchema);