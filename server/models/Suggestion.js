const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  authorName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Suggestion', suggestionSchema);