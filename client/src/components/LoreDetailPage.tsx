import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loreAPI } from '../services/api';
import { Lore } from '../types';
import CommentSection from './CommentSection';
import './LoreDetailPage.css';

const LoreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lore, setLore] = useState<Lore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <p>{error || 'Lore entry not found'}</p>
        <Link to="/lore" className="back-link">← Back to Lore Library</Link>
      </div>
    );
  }

  return (
    <div className="lore-detail-page">
      <Link to="/lore" className="back-link">← Back to Lore Library</Link>
      
      <div className="lore-header">
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