import React, { useState } from 'react';
import { suggestionsAPI } from '../services/api';
import './SuggestionsPage.css';

const SuggestionsPage: React.FC = () => {
  const [formData, setFormData] = useState({
    content: '',
    authorName: '',
    email: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      alert('Please enter your suggestion');
      return;
    }

    setSubmitting(true);
    
    try {
      await suggestionsAPI.create(formData);
      setSubmitted(true);
      setFormData({ content: '', authorName: '', email: '' });
    } catch (error: any) {
      console.error('Failed to submit suggestion:', error);
      alert(error.response?.data?.error || 'Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="suggestions-page">
        <div className="success-message">
          <h2>Thank You!</h2>
          <p>Your suggestion has been submitted successfully. We appreciate your feedback!</p>
          <button 
            onClick={() => setSubmitted(false)}
            className="submit-another-btn"
          >
            Submit Another Suggestion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="suggestions-page">
      <div className="suggestions-header">
        <h1>Share Your Suggestions</h1>
        <p>We value your feedback and ideas to improve our literary collection.</p>
      </div>

      <form onSubmit={handleSubmit} className="suggestions-form">
        <div className="form-group">
          <label htmlFor="content">Your Suggestion *</label>
          <textarea
            id="content"
            name="content"
            placeholder="Share your thoughts, feedback, or suggestions..."
            value={formData.content}
            onChange={handleInputChange}
            required
            disabled={submitting}
            rows={6}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="authorName">Your Name (Optional)</label>
            <input
              type="text"
              id="authorName"
              name="authorName"
              placeholder="Your name"
              value={formData.authorName}
              onChange={handleInputChange}
              disabled={submitting}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email (Optional)</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={submitting}
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={submitting || !formData.content.trim()}
        >
          {submitting ? 'Submitting...' : 'Submit Suggestion'}
        </button>
      </form>
    </div>
  );
};

export default SuggestionsPage;