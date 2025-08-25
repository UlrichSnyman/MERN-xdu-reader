import { useState, useEffect } from 'react';

const DEFAULT_MESSAGES = [
  'Loading...',
  'Just a moment...',
  'Getting things ready...',
  'Almost there...',
  'Preparing content...',
  'Loading resources...',
  'Hang tight...',
  'Processing data...'
];

export const useRotatingLoadingMessage = (
  customMessages: string[] = [],
  interval: number = 2000
): string => {
  const messages = customMessages.length > 0 ? customMessages : DEFAULT_MESSAGES;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [messages.length, interval]);

  return messages[currentIndex];
};