import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { worksAPI } from '../services/api';
import { Work } from '../types';
import './WorkDetailPage.css';

const WorkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              <span>❤️ {work.likes} likes</span>
              <span>📚 {Array.isArray(work.pages) ? work.pages.length : 0} pages</span>
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
                  <h3>
                    Page {index + 1}: {typeof page === 'string' ? 'Loading...' : page.title}
                  </h3>
                  {typeof page !== 'string' && (
                    <p className="page-date">
                      Added: {new Date(page.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Link 
                  to={`/read/${typeof page === 'string' ? page : page._id}`}
                  className="read-page-btn"
                >
                  Read Page
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-pages">No pages available yet.</p>
        )}
      </div>
    </div>
  );
};

export default WorkDetailPage;