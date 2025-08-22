import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loreAPI } from '../services/api';
import { Lore } from '../types';
import { useAuth } from '../context/AuthContext';
import './LoreLibrary.css';

const LoreLibrary: React.FC = () => {
  const [loreEntries, setLoreEntries] = useState<Lore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { isAuthenticated } = useAuth();

  const categories = ['worldbuilding', 'characters', 'history', 'locations', 'general'];

  useEffect(() => {
    const fetchLore = async () => {
      try {
        const response = await loreAPI.getAll(selectedCategory || undefined);
        setLoreEntries(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load lore entries');
      } finally {
        setLoading(false);
      }
    };

    fetchLore();
  }, [selectedCategory, isAuthenticated]);

  const handleLikeToggle = async (loreId: string) => {
    if (!isAuthenticated) {
      alert('Please login to like or unlike lore entries');
      return;
    }

    const loreEntry = loreEntries.find(l => l._id === loreId);
    if (!loreEntry) return;

    const hasLiked = (loreEntry as any).hasLiked;

    try {
      const apiCall = hasLiked ? loreAPI.unlike : loreAPI.like;
      const response = await apiCall(loreId);
      const updatedLore = response.data;

      setLoreEntries(prevLore =>
        prevLore.map(lore =>
          lore._id === loreId ? { ...lore, ...updatedLore } : lore
        )
      );
    } catch (err: any) {
      console.error(`Failed to ${hasLiked ? 'unlike' : 'like'} lore:`, err);
      // If server says already liked from previous state, sync UI so user can unlike next
      if (!hasLiked && err?.response?.status === 400) {
        setLoreEntries(prevLore => prevLore.map(l => l._id === loreId ? { ...l, hasLiked: true } as any : l));
        return;
      }
      alert(`An error occurred. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading lore library...</p>
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
        <h1>Lore Library</h1>
        <p>Discover the rich world and characters behind the stories</p>
      </div>

      <div className="works-section">
        <div className="category-filters">
          <button 
            className={selectedCategory === '' ? 'active' : ''} 
            onClick={() => setSelectedCategory('')}
          >
            All Categories
          </button>
          {categories.map(category => (
            <button 
              key={category}
              className={selectedCategory === category ? 'active' : ''} 
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {loreEntries.length > 0 ? (
          <div className="works-grid">
            {loreEntries.map((lore) => (
              <div key={lore._id} className="work-card">
                <div className="work-cover">
                  <div className="work-cover-placeholder">
                    {lore.title.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="work-content">
                  <h3>{lore.title}</h3>
                  <span className="work-category">{lore.category}</span>
                  <p className="work-synopsis">
                    {lore.content && lore.content.length > 150
                      ? `${lore.content.substring(0, 150)}...`
                      : lore.content}
                  </p>
                  <div className="work-actions">
                    <Link to={`/lore/${lore._id}`} className="read-btn">
                      Read More
                    </Link>
                    <div 
                      onClick={() => handleLikeToggle(lore._id)}
                      className={`read-btn ${(lore as any).hasLiked ? 'read-first' : ''}`}
                      style={{ 
                        cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                        opacity: isAuthenticated ? 1 : 0.6
                      }}
                    >
                      {(lore as any).hasLiked ? 'Liked' : 'Like'} ({lore.likes})
                    </div>
                  </div>
                  {( (lore as any).likedByUsers && (lore as any).likedByUsers.length > 0 ) && (
                    <div className="liked-by-box">
                      <span className="liked-by-title">Liked by:</span>
                      <div className="liked-by-list">
                        {(lore as any).likedByUsers.map((u: any) => (
                          <span key={u._id} className="liked-by-chip">{u.username}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="work-meta">
                    <small>
                      Published: {new Date(lore.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-lore">
            <h3>No lore entries found</h3>
            <p>
              {selectedCategory 
                ? `No lore entries in the "${selectedCategory}" category yet.`
                : 'No lore entries available yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoreLibrary;