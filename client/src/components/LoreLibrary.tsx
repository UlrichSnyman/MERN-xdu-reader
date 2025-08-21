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

  const categories = ['worldbuilding', 'characters', 'history', 'locations', 'magic', 'general'];

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
  }, [selectedCategory]);

  const handleLike = async (loreId: string) => {
    if (!isAuthenticated) {
      alert('Please login to like lore entries');
      return;
    }
    
    try {
      const response = await loreAPI.like(loreId);
      setLoreEntries(prevLore =>
        prevLore.map(lore =>
          lore._id === loreId ? { 
            ...lore, 
            likes: response.data.likes,
            hasLiked: response.data.hasLiked 
          } as any : lore
        )
      );
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
    <div className="lore-library">
      <div className="lore-header">
        <h1>Lore Library</h1>
        <p>Discover the rich world and characters behind the stories</p>
      </div>

      <div className="lore-filters">
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
      </div>

      {loreEntries.length > 0 ? (
        <div className="lore-grid">
          {loreEntries.map((lore) => (
            <div key={lore._id} className="lore-card">
              <div className="lore-header-card">
                <span className="lore-category">{lore.category}</span>
                <span className="lore-date">
                  {new Date(lore.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="lore-content">
                <h3>{lore.title}</h3>
                <p className="lore-preview">
                  {lore.content.length > 150 
                    ? `${lore.content.substring(0, 150)}...` 
                    : lore.content
                  }
                </p>
              </div>
              <div className="lore-actions">
                <Link to={`/lore/${lore._id}`} className="read-btn">
                  Read More
                </Link>
                <button 
                  onClick={() => handleLike(lore._id)}
                  className={`like-btn ${(lore as any).hasLiked ? 'liked' : ''}`}
                  disabled={(lore as any).hasLiked || !isAuthenticated}
                >
                  {(lore as any).hasLiked ? 'Liked' : 'Like'} ({lore.likes})
                </button>
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
  );
};

export default LoreLibrary;