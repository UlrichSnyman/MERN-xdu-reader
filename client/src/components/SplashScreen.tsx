import React, { useState, useEffect } from 'react';
import { worksAPI, loreAPI } from '../services/api';
import { CacheManager, CACHE_KEYS } from '../utils/cache';
import './SplashScreen.css';

interface SplashScreenProps {
  onLoadingComplete: () => void;
}

interface LoadingStep {
  id: string;
  label: string;
  completed: boolean;
  progress: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onLoadingComplete }) => {
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([
    { id: 'init', label: 'Initializing XDU Collection', completed: false, progress: 0 },
    { id: 'works', label: 'Loading Literary Works', completed: false, progress: 0 },
    { id: 'lore', label: 'Gathering Lore Entries', completed: false, progress: 0 },
    { id: 'cache', label: 'Optimizing Experience', completed: false, progress: 0 },
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Step 1: Initialize
        await new Promise(resolve => setTimeout(resolve, 800));
        updateStep(0, 100, true);
        
        // Step 2: Load works
        setCurrentStep(1);
        let works = { data: [] };
        
        try {
          const worksPromise = worksAPI.getAll();
          
          // Simulate progress for works loading
          for (let i = 0; i <= 80; i += 20) {
            updateStep(1, i, false);
            await new Promise(resolve => setTimeout(resolve, 150));
          }
          
          works = await worksPromise;
          updateStep(1, 100, true);
        } catch (error) {
          console.warn('Failed to load works, continuing with empty data:', error);
          updateStep(1, 100, true);
        }
        
        // Step 3: Load lore
        setCurrentStep(2);
        let lore = { data: [] };
        
        try {
          const lorePromise = loreAPI.getAll();
          
          // Simulate progress for lore loading
          for (let i = 0; i <= 80; i += 25) {
            updateStep(2, i, false);
            await new Promise(resolve => setTimeout(resolve, 120));
          }
          
          lore = await lorePromise;
          updateStep(2, 100, true);
        } catch (error) {
          console.warn('Failed to load lore, continuing with empty data:', error);
          updateStep(2, 100, true);
        }
        
        // Step 4: Cache optimization
        setCurrentStep(3);
        
        // Store in cache using CacheManager (even if empty)
        CacheManager.set(CACHE_KEYS.WORKS, works.data);
        CacheManager.set(CACHE_KEYS.LORE, lore.data);
        
        for (let i = 0; i <= 100; i += 25) {
          updateStep(3, i, false);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        updateStep(3, 100, true);
        
        // Final animation
        setOverallProgress(100);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsAnimating(false);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        onLoadingComplete();
        
      } catch (error) {
        console.error('Critical loading error:', error);
        // Still complete loading even on error
        setOverallProgress(100);
        setIsAnimating(false);
        setTimeout(onLoadingComplete, 1500);
      }
    };

    loadData();
  }, [onLoadingComplete]);

  const updateStep = (stepIndex: number, progress: number, completed: boolean) => {
    setLoadingSteps(prev => prev.map((step, index) => 
      index === stepIndex 
        ? { ...step, progress, completed }
        : step
    ));
    
    // Update overall progress
    setOverallProgress(((stepIndex * 25) + (progress * 0.25)));
  };

  return (
    <div className={`splash-screen ${!isAnimating ? 'fade-out' : ''}`}>
      <div className="splash-background">
        <div className="geometric-pattern">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className={`floating-shape shape-${i % 4}`}
              style={{
                animationDelay: `${i * 0.2}s`,
                left: `${(i * 5) % 100}%`,
                top: `${(i * 7) % 100}%`
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="splash-content">
        <div className="logo-container">
          <div className="main-logo">
            <div className="logo-geometric">
              <div className="logo-shape-1"></div>
              <div className="logo-shape-2"></div>
              <div className="logo-shape-3"></div>
            </div>
            <h1 className="app-title">XDU Collection</h1>
            <p className="app-subtitle">Literary Archive & Reader</p>
          </div>
        </div>
        
        <div className="loading-container">
          <div className="progress-ring">
            <svg className="progress-circle" width="120" height="120">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle
                className="progress-background"
                cx="60"
                cy="60"
                r="50"
                strokeWidth="3"
                fill="none"
              />
              <circle
                className="progress-bar"
                cx="60"
                cy="60"
                r="50"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                style={{
                  strokeDasharray: `${2 * Math.PI * 50}`,
                  strokeDashoffset: `${2 * Math.PI * 50 * (1 - overallProgress / 100)}`
                }}
              />
            </svg>
            <div className="progress-percentage">{Math.round(overallProgress)}%</div>
          </div>
          
          <div className="loading-steps">
            {loadingSteps.map((step, index) => (
              <div 
                key={step.id} 
                className={`loading-step ${index === currentStep ? 'active' : ''} ${step.completed ? 'completed' : ''}`}
              >
                <div className="step-indicator">
                  {step.completed ? '✓' : '○'}
                </div>
                <div className="step-content">
                  <span className="step-label">{step.label}</span>
                  <div className="step-progress">
                    <div 
                      className="step-progress-bar"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;