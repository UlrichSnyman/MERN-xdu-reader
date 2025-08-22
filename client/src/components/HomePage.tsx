import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { worksAPI } from '../services/api';
import { Work } from '../types';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const response = await worksAPI.getAll();
        setWorks(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load works');
      } finally {
        setLoading(false);
      }
    };

    fetchWorks();
  }, [isAuthenticated]);

  const handleLikeToggle = async (workId: string) => {
    if (!isAuthenticated) {
      alert('Please login to like or unlike works');
      return;
    }

    const work = works.find(w => w._id === workId);
    if (!work) return;

    const hasLiked = (work as any).hasLiked;

    try {
      const apiCall = hasLiked ? worksAPI.unlike : worksAPI.like;
      const response = await apiCall(workId);
      const updatedWork = response.data;

      setWorks(prevWorks =>
        prevWorks.map(w =>
          w._id === workId ? { ...w, ...updatedWork } : w
        )
      );
    } catch (err: any) {
      console.error(`Failed to ${hasLiked ? 'unlike' : 'like'} work:`, err);
      // If server says already liked from previous state, sync UI so user can unlike next
      if (!hasLiked && err?.response?.status === 400) {
        // Manually sync the client state if the server says it's already liked
        setWorks(prevWorks => prevWorks.map(w => w._id === workId ? { ...w, hasLiked: true } : w));
        return;
      }
      alert('An error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading literary works...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="homepage">
      <div className="hero-section">
        <h1>Welcome to the Literary Collection</h1>
        <p>Discover captivating stories and immerse yourself in rich narratives</p>
      </div>

      <div className="works-section">
        <h2>Literary Works</h2>
        {works.length === 0 ? (
          <p className="no-works">No works available yet. Check back soon!</p>
        ) : (
          <div className="works-grid">
            {works.map((work) => (
              <div key={work._id} className="work-card">
                <div className="work-cover">
                  {work.coverImage ? (
                    <img src={work.coverImage} alt={work.title} />
                  ) : (
                    <div className="work-cover-placeholder">
                      {work.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="work-content">
                  <h3>{work.title}</h3>
                  <span className="work-category">{work.category}</span>
                  {work.synopsis && (
                    <p className="work-synopsis">{work.synopsis}</p>
                  )}
                  <div className="work-actions">
                    <Link to={`/work/${work._id}`} className="read-btn">
                      Browse
                    </Link>
                    {Array.isArray(work.pages) && work.pages.length > 0 && (
                      <Link 
                        to={`/read/${typeof work.pages[0] === 'string' ? work.pages[0] : work.pages[0]._id}`} 
                        className="read-btn read-first"
                      >
                        Read First
                      </Link>
                    )}
                    <button 
                      onClick={() => handleLikeToggle(work._id)}
                      className={`like-btn ${(work as any).hasLiked ? 'liked' : ''}`}
                      disabled={!isAuthenticated}
                    >
                      {(work as any).hasLiked ? 'Liked' : 'Like'} ({work.likes})
                    </button>
                  </div>
                  {( (work as any).likedByUsers && (work as any).likedByUsers.length > 0 ) && (
                    <div className="liked-by-box">
                      <span className="liked-by-title">Liked by:</span>
                      <div className="liked-by-list">
                        {(work as any).likedByUsers.map((u: any) => (
                          <span key={u._id} className="liked-by-chip">{u.username}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="work-meta">
                    <small>
                      Published: {new Date(work.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;