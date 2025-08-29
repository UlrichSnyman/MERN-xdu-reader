import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import WorkDetailPage from './components/WorkDetailPage';
import ReaderView from './components/ReaderView';
import LoreLibrary from './components/LoreLibrary';
import LoreDetailPage from './components/LoreDetailPage';
import SuggestionsPage from './components/SuggestionsPage';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';
import { CacheManager, CACHE_KEYS } from './utils/cache';
import './App.css';

function AppRoutes() {
  const location = useLocation();
  return (
    <Routes key={location.pathname}>
      <Route path="/" element={<HomePage />} />
      <Route path="/work/:id" element={<WorkDetailPage />} />
      <Route path="/read/:pageId" element={<ReaderView />} />
      <Route path="/lore" element={<LoreLibrary />} />
      <Route path="/lore/:id" element={<LoreDetailPage />} />
      <Route path="/suggestions" element={<SuggestionsPage />} />
      <Route path="/login" element={<LoginForm />} />
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if we have recent cached data to skip splash screen
    const worksCache = CacheManager.get(CACHE_KEYS.WORKS);
    const loreCache = CacheManager.get(CACHE_KEYS.LORE);
    
    if (worksCache && loreCache) {
      // Data is cached and valid, skip splash screen
      setTimeout(() => {
        setShowSplash(false);
        setIsLoading(false);
      }, 500); // Brief delay for smooth transition
    } else {
      // No valid cache, show splash screen
      setIsLoading(true);
    }
  }, []);

  const handleLoadingComplete = () => {
    setShowSplash(false);
    setTimeout(() => setIsLoading(false), 100);
  };

  if (showSplash || isLoading) {
    return <SplashScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
