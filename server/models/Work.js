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
  pages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page'
  }],
  likes: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['library', 'lore'],
    default: 'library'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Work', workSchema);