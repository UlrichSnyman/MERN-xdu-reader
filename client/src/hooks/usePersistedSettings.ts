import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  isPlaying: boolean;
  speechRate: number;
  selectedVoice: string;
  autoNavigate: boolean;
  autoScroll: boolean;
}

const defaultSettings: ReaderSettings = {
  fontSize: 16,
  fontFamily: 'default',
  isPlaying: false,
  speechRate: 1.0,
  selectedVoice: '',
  autoNavigate: true,
  autoScroll: true,
};

export const usePersistedSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);

  // Create a unique storage key based on user
  const getStorageKey = () => {
    return user ? `reader-settings-${user.username}` : 'reader-settings-guest';
  };

  // Load settings from localStorage on component mount or user change
  useEffect(() => {
    const getStorageKey = () => {
      return user ? `reader-settings-${user.username}` : 'reader-settings-guest';
    };

    const storageKey = getStorageKey();
    const savedSettings = localStorage.getItem(storageKey);
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const newSettings = { ...defaultSettings, ...parsed };
        // Only update if settings have actually changed
        setSettings(prev => {
          const hasChanged = Object.keys(newSettings).some(key => 
            prev[key as keyof ReaderSettings] !== newSettings[key as keyof ReaderSettings]
          );
          return hasChanged ? newSettings : prev;
        });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
        setSettings(prev => {
          const hasChanged = Object.keys(defaultSettings).some(key => 
            prev[key as keyof ReaderSettings] !== defaultSettings[key as keyof ReaderSettings]
          );
          return hasChanged ? defaultSettings : prev;
        });
      }
    } else {
      setSettings(prev => {
        const hasChanged = Object.keys(defaultSettings).some(key => 
          prev[key as keyof ReaderSettings] !== defaultSettings[key as keyof ReaderSettings]
        );
        return hasChanged ? defaultSettings : prev;
      });
    }
  }, [user]);

  // Save settings to localStorage whenever they change
  const updateSettings = useCallback((newSettings: Partial<ReaderSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      const storageKey = user ? `reader-settings-${user.username}` : 'reader-settings-guest';
      localStorage.setItem(storageKey, JSON.stringify(updatedSettings));
      return updatedSettings;
    });
  }, [user]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    const storageKey = user ? `reader-settings-${user.username}` : 'reader-settings-guest';
    localStorage.removeItem(storageKey);
  }, [user]);

  return {
    settings,
    updateSettings,
    resetSettings
  };
};