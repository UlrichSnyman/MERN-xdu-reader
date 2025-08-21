import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { commentsAPI } from '../services/api';
import { Comment, CommentFormData } from '../types';
import { useAuth } from '../context/AuthContext';
import './CommentSection.css';

interface CommentSectionProps {
  contentId: string;
  contentType: 'Page' | 'Lore';
}

const CommentSection: React.FC<CommentSectionProps> = ({ contentId, contentType }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CommentFormData>({
    authorName: '',
    content: '',
    parentContent: contentId,
    parentType: contentType,
  });
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

    // Join content-specific room
    newSocket.emit('join-content', contentId);

    // Listen for new comments
    newSocket.on('new-comment', (newComment: Comment) => {
      if (newComment.parentContent === contentId) {
        setComments(prev => [newComment, ...prev]);
      }
    });

    return () => {
      newSocket.emit('leave-content', contentId);
      newSocket.disconnect();
    };
  }, [contentId]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await commentsAPI.getForContent(contentId);
        setComments(response.data);
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [contentId]);

  // Update form data when contentId or contentType changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      parentContent: contentId,
      parentType: contentType
    }));
  }, [contentId, contentType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.authorName.trim() || !formData.content.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    
    try {
      await commentsAPI.create(contentId, formData);
      
      // Clear form
      setFormData(prev => ({
        ...prev,
        authorName: '',
        content: ''
      }));
      
      // Note: New comment will be added via Socket.IO event
    } catch (error: any) {
      console.error('Failed to submit comment:', error);
      alert(error.response?.data?.error || 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isAuthenticated) return;
    
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentsAPI.delete(commentId);
        setComments(prev => prev.filter(comment => comment._id !== commentId));
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('Failed to delete comment');
      }
    }
  };

  if (loading) {
    return (
      <div className="comments-loading">
        <div className="loading-spinner"></div>
        <p>Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="comment-section">
      <h3>Comments ({comments.length})</h3>
      
      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="form-row">
            <input
              type="text"
              name="authorName"
              placeholder="Your name"
              value={formData.authorName}
              onChange={handleInputChange}
              required
              disabled={submitting}
            />
          </div>
          <div className="form-row">
            <textarea
              name="content"
              placeholder="Share your thoughts..."
              value={formData.content}
              onChange={handleInputChange}
              required
              disabled={submitting}
              rows={3}
            />
          </div>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={submitting || !formData.authorName.trim() || !formData.content.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="auth-prompt">
          <p>Please <a href="/login">login</a> to leave a comment.</p>
        </div>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{comment.authorName}</span>
                <span className="comment-date">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {isAuthenticated && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="delete-comment-btn"
                    title="Delete comment"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="comment-content">
                {comment.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;