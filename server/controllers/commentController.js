const Comment = require('../models/Comment');

// Get comments for specific content (public)
const getCommentsByContentId = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const comments = await Comment.find({ parentContent: contentId })
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Server error while fetching comments' });
  }
};

// Create new comment (public)
const createComment = async (req, res) => {
  try {
    const { authorName, content, parentContent, parentType } = req.body;
    
    if (!authorName || !content || !parentContent || !parentType) {
      return res.status(400).json({ 
        error: 'Author name, content, parent content ID, and parent type are required' 
      });
    }
    
    if (!['Chapter', 'Lore'].includes(parentType)) {
      return res.status(400).json({ 
        error: 'Parent type must be either "Chapter" or "Lore"' 
      });
    }
    
    const comment = new Comment({
      authorName,
      content,
      parentContent,
      parentType
    });
    
    await comment.save();
    
    // Return the populated comment
    const populatedComment = await Comment.findById(comment._id);
    
    // Emit real-time event for new comment
    if (req.io) {
      req.io.to(`content-${parentContent}`).emit('new-comment', populatedComment);
    }
    
    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Server error while creating comment' });
  }
};

// Delete comment (admin only)
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Server error while deleting comment' });
  }
};

module.exports = {
  getCommentsByContentId,
  createComment,
  deleteComment
};