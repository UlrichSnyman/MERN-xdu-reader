const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  synopsis: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true
  },
  chapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  likes: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['book', 'short-story'],
    default: 'book'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Work', workSchema);