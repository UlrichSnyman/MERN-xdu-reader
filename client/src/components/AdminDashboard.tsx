import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { worksAPI, suggestionsAPI, pagesAPI, uploadAPI } from '../services/api';
import { Work, Suggestion } from '../types';
import RichTextEditor from './RichTextEditor';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'works' | 'suggestions' | 'create' | 'upload' | 'progress'>('overview');
  
  // Form states for creating content
  const [workForm, setWorkForm] = useState({
    title: '',
    synopsis: '',
    coverImage: '',
    category: 'library' as 'library' | 'lore'
  });
  
  const [pageForm, setPageForm] = useState({
    title: '',
    content: '',
    workId: '',
    pageNumber: 1
  });

  const [uploadForm, setUploadForm] = useState({
    title: '',
    synopsis: '',
    destination: 'library' as 'library' | 'lore',
    category: 'general'
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progressStats, setProgressStats] = useState<any[]>([]);

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

  const fetchProgressStats = async () => {
    try {
      const response = await worksAPI.getProgressStats();
      setProgressStats(response.data);
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'progress') {
      fetchProgressStats();
    }
  }, [activeTab]);

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

  const handleCreateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workForm.title.trim()) {
      alert('Title is required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await worksAPI.create(workForm);
      setWorks([response.data, ...works]);
      setWorkForm({ title: '', synopsis: '', coverImage: '', category: 'library' });
      alert('Work created successfully!');
    } catch (error) {
      console.error('Error creating work:', error);
      alert('Failed to create work');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageForm.title.trim() || !pageForm.content.trim() || !pageForm.workId) {
      alert('Title, content, and work selection are required');
      return;
    }

    setSubmitting(true);
    try {
      await pagesAPI.create(pageForm);
      setPageForm({ title: '', content: '', workId: '', pageNumber: 1 });
      alert('Page created successfully!');
      // Refresh works to update page count
      const worksResponse = await worksAPI.getAll();
      setWorks(worksResponse.data);
    } catch (error) {
      console.error('Error creating page:', error);
      alert('Failed to create page');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadForm.title.trim()) {
      alert('Please select a PDF file and provide a title');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('title', uploadForm.title);
      formData.append('destination', uploadForm.destination);
      if (uploadForm.synopsis) formData.append('synopsis', uploadForm.synopsis);
      if (uploadForm.category) formData.append('category', uploadForm.category);

      const response = await uploadAPI.uploadPDF(formData);
      const resultType = response.data.result.type;
      const resultData = response.data.result.data;
      
      alert(`PDF processed successfully! Created ${resultType}: ${resultData.title}`);
      
      setUploadForm({ title: '', synopsis: '', destination: 'library', category: 'general' });
      setSelectedFile(null);
      
      // Only refresh works if we uploaded to library, not lore
      if (uploadForm.destination === 'library') {
        const worksResponse = await worksAPI.getAll();
        setWorks(worksResponse.data);
      } else {
        // For lore uploads, navigate to lore library
        console.log('Lore entry created successfully:', resultData);
        setTimeout(() => {
          navigate('/lore');
        }, 1500); // Give user time to see success message
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Failed to upload PDF');
    } finally {
      setSubmitting(false);
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
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          Create Content
        </button>
        <button
          className={activeTab === 'upload' ? 'active' : ''}
          onClick={() => setActiveTab('upload')}
        >
          Upload PDF
        </button>
        <button
          className={activeTab === 'progress' ? 'active' : ''}
          onClick={() => setActiveTab('progress')}
        >
          Reading Progress
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
                    <span className="likes">Likes: {work.likes}</span>
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

      {activeTab === 'create' && (
        <div className="dashboard-create">
          <div className="section-header">
            <h3>Create New Content</h3>
            <p>Manually create works and pages with rich text editing</p>
          </div>

          <div className="create-forms">
            <div className="form-section">
              <h4>Create New Work</h4>
              <form onSubmit={handleCreateWork} className="create-form">
                <div className="form-group">
                  <label htmlFor="work-title">Title *</label>
                  <input
                    id="work-title"
                    type="text"
                    value={workForm.title}
                    onChange={(e) => setWorkForm({...workForm, title: e.target.value})}
                    required
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="work-synopsis">Synopsis</label>
                  <textarea
                    id="work-synopsis"
                    value={workForm.synopsis}
                    onChange={(e) => setWorkForm({...workForm, synopsis: e.target.value})}
                    rows={3}
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="work-cover">Cover Image URL</label>
                  <input
                    id="work-cover"
                    type="url"
                    value={workForm.coverImage}
                    onChange={(e) => setWorkForm({...workForm, coverImage: e.target.value})}
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="work-category">Category</label>
                  <select
                    id="work-category"
                    value={workForm.category}
                    onChange={(e) => setWorkForm({...workForm, category: e.target.value as 'library' | 'lore'})}
                    disabled={submitting}
                  >
                    <option value="library">Library</option>
                    <option value="lore">Lore</option>
                  </select>
                </div>
                
                <button type="submit" disabled={submitting || !workForm.title.trim()}>
                  {submitting ? 'Creating...' : 'Create Work'}
                </button>
              </form>
            </div>

            <div className="form-section">
              <h4>Create New Page</h4>
              <form onSubmit={handleCreatePage} className="create-form">
                <div className="form-group">
                  <label htmlFor="page-work">Select Work *</label>
                  <select
                    id="page-work"
                    value={pageForm.workId}
                    onChange={(e) => setPageForm({...pageForm, workId: e.target.value})}
                    required
                    disabled={submitting}
                  >
                    <option value="">Choose a work...</option>
                    {works.map(work => (
                      <option key={work._id} value={work._id}>
                        {work.title} ({work.category})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="page-title">Page Title *</label>
                  <input
                    id="page-title"
                    type="text"
                    value={pageForm.title}
                    onChange={(e) => setPageForm({...pageForm, title: e.target.value})}
                    required
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="page-number">Page Number</label>
                  <input
                    id="page-number"
                    type="number"
                    min="1"
                    value={pageForm.pageNumber}
                    onChange={(e) => setPageForm({...pageForm, pageNumber: parseInt(e.target.value)})}
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="page-content">Content *</label>
                  <RichTextEditor
                    value={pageForm.content}
                    onChange={(content) => setPageForm({...pageForm, content})}
                    placeholder="Write your page content here..."
                    rows={12}
                  />
                </div>
                
                <button type="submit" disabled={submitting || !pageForm.title.trim() || !pageForm.content.trim() || !pageForm.workId}>
                  {submitting ? 'Creating...' : 'Create Page'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="dashboard-upload">
          <div className="section-header">
            <h3>Upload PDF</h3>
            <p>Upload and process PDF files to automatically create works or lore entries</p>
          </div>

          <form onSubmit={handleFileUpload} className="upload-form">
            <div className="form-group">
              <label htmlFor="pdf-file">Select PDF File *</label>
              <input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
                disabled={submitting}
              />
              {selectedFile && (
                <p className="file-info">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="upload-title">Title *</label>
              <input
                id="upload-title"
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                required
                disabled={submitting}
                placeholder="Enter a title for the content"
              />
            </div>

            <div className="form-group">
              <label htmlFor="upload-synopsis">Synopsis/Description</label>
              <textarea
                id="upload-synopsis"
                value={uploadForm.synopsis}
                onChange={(e) => setUploadForm({...uploadForm, synopsis: e.target.value})}
                rows={3}
                disabled={submitting}
                placeholder="Optional description of the content"
              />
            </div>

            <div className="form-group">
              <label htmlFor="upload-destination">Destination *</label>
              <select
                id="upload-destination"
                value={uploadForm.destination}
                onChange={(e) => setUploadForm({...uploadForm, destination: e.target.value as 'library' | 'lore'})}
                disabled={submitting}
              >
                <option value="library">Library (Create work with pages)</option>
                <option value="lore">Lore (Create single lore entry)</option>
              </select>
            </div>

            {uploadForm.destination === 'lore' && (
              <div className="form-group">
                <label htmlFor="upload-category">Lore Category</label>
                <input
                  id="upload-category"
                  type="text"
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                  disabled={submitting}
                  placeholder="e.g., worldbuilding, history, characters"
                />
              </div>
            )}

            <div className="upload-info">
              <h5>Processing Info:</h5>
              <ul>
                <li><strong>Library:</strong> PDF will be split into pages (~2000 characters each)</li>
                <li><strong>Lore:</strong> Entire PDF content will become a single lore entry</li>
                <li><strong>File Size Limit:</strong> 10MB maximum</li>
                <li><strong>Format:</strong> Text will be extracted automatically</li>
              </ul>
            </div>

            <button type="submit" disabled={submitting || !selectedFile || !uploadForm.title.trim()}>
              {submitting ? 'Processing...' : 'Upload and Process PDF'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="dashboard-progress">
          <div className="section-header">
            <h3>Reading Progress</h3>
            <p>View how far readers have progressed through your works</p>
          </div>
          
          <div className="progress-list">
            {progressStats.map(work => (
              <div key={work.workId} className="progress-work">
                <div className="work-header">
                  <h4>{work.title}</h4>
                  <span className="total-pages">{work.totalPages} pages</span>
                </div>
                
                {work.readers.length > 0 ? (
                  <div className="readers-list">
                    {work.readers.map((reader: any, index: number) => (
                      <div key={index} className="reader-progress">
                        <div className="reader-info">
                          <span className="reader-name">{reader.username}</span>
                          <span className="last-read">
                            Last read: {new Date(reader.lastReadAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${reader.progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="progress-stats">
                          <span>{reader.pagesRead}/{work.totalPages} pages ({reader.progressPercentage}%)</span>
                          <span>Current page: {reader.currentPage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-readers">
                    <p>No readers have started this work yet.</p>
                  </div>
                )}
              </div>
            ))}
            
            {progressStats.length === 0 && (
              <div className="no-progress">
                <p>No reading progress data available yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;