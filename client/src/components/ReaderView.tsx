import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { chaptersAPI } from '../services/api';
import { Chapter, ReaderSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import CommentSection from './CommentSection';
import './ReaderView.css';

const ReaderView: React.FC = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: 16,
    fontFamily: 'default',
    isPlaying: false,
    speechRate: 1.0,
  });
  
  const contentRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const fetchChapter = async () => {
      if (!chapterId) return;
      
      try {
        const response = await chaptersAPI.getById(chapterId);
        setChapter(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load chapter');
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [chapterId]);

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

  const handleLike = async () => {
    if (!chapter) return;
    
    if (!isAuthenticated) {
      alert('Please login to like chapters');
      return;
    }
    
    try {
      await chaptersAPI.like(chapter._id);
      setChapter({ ...chapter, likes: chapter.likes + 1 });
    } catch (error: any) {
      console.error('Failed to like chapter:', error);
      if (error.response?.status === 401) {
        alert('Please login to like chapters');
      } else {
        alert('Failed to like chapter');
      }
    }
  };

  const startTextToSpeech = () => {
    if (!chapter || !contentRef.current) return;

    if ('speechSynthesis' in window) {
      // Stop current speech if any
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(chapter.content);
      utterance.rate = settings.speechRate;
      utterance.pitch = 1;
      utterance.volume = 1;
      
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

  const navigateChapter = (direction: 'previous' | 'next') => {
    if (!chapter?.navigation) return;
    
    const targetChapter = chapter.navigation[direction];
    if (targetChapter) {
      navigate(`/read/${targetChapter._id}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading chapter...</p>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'Chapter not found'}</p>
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
  };

  return (
    <div className="reader-view">
      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Reader Settings</h3>
            
            {/* Font Size */}
            <div className="setting-group">
              <label>Font Size: {settings.fontSize}px</label>
              <input
                type="range"
                min="12"
                max="24"
                value={settings.fontSize}
                onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
              />
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
                <button
                  onClick={settings.isPlaying ? stopTextToSpeech : startTextToSpeech}
                  className={`tts-btn ${settings.isPlaying ? 'playing' : ''}`}
                >
                  {settings.isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>
                
                <div className="speed-control">
                  <label>Speed: {settings.speechRate}x</label>
                  <input
                    type="range"
                    min="0.6"
                    max="3"
                    step="0.1"
                    value={settings.speechRate}
                    onChange={(e) => setSettings(prev => ({ ...prev, speechRate: parseFloat(e.target.value) }))}
                  />
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
          <Link to={`/work/${typeof chapter.work === 'string' ? chapter.work : chapter.work._id}`} className="back-link">
            ← Back to Work
          </Link>
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(true)}
          >
            ⚙️ Settings
          </button>
        </div>
        
        <div className="chapter-info">
          <h1>{chapter.title}</h1>
          <div className="chapter-meta">
            <span>Chapter {chapter.chapterNumber}</span>
            <button onClick={handleLike} className="like-btn">
              ❤️ {chapter.likes}
            </button>
          </div>
        </div>
      </div>

      <div className="reader-content" ref={contentRef} style={contentStyle}>
        {chapter.content.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* Chapter Navigation */}
      <div className="chapter-navigation">
        <button
          onClick={() => navigateChapter('previous')}
          disabled={!chapter.navigation?.previous}
          className="nav-btn prev-btn"
        >
          ← Previous Chapter
        </button>
        
        <button
          onClick={() => navigateChapter('next')}
          disabled={!chapter.navigation?.next}
          className="nav-btn next-btn"
        >
          Next Chapter →
        </button>
      </div>

      {/* Comments Section */}
      <CommentSection 
        contentId={chapter._id}
        contentType="Chapter"
      />
    </div>
  );
};

export default ReaderView;