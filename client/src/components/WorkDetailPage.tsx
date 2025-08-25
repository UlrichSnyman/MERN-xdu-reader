import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { worksAPI, pagesAPI } from '../services/api';
import { Work } from '../types';
import { useAuth } from '../context/AuthContext';
import './WorkDetailPage.css';

const WorkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

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

  const refreshWork = async () => {
    if (!id) return;
    try {
      const response = await worksAPI.getById(id);
      setWork(response.data);
    } catch (err) {
      console.error('Failed to refresh work', err);
    }
  };

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

  // Admin: edit a page title
  const handleEditPageTitle = async (pageId: string, currentTitle: string) => {
    if (!user || user.role !== 'admin') return;
    const newTitle = window.prompt('Edit page title:', currentTitle || '');
    if (newTitle === null) return; // cancelled
    try {
      await pagesAPI.update(pageId, { title: newTitle });
      await refreshWork();
    } catch (err: any) {
      console.error('Failed to update page title:', err);
      alert(err.response?.data?.error || 'Failed to update title');
    }
  };

  // Admin: delete a page
  const handleDeletePage = async (pageId: string, pageNumber: number) => {
    if (!user || user.role !== 'admin') return;
    const ok = window.confirm(`Delete page ${pageNumber}? This cannot be undone.`);
    if (!ok) return;
    try {
      await pagesAPI.delete(pageId);
      await refreshWork();
    } catch (err: any) {
      console.error('Failed to delete page:', err);
      alert(err.response?.data?.error || 'Failed to delete page');
    }
  };

  // Admin: add a new blank page to the end
  const handleAddPage = async () => {
    if (!user || user.role !== 'admin' || !work) return;
    const lastNumber = Array.isArray(work.pages)
      ? (work.pages as any[]).reduce((max: number, p: any) => Math.max(max, typeof p === 'string' ? 0 : (p.pageNumber || 0)), 0)
      : 0;
    const nextNumber = lastNumber + 1;
    const defaultTitle = `Page ${nextNumber}`;
    try {
      await pagesAPI.create({
        workId: work._id,
        pageNumber: nextNumber,
        title: defaultTitle,
        content: ' ' // server requires non-empty content; start blank
      });
      await refreshWork();
    } catch (err: any) {
      console.error('Failed to add page:', err);
      alert(err.response?.data?.error || 'Failed to add page');
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
      <Link to="/" className="back-link">← Back to Library</Link>
      
      <div className="work-header">
        <div className="work-info">
          {work.coverImage && (
            <div className="work-cover-large">
              <img src={work.coverImage} alt={work.title} />
            </div>
          )}
          <div className="work-details">
            <h1>{work.title}</h1>
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
                  to={`/read/${typeof work.pages[0] === 'string' ? work.pages[0] : (work.pages[0] as any)._id}`} 
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
            {work.pages.map((page: any, index: number) => (
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
                <div className="page-actions">
                  <Link 
                    to={`/read/${typeof page === 'string' ? page : page._id}`}
                    className="read-page-btn"
                  >
                    Read
                  </Link>
                  {user?.role === 'admin' && typeof page !== 'string' && (
                    <>
                      <button
                        className="edit-page-btn"
                        onClick={() => handleEditPageTitle(page._id, page.title)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-page-btn"
                        onClick={() => handleDeletePage(page._id, page.pageNumber)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {user?.role === 'admin' && (
              <button className="page-item add-page-item" onClick={handleAddPage}>
                <div className="add-page-content">
                  <span className="plus">+</span>
                  <span className="add-label">Add new page</span>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="no-pages">
            <p>No pages available yet.</p>
            {user?.role === 'admin' && (
              <button className="add-first-page-btn" onClick={handleAddPage}>+ Add first page</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkDetailPage;