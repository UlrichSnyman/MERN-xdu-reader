import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { worksAPI, suggestionsAPI } from '../services/api';
import { Work, Suggestion } from '../types';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'works' | 'suggestions'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [worksResponse, suggestionsResponse] = await Promise.all([
          worksAPI.getAll(),
          suggestionsAPI.getAll()
        ]);
        setWorks(worksResponse.data);
        setSuggestions(suggestionsResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteWork = async (workId: string) => {
    if (window.confirm('Are you sure you want to delete this work? This action cannot be undone.')) {
      try {
        await worksAPI.delete(workId);
        setWorks(works.filter(work => work._id !== workId));
      } catch (error) {
        console.error('Error deleting work:', error);
        alert('Failed to delete work');
      }
    }
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
    try {
      await suggestionsAPI.delete(suggestionId);
      setSuggestions(suggestions.filter(s => s._id !== suggestionId));
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      alert('Failed to delete suggestion');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.username}!</p>
      </div>

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'works' ? 'active' : ''}
          onClick={() => setActiveTab('works')}
        >
          Works ({works.length})
        </button>
        <button
          className={activeTab === 'suggestions' ? 'active' : ''}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions ({suggestions.length})
        </button>
      </nav>

      {activeTab === 'overview' && (
        <div className="dashboard-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Works</h3>
              <div className="stat-number">{works.length}</div>
            </div>
            <div className="stat-card">
              <h3>Total Suggestions</h3>
              <div className="stat-number">{suggestions.length}</div>
            </div>
            <div className="stat-card">
              <h3>Total Likes</h3>
              <div className="stat-number">
                {works.reduce((total, work) => total + work.likes, 0)}
              </div>
            </div>
          </div>

          <div className="recent-activity">
            <h3>Recent Suggestions</h3>
            {suggestions.slice(0, 5).map(suggestion => (
              <div key={suggestion._id} className="activity-item">
                <p>{suggestion.content.substring(0, 100)}...</p>
                <small>{new Date(suggestion.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'works' && (
        <div className="dashboard-works">
          <div className="section-header">
            <h3>Manage Works</h3>
            <p>View and manage your literary works</p>
          </div>
          
          <div className="works-list">
            {works.map(work => (
              <div key={work._id} className="work-item">
                <div className="work-info">
                  <h4>{work.title}</h4>
                  <p>{work.synopsis}</p>
                  <div className="work-meta">
                    <span className="category">{work.category}</span>
                    <span className="likes">❤️ {work.likes}</span>
                    <span className="date">
                      {new Date(work.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="work-actions">
                  <button 
                    onClick={() => handleDeleteWork(work._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {works.length === 0 && (
              <p className="empty-state">No works created yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="dashboard-suggestions">
          <div className="section-header">
            <h3>User Suggestions</h3>
            <p>Feedback and suggestions from your readers</p>
          </div>
          
          <div className="suggestions-list">
            {suggestions.map(suggestion => (
              <div key={suggestion._id} className="suggestion-item">
                <div className="suggestion-content">
                  <p>{suggestion.content}</p>
                  <div className="suggestion-meta">
                    {suggestion.authorName && (
                      <span className="author">By: {suggestion.authorName}</span>
                    )}
                    <span className="date">
                      {new Date(suggestion.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteSuggestion(suggestion._id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            ))}
            {suggestions.length === 0 && (
              <p className="empty-state">No suggestions yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;