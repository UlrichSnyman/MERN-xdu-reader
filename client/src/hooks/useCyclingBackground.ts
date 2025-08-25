import { useState, useEffect } from 'react';
import { worksAPI } from '../services/api';

export const useCyclingBackground = (cycleInterval: number = 10000) => {
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImage, setCurrentImage] = useState<string>('');

  useEffect(() => {
    const fetchCoverImages = async () => {
      try {
        const response = await worksAPI.getAll();
        const works = response.data;
        const images = works
          .filter((work: any) => work.coverImage)
          .map((work: any) => work.coverImage);
        
        setCoverImages(images);
        if (images.length > 0) {
          setCurrentImage(images[0]);
        }
      } catch (error) {
        console.error('Failed to fetch cover images:', error);
      }
    };

    fetchCoverImages();
  }, []);

  useEffect(() => {
    if (coverImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % coverImages.length;
        setCurrentImage(coverImages[nextIndex]);
        return nextIndex;
      });
    }, cycleInterval);

    return () => clearInterval(interval);
  }, [coverImages, cycleInterval]);

  return currentImage;
};