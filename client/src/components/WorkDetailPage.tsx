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

  const handleLikeToggle = async () => {
    if (!work) return;

    if (!isAuthenticated) {
      alert('Please login to like or unlike works');
      return;
    }

    const hasLiked = (work as any).hasLiked;

    try {
      const apiCall = hasLiked ? worksAPI.unlike : worksAPI.like;
      const response = await apiCall(work._id);
      
      setWork(prev => prev ? { 
        ...prev, 
        likes: response.data.likes,
        hasLiked: !hasLiked 
      } as any : null);

    } catch (err: any) {
      console.error(`Failed to ${hasLiked ? 'unlike' : 'like'} work:`, err);
      alert(`An error occurred. Please try again.`);
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
                onClick={handleLikeToggle}
                className={`like-btn ${(work as any).hasLiked ? 'liked' : ''}`}
                disabled={!isAuthenticated}
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
          <div className="pages-list">
            {work.pages.map((page, index) => (
              <div key={typeof page === 'string' ? page : page._id} className="page-item">
                <div className="page-info">
                  <span className="page-number">{index + 1}</span>
                  <h3 className="page-title">
                    {typeof page === 'string' ? 'Loading...' : page.title}
                  </h3>
                  {typeof page !== 'string' && (
                    <span className="page-date">
                      {new Date(page.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <Link 
                  to={`/read/${typeof page === 'string' ? page : page._id}`}
                  className="read-page-btn"
                >
                  Read
                </Link>
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