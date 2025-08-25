import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { pagesAPI, worksAPI } from '../services/api';
import { Page } from '../types';
import { getCachedPage, setCachedPage, prefetchPages } from '../services/pageCache';
import { useAuth } from '../context/AuthContext';
import { usePersistedSettings } from '../hooks/usePersistedSettings';
import CommentSection from './CommentSection';
import RichTextEditor from './RichTextEditor';
import './ReaderView.css';
import api from '../services/api';

const ReaderView: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { settings, updateSettings } = usePersistedSettings();
  const { isAuthenticated, user } = useAuth();
  
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // During seamless cross-page continuation, keep speaking through navigation
  const seamlessRef = useRef(false);
  // Buffer next page while seamlessly speaking to avoid visual jump
  const deferredPageRef = useRef<Page | null>(null);
  // Track current route pageId as a ref
  const pageIdRef = useRef<string | undefined>(pageId);
  useEffect(() => { pageIdRef.current = pageId; }, [pageId]);
  // Pending auto-start target after seamless continuation
  // const nextAutoStartRef = useRef<{ pageId: string; index: number } | null>(null);

  // Helper to apply highlight immediately (with inline fallback styles)
  const applyHighlight = useCallback((index: number) => {
    if (!contentRef.current) return;
    const nodes = contentRef.current.querySelectorAll<HTMLElement>('.paragraph');
    nodes.forEach((el, i) => {
      const active = i === index;
      el.classList.toggle('current-paragraph', active);
      if (active) {
        el.setAttribute('data-current', 'true');
        el.style.outline = '2px solid var(--accent-color)';
        el.style.background = 'linear-gradient(135deg, rgba(64,224,208,0.18) 0%, rgba(100,149,237,0.18) 100%)';
        // Force reflow to ensure styles paint immediately
        void el.offsetHeight;
      } else {
        el.removeAttribute('data-current');
        el.style.outline = '';
        el.style.background = '';
      }
    });
  }, []);

  // State for paragraph-based TTS
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  
  // Page cache for preloading (use shared global cache)
  // const [pageCacheVersion, setPageCacheVersion] = useState(0);

  // Admin edit state - changed from modal to inline
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // Versioning state to force re-rendering of ReactMarkdown
  const [contentVersion, setContentVersion] = useState(0);
  const [workPagesOrder, setWorkPagesOrder] = useState<Record<string, string[]>>({});

  // Utility function to split content into paragraphs
  const splitIntoParagraphs = (content: string): string[] => {
    // Split by double newlines (markdown paragraphs) and filter out empty ones
    return content
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  };

  // Cache page data
  const cachePage = (p: Page) => {
    setCachedPage(p);
    // setPageCacheVersion(v => v + 1);
  };

  // Ensure work page order is fetched and cached (via worksAPI)
  const ensureWorkOrder = async (workId: string) => {
    if (workPagesOrder[workId]) return workPagesOrder[workId];
    try {
      const resp = await worksAPI.getById(workId);
      const list = Array.isArray(resp.data?.pages) ? resp.data.pages : [];
      const order = list.map((pg: any) => (typeof pg === 'string' ? pg : pg._id));
      setWorkPagesOrder(prev => ({ ...prev, [workId]: order }));
      return order;
    } catch (e) {
      return [] as string[];
    }
  };

  // Prefetch pages by IDs using shared cache
  const prefetchByIds = async (ids: string[]) => {
    await prefetchPages(ids);
    // setPageCacheVersion(v => v + 1);
  };

  // Prefetch neighboring pages
  const prefetchNeighbors = async (workId: string, currentId: string) => {
    const order = await ensureWorkOrder(workId);
    if (!order || order.length === 0) return;
    const idx = order.indexOf(currentId);
    if (idx === -1) return;
    const candidates = [idx - 2, idx - 1, idx + 1, idx + 2]
      .filter(i => i >= 0 && i < order.length)
      .map(i => order[i]);
    await prefetchByIds(candidates);
  };

  const navigatePage = useCallback(async (direction: 'previous' | 'next') => {
    if (!page?.navigation) return;

    const targetPage = page.navigation[direction];
    if (targetPage) {
      if (!getCachedPage(targetPage._id)) {
        await prefetchByIds([targetPage._id]);
      }
      navigate(`/read/${targetPage._id}`);
    }
  }, [page, navigate]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!pageId) return;

      // Cleanup on route change
      setError(null);
      if ('speechSynthesis' in window) {
        // Cancel TTS unless we're in seamless continuation
        if (!seamlessRef.current) {
          window.speechSynthesis.cancel();
        }
      }
      setIsEditing(false);
      // Avoid jump to top during seamless continuation
      if (!seamlessRef.current) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }

      const cached = getCachedPage(pageId);

      if (cached) {
        setPage(cached);
        setContentVersion(v => v + 1);
        setLoading(false);
        const workId = typeof cached.work === 'string' ? cached.work : (cached.work as any)._id;
        if (workId) {
          prefetchNeighbors(workId, cached._id);
        }
      } else {
        // Do not show spinner during seamless read to avoid visual jump
        setLoading(!seamlessRef.current);
      }

      try {
        const response = await pagesAPI.getById(pageId);
        // If we're in seamless mode, defer swapping content to avoid a visual jump
        if (seamlessRef.current) {
          deferredPageRef.current = response.data;
        } else {
          setPage(response.data);
        }
        cachePage(response.data);
        setContentVersion(v => v + 1);

        const workId = typeof response.data.work === 'string' ? response.data.work : (response.data.work as any)._id;
        if (workId) {
          prefetchNeighbors(workId, response.data._id);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [pageId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure view updates cleanly when the route (pageId) changes
  useEffect(() => {
    // Stop any ongoing TTS, exit edit mode, and scroll to top
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsEditing(false);
    setEditContent('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageId]);

  // Track reading progress when page loads
  useEffect(() => {
    const trackProgress = async () => {
      if (page && isAuthenticated && page.work) {
        try {
          const workId = typeof page.work === 'string' ? page.work : (page.work as any)._id;
          await worksAPI.updateProgress(workId, pageId!);
        } catch (err) {
          // Non-blocking: ignore failures (backend may not support progress in demo)
          // console.debug('Reading progress update failed (non-blocking).');
        }
      }
    };

    trackProgress();
  }, [page, pageId, isAuthenticated]);

  // Load available voices once and subscribe to voiceschanged
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      // Clean up scroll interval
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // Pick a default voice once voices are available and none is selected yet
  useEffect(() => {
    if (availableVoices.length > 0 && !settings.selectedVoice) {
      updateSettings({ selectedVoice: availableVoices[0].name });
    }
  }, [availableVoices, settings.selectedVoice, updateSettings]);

  const startAutoScroll = useCallback(() => {
    if (!settings.autoScroll || !contentRef.current) return;
    
    const scrollHeight = contentRef.current.scrollHeight;
    const clientHeight = contentRef.current.clientHeight;
    const scrollableHeight = scrollHeight - clientHeight;
    
    if (scrollableHeight <= 0) return;
    
    // Scroll to current paragraph
    const paragraphElements = contentRef.current.querySelectorAll('.paragraph');
    if (paragraphElements[currentParagraphIndex]) {
      paragraphElements[currentParagraphIndex].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [settings.autoScroll, currentParagraphIndex]);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const startTextToSpeechFromParagraph = useCallback((paragraphIndex: number) => {
    if (paragraphs.length === 0 || paragraphIndex >= paragraphs.length) return;

    if ('speechSynthesis' in window) {
      // Stop current speech if any
      window.speechSynthesis.cancel();
      stopAutoScroll();

      setCurrentParagraphIndex(paragraphIndex);
      applyHighlight(paragraphIndex);
      // Ensure highlight after state flush
      setTimeout(() => applyHighlight(paragraphIndex), 0);
      updateSettings({ currentParagraph: paragraphIndex });

      const speakText = (text: string, onDone?: () => void) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = settings.speechRate;
        utterance.pitch = 1;
        utterance.volume = 1;
        const selectedVoice = availableVoices.find(voice => voice.name === settings.selectedVoice);
        if (selectedVoice) utterance.voice = selectedVoice;
        
        utterance.onstart = () => {
          updateSettings({ isPlaying: true });
          startAutoScroll();
        };
        utterance.onend = () => {
          updateSettings({ isPlaying: false });
          stopAutoScroll();
          if (onDone) onDone();
        };
        utterance.onerror = () => {
          updateSettings({ isPlaying: false });
          stopAutoScroll();
        };
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };

      const currentText = paragraphs[paragraphIndex];
      const isLast = paragraphIndex === paragraphs.length - 1;

      if (isLast && settings.autoNavigate && page?.navigation?.next) {
        const lastText = currentText.trim();
        const endsWithTerminator = /[.!?…]["'”’)]?$/.test(lastText);
        const nextId = page.navigation.next._id;
        let nextPageData = nextId ? getCachedPage(nextId) : undefined;
        if (!nextPageData && nextId) {
          prefetchByIds([nextId]).finally(() => {});
          nextPageData = getCachedPage(nextId);
        }
        if (!endsWithTerminator && nextPageData && nextId) {
          const nextParas = splitIntoParagraphs(nextPageData.content || '');
          const firstNext = (nextParas[0] || '').trim();
          if (firstNext) {
            // Just speak the current paragraph normally
            speakText(currentText, () => {
              // Navigate to next page and start reading the first paragraph
              navigate(`/read/${nextId}`);
              
              // Set a flag to auto-start the first paragraph on the next page
              setTimeout(() => {
                updateSettings({ autoStartAfterNavigation: true, currentParagraph: 0 });
              }, 100);
            });
            return;
          }
        }
      }

      // Normal flow: speak current paragraph
      speakText(currentText, () => {
        if (paragraphIndex + 1 < paragraphs.length) {
          setTimeout(() => {
            startTextToSpeechFromParagraph(paragraphIndex + 1);
          }, 200);
          return;
        }
        if (page?.navigation?.next && settings.autoNavigate) {
          updateSettings({ autoStartAfterNavigation: true, currentParagraph: 0 });
          navigate(`/read/${page.navigation.next._id}`);
        }
      });
    } else {
      alert('Text-to-speech is not supported in your browser.');
    }
  }, [paragraphs, settings.speechRate, settings.selectedVoice, settings.autoNavigate, availableVoices, updateSettings, page, navigate, startAutoScroll, stopAutoScroll, applyHighlight]);

  const startTextToSpeech = () => {
    if (paragraphs.length === 0) return;
    const index = Math.min(settings.currentParagraph || 0, paragraphs.length - 1);
    startTextToSpeechFromParagraph(index);
  };

  const pauseTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      updateSettings({ isPlaying: false });
      stopAutoScroll();
    }
  };

  const resumeTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      updateSettings({ isPlaying: true });
      startAutoScroll();
    }
  };

  const stopTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      updateSettings({ isPlaying: false, currentParagraph: 0 });
      stopAutoScroll();
      setCurrentParagraphIndex(0);
      // Reset scroll position
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };

  const refreshPage = async () => {
    if (!pageId) return;
    try {
      const response = await api.get(`/pages/${pageId}`, { params: { _: Date.now() } });
      setPage(response.data);
      cachePage(response.data);
      setContentVersion(v => v + 1);

      // After refresh, re-prefetch neighbors in case order changed
      const workId = typeof response.data.work === 'string' ? response.data.work : (response.data.work as any)._id;
      if (workId) prefetchNeighbors(workId, response.data._id);
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
      setPage(prev => prev ? { ...prev, content: editContent } as any : prev);
      const existing = getCachedPage(page._id);
      if (existing) {
        setCachedPage({ ...existing, content: editContent });
        // setPageCacheVersion(v => v + 1);
      }
      setContentVersion(v => v + 1);
      setIsEditing(false);
      refreshPage();
    } catch (err: any) {
      console.error('Failed to save page content:', err);
      alert(err.response?.data?.error || 'Failed to save');
    }
  };

  // Build paragraphs from markdown content whenever it changes
  useEffect(() => {
    if (page?.content) {
      const parts = splitIntoParagraphs(page.content);
      setParagraphs(parts);
      const safeIndex = Math.min(settings.currentParagraph || 0, Math.max(0, parts.length - 1));
      setCurrentParagraphIndex(safeIndex);
    } else {
      setParagraphs([]);
      setCurrentParagraphIndex(0);
    }
  }, [page?.content, contentVersion, settings.currentParagraph]);

  // Highlight current paragraph and optionally auto-scroll when index changes
  useEffect(() => {
    applyHighlight(currentParagraphIndex);
    const nodes = contentRef.current?.querySelectorAll<HTMLElement>('.paragraph');
    const active = nodes && nodes[currentParagraphIndex];
    if (settings.autoScroll && active) {
      active.scrollIntoView({ behavior: settings.isPlaying ? 'smooth' : 'auto', block: 'center' });
    }
  }, [currentParagraphIndex, contentVersion, settings.autoScroll, settings.isPlaying, applyHighlight]);

  // Auto-start TTS after navigation when flagged, wait until DOM is ready and no speech is currently playing
  useEffect(() => {
    if (!settings.autoStartAfterNavigation) return;

    let cleared = false;
    const tryStart = () => {
      if (cleared) return true;
      const nodes = contentRef.current?.querySelectorAll('.paragraph');
      const speaking = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.speaking : false;
      if (nodes && nodes.length > 0 && paragraphs.length > 0 && !speaking) {
        const index = settings.currentParagraph || 0;
        applyHighlight(index);
        startTextToSpeechFromParagraph(index);
        updateSettings({ autoStartAfterNavigation: false });
        return true;
      }
      return false;
    };

    if (!tryStart()) {
      const iv = setInterval(() => {
        if (tryStart()) clearInterval(iv);
      }, 100);
      const to = setTimeout(() => {
        clearInterval(iv);
      }, 10000);
      return () => { cleared = true; clearInterval(iv); clearTimeout(to); };
    }
  }, [settings.autoStartAfterNavigation, settings.currentParagraph, paragraphs.length, contentVersion, startTextToSpeechFromParagraph, updateSettings, applyHighlight]);

  // Re-apply highlight when settings panel toggles or play state changes
  useEffect(() => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => applyHighlight(currentParagraphIndex));
    } else {
      setTimeout(() => applyHighlight(currentParagraphIndex), 0);
    }
  }, [showSettings, settings.isPlaying, currentParagraphIndex, applyHighlight]);

  if (loading && !(pageId && getCachedPage(pageId))) {
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
                onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
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
                    className={`font-button ${settings.fontFamily === font ? 'active' : ''}`}
                    onClick={() => updateSettings({ fontFamily: font })}
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
                    onChange={(e) => updateSettings({ selectedVoice: e.target.value })}
                    className="voice-select"
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
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
                
                {/* Auto-navigation toggle */}
                <div className="tts-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.autoNavigate}
                      onChange={(e) => updateSettings({ autoNavigate: e.target.checked })}
                    />
                    Auto-navigate to next page
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.autoScroll}
                      onChange={(e) => updateSettings({ autoScroll: e.target.checked })}
                    />
                    Auto-scroll during reading
                  </label>
                </div>
                
                <div className="speed-control">
                  <label>Speed: {settings.speechRate}x</label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={settings.speechRate}
                    onChange={(e) => updateSettings({ speechRate: parseFloat(e.target.value) })}
                  />
                  <div className="slider-labels">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                    <span>3.0x</span>
                    <span>4.0x</span>
                    <span>5.0x</span>
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
          <div className="paragraph-container">
            <ReactMarkdown
              key={contentVersion}
              components={{
                p: ({ node, ...props }) => <p className="paragraph" {...props} />
              }}
            >
              {page.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Side Arrow Navigation */}
      {page.navigation?.previous && (
        <button
          onMouseEnter={() => page.navigation?.previous && prefetchByIds([page.navigation.previous._id])}
          onClick={() => navigatePage('previous')}
          className="nav-arrow nav-arrow-left"
          aria-label="Previous Page"
        >
          ←
        </button>
      )}
      
      {page.navigation?.next && (
        <button
          onMouseEnter={() => page.navigation?.next && prefetchByIds([page.navigation.next._id])}
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