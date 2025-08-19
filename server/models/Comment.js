const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  authorName: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  parentContent: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'parentType'
  },
  parentType: {
    type: String,
    required: true,
    enum: ['Chapter', 'Lore']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);