import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  isPlaying: boolean;
  speechRate: number;
  selectedVoice: string;
}

const defaultSettings: ReaderSettings = {
  fontSize: 16,
  fontFamily: 'default',
  isPlaying: false,
  speechRate: 1.0,
  selectedVoice: '',
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
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
        setSettings(defaultSettings);
      }
    } else {
      setSettings(defaultSettings);
    }
  }, [user]);

  // Save settings to localStorage whenever they change
  const updateSettings = (newSettings: Partial<ReaderSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(updatedSettings));
  };

  return {
    settings,
    updateSettings,
    resetSettings: () => {
      setSettings(defaultSettings);
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    }
  };
};