import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { pagesAPI, worksAPI } from '../services/api';
import { Page, ReaderSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import CommentSection from './CommentSection';
import RichTextEditor from './RichTextEditor';
import './ReaderView.css';

const ReaderView: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: 16,
    fontFamily: 'default',
    isPlaying: false,
    speechRate: 1.0,
    selectedVoice: '',
  });
  const { isAuthenticated, user } = useAuth();
  
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Admin edit state - changed from modal to inline
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const fetchPage = async () => {
      if (!pageId) return;
      
      try {
        const response = await pagesAPI.getById(pageId);
        setPage(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [pageId]);

  // Track reading progress when page loads
  useEffect(() => {
    const trackProgress = async () => {
      if (page && isAuthenticated && page.work) {
        try {
          const workId = typeof page.work === 'string' ? page.work : (page.work as any)._id;
          await worksAPI.updateProgress(workId, pageId!);
        } catch (err) {
          console.error('Failed to track reading progress:', err);
        }
      }
    };

    trackProgress();
  }, [page, pageId, isAuthenticated]);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        setAvailableVoices(voices);
        if (voices.length > 0 && !settings.selectedVoice) {
          setSettings(prev => ({ ...prev, selectedVoice: voices[0].name }));
        }
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [settings.selectedVoice]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('readerSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('readerSettings', JSON.stringify(settings));
  }, [settings]);

  const startTextToSpeech = () => {
    if (!page || !contentRef.current) return;

    if ('speechSynthesis' in window) {
      // Stop current speech if any
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(page.content);
      utterance.rate = settings.speechRate;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Set selected voice
      const selectedVoice = availableVoices.find(voice => voice.name === settings.selectedVoice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onstart = () => {
        setSettings(prev => ({ ...prev, isPlaying: true }));
      };
      
      utterance.onend = () => {
        setSettings(prev => ({ ...prev, isPlaying: false }));
      };
      
      utterance.onerror = () => {
        setSettings(prev => ({ ...prev, isPlaying: false }));
      };
      
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser.');
    }
  };

  const stopTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSettings(prev => ({ ...prev, isPlaying: false }));
    }
  };

  const navigatePage = (direction: 'previous' | 'next') => {
    if (!page?.navigation) return;
    
    const targetPage = page.navigation[direction];
    if (targetPage) {
      navigate(`/read/${targetPage._id}`);
    }
  };

  const refreshPage = async () => {
    if (!pageId) return;
    try {
      const response = await pagesAPI.getById(pageId);
      setPage(response.data);
    } catch (err) {
      console.error('Failed to refresh page', err);
    }
  };

  const openEditMode = () => {
    if (!page) return;
    setEditContent(page.content);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!page) return;
    try {
      await pagesAPI.update(page._id, { content: editContent });
      setIsEditing(false);
      await refreshPage();
    } catch (err: any) {
      console.error('Failed to save page content:', err);
      alert(err.response?.data?.error || 'Failed to save');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading page...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'Page not found'}</p>
        <Link to="/" className="back-link">← Back to Library</Link>
      </div>
    );
  }

  const contentStyle = {
    fontSize: `${settings.fontSize}px`,
    fontFamily: settings.fontFamily === 'default' ? 'inherit' : 
                settings.fontFamily === 'dyslexic' ? 'OpenDyslexic, sans-serif' :
                settings.fontFamily === 'roboto' ? 'Roboto, sans-serif' :
                settings.fontFamily === 'lora' ? 'Lora, serif' : 'inherit'
  } as React.CSSProperties;

  return (
    <div className="reader-view">
      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Reader Settings</h3>
            
            {/* Font Size with Stopping Points */}
            <div className="setting-group">
              <label>Font Size: {settings.fontSize}px</label>
              <input
                type="range"
                min="12"
                max="24"
                step="2"
                value={settings.fontSize}
                onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
              />
              <div className="slider-labels">
                <span>12px</span>
                <span>14px</span>
                <span>16px</span>
                <span>18px</span>
                <span>20px</span>
                <span>22px</span>
                <span>24px</span>
              </div>
            </div>
            
            {/* Font Family */}
            <div className="setting-group">
              <label>Font Family:</label>
              <div className="font-buttons">
                {['default', 'dyslexic', 'roboto', 'lora'].map(font => (
                  <button
                    key={font}
                    className={settings.fontFamily === font ? 'active' : ''}
                    onClick={() => setSettings(prev => ({ ...prev, fontFamily: font }))}
                  >
                    {font.charAt(0).toUpperCase() + font.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Text-to-Speech */}
            <div className="setting-group">
              <label>Text-to-Speech:</label>
              <div className="tts-controls">
                {/* Voice Selection */}
                <div className="voice-control">
                  <label>Voice:</label>
                  <select
                    value={settings.selectedVoice}
                    onChange={(e) => setSettings(prev => ({ ...prev, selectedVoice: e.target.value }))}
                    className="voice-select"
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={settings.isPlaying ? stopTextToSpeech : startTextToSpeech}
                  className={`tts-btn ${settings.isPlaying ? 'playing' : ''}`}
                >
                  {settings.isPlaying ? 'Pause' : 'Play'}
                </button>
                
                <div className="speed-control">
                  <label>Speed: {settings.speechRate}x</label>
                  <input
                    type="range"
                    min="0.6"
                    max="3"
                    step="0.2"
                    value={settings.speechRate}
                    onChange={(e) => setSettings(prev => ({ ...prev, speechRate: parseFloat(e.target.value) }))}
                  />
                  <div className="slider-labels">
                    <span>0.6x</span>
                    <span>1.0x</span>
                    <span>1.5x</span>
                    <span>2.0x</span>
                    <span>2.5x</span>
                    <span>3.0x</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              className="close-settings"
              onClick={() => setShowSettings(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="reader-header">
        <div className="reader-nav">
          <Link to={`/work/${typeof page.work === 'string' ? page.work : (page.work as any)._id}`} className="back-link">
            ← Back to Work
          </Link>
          <div className="reader-nav-actions">
            {user?.role === 'admin' && (
              <button className="edit-page-btn" onClick={openEditMode}>
                {isEditing ? 'Editing...' : 'Edit'}
              </button>
            )}
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(true)}
            >
              Settings
            </button>
          </div>
        </div>
        
        <div className="page-info">
          <h1>{page.title}</h1>
          <div className="page-meta">
            <span>Page {page.pageNumber}</span>
          </div>
        </div>
      </div>

      <div className="reader-content" ref={contentRef} style={contentStyle}>
        {isEditing ? (
          <div className="inline-editor">
            <RichTextEditor
              value={editContent}
              onChange={setEditContent}
              rows={15}
            />
            <div className="inline-edit-actions">
              <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
              <button className="save-btn" onClick={saveEdit}>Save</button>
            </div>
          </div>
        ) : (
          page.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>
              {paragraph.split('\n').map((line, lineIndex) => (
                <span key={lineIndex}>
                  {line}
                  {lineIndex < paragraph.split('\n').length - 1 && ' '}
                </span>
              ))}
            </p>
          ))
        )}
      </div>

      {/* Side Arrow Navigation */}
      {page.navigation?.previous && (
        <button
          onClick={() => navigatePage('previous')}
          className="nav-arrow nav-arrow-left"
          aria-label="Previous Page"
        >
          ←
        </button>
      )}
      
      {page.navigation?.next && (
        <button
          onClick={() => navigatePage('next')}
          className="nav-arrow nav-arrow-right"
          aria-label="Next Page"
        >
          →
        </button>
      )}

      {/* Comments Section */}
      <CommentSection 
        contentId={page._id}
        contentType="Page"
      />

    </div>
  );
};

export default ReaderView;