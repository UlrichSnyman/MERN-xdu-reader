import { useState, useEffect } from 'react';
import axios from 'axios';
import { worksAPI } from '../services/api';

export const useCyclingBackground = (cycleInterval: number = 10000) => {
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const fetchCoverImages = async () => {
      try {
        const response = await worksAPI.getAll();
        const works = Array.isArray(response.data) ? response.data : response.data?.works || [];
        const images = works
          .filter((work: any) => work.coverImage)
          .map((work: any) => work.coverImage);
        if (!isMounted) return;
        setCoverImages(images);
        if (images.length > 0) setCurrentImage(images[0]);
      } catch (error: any) {
        console.error('Failed to fetch cover images (primary):', error?.message || error);
        // Fallback to deployed API endpoint if local fails
        try {
          const fallback = await axios.get('https://mern-xdu-reader.onrender.com/api/works');
          const works = Array.isArray(fallback.data) ? fallback.data : fallback.data?.works || [];
          const images = works
            .filter((work: any) => work.coverImage)
            .map((work: any) => work.coverImage);
          if (!isMounted) return;
          setCoverImages(images);
          if (images.length > 0) setCurrentImage(images[0]);
        } catch (fallbackErr: any) {
          console.error('Failed to fetch cover images (fallback):', fallbackErr?.message || fallbackErr);
        }
      }
    };

    fetchCoverImages();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (coverImages.length <= 1) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % coverImages.length;
      setCurrentImage(coverImages[currentIndex]);
    }, cycleInterval);

    return () => clearInterval(interval);
  }, [coverImages, cycleInterval]);

  return currentImage;
};