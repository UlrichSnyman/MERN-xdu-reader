import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loreAPI } from '../services/api';
import { Lore } from '../types';
import { useAuth } from '../context/AuthContext';
import CommentSection from './CommentSection';
import './LoreDetailPage.css';

const LoreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lore, setLore] = useState<Lore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchLore = async () => {
      if (!id) return;
      
      try {
        const response = await loreAPI.getById(id);
        setLore(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load lore entry');
      } finally {
        setLoading(false);
      }
    };

    fetchLore();
  }, [id]);

  const handleLike = async () => {
    if (!lore) return;
    
    if (!isAuthenticated) {
      alert('Please login to like lore entries');
      return;
    }
    
    try {
      const response = await loreAPI.like(lore._id);
      setLore(prev => prev ? { 
        ...prev, 
        likes: response.data.likes,
        hasLiked: response.data.hasLiked 
      } as any : null);
    } catch (err: any) {
      console.error('Failed to like lore:', err);
      if (err.response?.status === 401) {
        alert('Please login to like lore entries');
      } else if (err.response?.status === 400) {
        alert(err.response.data.error || 'You have already liked this lore entry');
      } else {
        alert('Failed to like lore entry');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading lore entry...</p>
      </div>
    );
  }

  if (error || !lore) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'Content not found'}</p>
        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="lore-detail-page">
      <div className="lore-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        
        <div className="lore-info">
          <div className="lore-meta">
            <span className="lore-category">{lore.category}</span>
            <span className="lore-date">
              {new Date(lore.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <h1>{lore.title}</h1>
          
          <div className="lore-stats">
            <span>{lore.likes} likes</span>
          </div>
          
          <div className="lore-actions">
            <button 
              onClick={handleLike}
              className={`like-btn ${(lore as any).hasLiked ? 'liked' : ''}`}
              disabled={(lore as any).hasLiked || !isAuthenticated}
            >
              {(lore as any).hasLiked ? 'Liked' : 'Like'} ({lore.likes})
            </button>
          </div>
        </div>
      </div>

      <div className="lore-content-section">
        <div className="lore-content">
          {lore.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="comments-section">
        <CommentSection 
          contentId={lore._id} 
          contentType="Lore" 
        />
      </div>
    </div>
  );
};

export default LoreDetailPage;