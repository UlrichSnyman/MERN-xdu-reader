import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { loreAPI } from '../services/api';
import { Lore } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePersistedSettings } from '../hooks/usePersistedSettings';
import { useRotatingLoadingMessage } from '../hooks/useRotatingLoadingMessage';
import CommentSection from './CommentSection';
import RichTextEditor from './RichTextEditor';
import './ReaderView.css'; // Reuse the same CSS as ReaderView

const LoreReader: React.FC = () => {
  const { loreId } = useParams<{ loreId: string }>();
  // const navigate = useNavigate(); // Not needed for lore reader
  const [lore, setLore] = useState<Lore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { settings, updateSettings } = usePersistedSettings();
  const { /* isAuthenticated, */ user } = useAuth();
  
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Rotating loading message
  const loadingMessage = useRotatingLoadingMessage([
    'Loading lore entry...',
    'Fetching knowledge...',
    'Preparing content...',
    'Almost ready...',
    'Loading wisdom...'
  ]);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  // const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null); // Not needed for simple lore reader
  const wakeLockRef = useRef<any>(null); // Wake lock reference for screen active
  // const seamlessRef = useRef(false); // Not needed for lore reader
  
  // Admin edit state - changed from modal to inline
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // Versioning state to force re-rendering of ReactMarkdown
  const [contentVersion, setContentVersion] = useState(0);

  // State for paragraph-based TTS
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);

  // Helper to apply highlight immediately (with inline fallback styles)
  const applyHighlight = useCallback((index: number) => {
    if (!contentRef.current) return;
    const nodes = contentRef.current.querySelectorAll<HTMLElement>('.paragraph');
    nodes.forEach((el, i) => {
      const active = i === index;
      el.classList.toggle('current-paragraph', active);
      if (active) {
        el.setAttribute('data-current', 'true');
        el.style.outline = '';
        el.style.background = 'rgba(128, 128, 128, 0.2)'; // Simple grey background
        // Force reflow to ensure styles paint immediately
        void el.offsetHeight;
      } else {
        el.removeAttribute('data-current');
        el.style.outline = '';
        el.style.background = '';
      }
    });
  }, []);

  // Wake lock functions to keep screen active during TTS
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake lock acquired');
      }
    } catch (err) {
      console.log('Wake lock request failed:', err);
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake lock released');
    }
  }, []);

  // Utility function to split content into paragraphs
  const splitIntoParagraphs = (content: string): string[] => {
    // Split by double newlines (markdown paragraphs) and filter out empty ones
    return content
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  };

  useEffect(() => {
    const fetchLore = async () => {
      if (!loreId) return;
      
      try {
        const response = await loreAPI.getById(loreId);
        setLore(response.data);
        setEditContent(response.data.content);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load lore entry');
      } finally {
        setLoading(false);
      }
    };

    fetchLore();
  }, [loreId]);

  // Update paragraphs when content changes
  useEffect(() => {
    if (lore?.content) {
      const newParagraphs = splitIntoParagraphs(lore.content);
      setParagraphs(newParagraphs);
      setCurrentParagraphIndex(0);
      applyHighlight(0);
    }
  }, [lore?.content, contentVersion, applyHighlight]);

  // Load available voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // TTS Functions (simplified version of ReaderView)
  const startTextToSpeechFromParagraph = useCallback((paragraphIndex: number) => {
    if (paragraphs.length === 0 || paragraphIndex >= paragraphs.length) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      setCurrentParagraphIndex(paragraphIndex);
      applyHighlight(paragraphIndex);
      updateSettings({ currentParagraph: paragraphIndex });

      const speakText = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = settings.speechRate;
        const selectedVoice = availableVoices.find(voice => voice.name === settings.selectedVoice);
        if (selectedVoice) utterance.voice = selectedVoice;
        
        utterance.onstart = () => {
          updateSettings({ isPlaying: true });
          requestWakeLock(); // Keep screen active during TTS
        };
        utterance.onend = () => {
          updateSettings({ isPlaying: false });
          releaseWakeLock(); // Release wake lock when TTS ends
          // Move to next paragraph if available
          if (paragraphIndex + 1 < paragraphs.length) {
            setTimeout(() => {
              startTextToSpeechFromParagraph(paragraphIndex + 1);
            }, 200);
          }
        };
        utterance.onerror = () => {
          updateSettings({ isPlaying: false });
          releaseWakeLock(); // Release wake lock on error
        };
        
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };

      const currentText = paragraphs[paragraphIndex];
      speakText(currentText);
    } else {
      alert('Text-to-speech is not supported in your browser.');
    }
  }, [paragraphs, settings.speechRate, settings.selectedVoice, availableVoices, updateSettings, requestWakeLock, releaseWakeLock, applyHighlight]);

  const startTextToSpeech = () => {
    if (paragraphs.length === 0) return;
    const index = Math.min(settings.currentParagraph || 0, paragraphs.length - 1);
    requestWakeLock(); // Keep screen active during TTS
    startTextToSpeechFromParagraph(index);
  };

  const pauseTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      updateSettings({ isPlaying: false });
      releaseWakeLock(); // Release wake lock when pausing
    }
  };

  const resumeTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      updateSettings({ isPlaying: true });
      requestWakeLock(); // Re-acquire wake lock when resuming
    }
  };

  const stopTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      updateSettings({ isPlaying: false, currentParagraph: 0 });
      setCurrentParagraphIndex(0);
      releaseWakeLock(); // Release wake lock when stopping
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };

  // Cleanup wake lock on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  // Highlight current paragraph when index changes
  useEffect(() => {
    applyHighlight(currentParagraphIndex);
    const nodes = contentRef.current?.querySelectorAll<HTMLElement>('.paragraph');
    const active = nodes && nodes[currentParagraphIndex];
    if (settings.autoScroll && active) {
      active.scrollIntoView({ behavior: settings.isPlaying ? 'smooth' : 'auto', block: 'center' });
    }
  }, [currentParagraphIndex, contentVersion, settings.autoScroll, settings.isPlaying, applyHighlight]);

  const saveEdit = async () => {
    if (!lore) return;
    try {
      await loreAPI.update(lore._id, { content: editContent });
      setLore({ ...lore, content: editContent });
      setContentVersion(v => v + 1);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save lore entry', err);
      alert('Failed to save changes');
    }
  };

  const cancelEdit = () => {
    setEditContent(lore?.content || '');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{loadingMessage}</p>
      </div>
    );
  }

  if (error || !lore) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'Lore entry not found'}</p>
        <Link to="/lore" className="back-link">← Back to Lore Library</Link>
      </div>
    );
  }

  const contentStyle = {
    fontSize: `${settings.fontSize}px`,
    fontFamily: settings.fontFamily === 'default' ? 'inherit' : 
                settings.fontFamily === 'dyslexic' ? 'OpenDyslexic, sans-serif' :
                settings.fontFamily === 'roboto' ? 'Roboto, sans-serif' :
                settings.fontFamily === 'serif' ? 'Georgia, serif' : 'inherit'
  } as React.CSSProperties;

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
                max="32"
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
              />
            </div>

            {/* Font Family */}
            <div className="setting-group">
              <label>Font Family</label>
              <div className="font-buttons">
                {['default', 'roboto', 'serif', 'dyslexic'].map(font => (
                  <button
                    key={font}
                    className={`font-btn ${settings.fontFamily === font ? 'active' : ''}`}
                    onClick={() => updateSettings({ fontFamily: font })}
                  >
                    {font === 'dyslexic' ? 'Dyslexic' : font.charAt(0).toUpperCase() + font.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* TTS Controls */}
            <div className="tts-controls">
              <h4>Text-to-Speech</h4>
              
              {/* Voice Selection */}
              <div className="voice-control">
                <label>Voice</label>
                <select
                  className="voice-select"
                  value={settings.selectedVoice}
                  onChange={(e) => updateSettings({ selectedVoice: e.target.value })}
                >
                  <option value="">Default Voice</option>
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speech Rate */}
              <div className="speed-control">
                <label>Speech Rate: {settings.speechRate}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={settings.speechRate}
                  onChange={(e) => updateSettings({ speechRate: parseFloat(e.target.value) })}
                />
              </div>
              
              {/* TTS Control Buttons */}
              <div className="tts-button-group">
                <button
                  onClick={settings.isPlaying ? pauseTextToSpeech : (window.speechSynthesis?.paused ? resumeTextToSpeech : startTextToSpeech)}
                  className={`tts-btn ${settings.isPlaying ? 'playing' : ''}`}
                >
                  {settings.isPlaying ? 'Pause' : (window.speechSynthesis?.paused ? 'Resume' : 'Play')}
                </button>
                
                <button
                  onClick={stopTextToSpeech}
                  className="tts-btn stop-btn"
                  disabled={!settings.isPlaying && !window.speechSynthesis?.paused}
                >
                  Stop
                </button>
              </div>
              
              {/* Auto-scroll toggle */}
              <div className="tts-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.autoScroll}
                    onChange={(e) => updateSettings({ autoScroll: e.target.checked })}
                  />
                  Auto-scroll during speech
                </label>
              </div>
            </div>

            <button className="close-settings" onClick={() => setShowSettings(false)}>
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="reader-header">
        <div className="reader-nav">
          <Link to="/lore" className="back-link">← Back to Lore Library</Link>
          
          <div className="reader-nav-actions">
            {user?.role === 'admin' && (
              <button 
                className="edit-page-btn"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>
            )}
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
            >
              Settings
            </button>
          </div>
        </div>

        <div className="page-info">
          <h1>{lore.title}</h1>
          <div className="page-meta">
            <span className="page-category">Category: {lore.category}</span>
          </div>
        </div>
      </div>

      <div 
        className="reader-content" 
        ref={contentRef} 
        style={contentStyle}
        onClick={() => setShowSettings(!showSettings)}
      >
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
          <div className="paragraph-container">
            <ReactMarkdown 
              components={{
                p: ({ children }) => <div className="paragraph">{children}</div>,
                h1: ({ children }) => <div className="paragraph"><h1>{children}</h1></div>,
                h2: ({ children }) => <div className="paragraph"><h2>{children}</h2></div>,
                h3: ({ children }) => <div className="paragraph"><h3>{children}</h3></div>,
                blockquote: ({ children }) => <div className="paragraph"><blockquote>{children}</blockquote></div>,
                ul: ({ children }) => <div className="paragraph"><ul>{children}</ul></div>,
                ol: ({ children }) => <div className="paragraph"><ol>{children}</ol></div>,
              }}
            >
              {lore.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <CommentSection 
        contentId={lore._id} 
        contentType="Lore" 
      />
    </div>
  );
};

export default LoreReader;