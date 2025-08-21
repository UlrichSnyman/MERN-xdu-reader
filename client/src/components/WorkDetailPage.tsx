import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { worksAPI } from '../services/api';
import { Work } from '../types';
import { useAuth } from '../context/AuthContext';
import './WorkDetailPage.css';

const WorkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchWork = async () => {
      if (!id) return;
      
      try {
        const response = await worksAPI.getById(id);
        setWork(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load work');
      } finally {
        setLoading(false);
      }
    };

    fetchWork();
  }, [id]);

  const handleLike = async () => {
    if (!work) return;
    
    if (!isAuthenticated) {
      alert('Please login to like works');
      return;
    }
    
    try {
      const response = await worksAPI.like(work._id);
      setWork(prev => prev ? { 
        ...prev, 
        likes: response.data.likes,
        hasLiked: response.data.hasLiked 
      } as any : null);
    } catch (err: any) {
      console.error('Failed to like work:', err);
      if (err.response?.status === 401) {
        alert('Please login to like works');
      } else if (err.response?.status === 400) {
        alert(err.response.data.error || 'You have already liked this work');
      } else {
        alert('Failed to like work');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading work details...</p>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'Work not found'}</p>
        <Link to="/" className="back-link">← Back to Library</Link>
      </div>
    );
  }

  return (
    <div className="work-detail-page">
      <div className="work-header">
        <Link to="/" className="back-link">← Back to Library</Link>
        
        <div className="work-info">
          {work.coverImage && (
            <div className="work-cover-large">
              <img src={work.coverImage} alt={work.title} />
            </div>
          )}
          <div className="work-details">
            <h1>{work.title}</h1>
            <span className="work-category">{work.category}</span>
            {work.synopsis && (
              <p className="work-synopsis">{work.synopsis}</p>
            )}
            <div className="work-stats">
              <span>{work.likes} likes</span>
              <span>{Array.isArray(work.pages) ? work.pages.length : 0} pages</span>
              {(work as any).userProgress && (
                <span>
                  Progress: {(work as any).userProgress.pagesRead}/{(work as any).userProgress.totalPages} pages
                </span>
              )}
            </div>
            <div className="work-actions">
              <button 
                onClick={handleLike}
                className={`like-btn ${(work as any).hasLiked ? 'liked' : ''}`}
                disabled={(work as any).hasLiked || !isAuthenticated}
              >
                {(work as any).hasLiked ? 'Liked' : 'Like'} ({work.likes})
              </button>
              {Array.isArray(work.pages) && work.pages.length > 0 && (
                <Link 
                  to={`/read/${typeof work.pages[0] === 'string' ? work.pages[0] : work.pages[0]._id}`} 
                  className="read-btn read-first"
                >
                  Start Reading
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pages-section">
        <h2>Pages</h2>
        {Array.isArray(work.pages) && work.pages.length > 0 ? (
          <div className="pages-grid">
            {work.pages.map((page, index) => (
              <div key={typeof page === 'string' ? page : page._id} className="page-card">
                <div className="page-header">
                  <span className="page-number">Page {index + 1}</span>
                  {typeof page !== 'string' && (
                    <span className="page-date">
                      {new Date(page.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="page-content">
                  <h3 className="page-title">
                    {typeof page === 'string' ? 'Loading...' : page.title}
                  </h3>
                </div>
                <div className="page-actions">
                  <Link 
                    to={`/read/${typeof page === 'string' ? page : page._id}`}
                    className="read-page-btn"
                  >
                    Read Page
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-pages">
            <p>No pages available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkDetailPage;