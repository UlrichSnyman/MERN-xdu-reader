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
  }, []);

  const handleLike = async (workId: string) => {
    if (!isAuthenticated) {
      alert('Please login to like works');
      return;
    }
    
    try {
      const response = await worksAPI.like(workId);
      // Update the likes count and hasLiked status locally
      setWorks(prevWorks =>
        prevWorks.map(work =>
          work._id === workId ? { 
            ...work, 
            likes: response.data.likes,
            hasLiked: response.data.hasLiked 
          } : work
        )
      );
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
                      onClick={() => handleLike(work._id)}
                      className={`like-btn ${(work as any).hasLiked ? 'liked' : ''}`}
                      disabled={(work as any).hasLiked || !isAuthenticated}
                    >
                      {(work as any).hasLiked ? 'Liked' : 'Like'} ({work.likes})
                    </button>
                  </div>
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