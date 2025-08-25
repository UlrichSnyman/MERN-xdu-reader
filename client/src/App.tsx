import React from 'react';
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
import './App.css';

function AppRoutes() {
  const location = useLocation();
  const topLevelKey = (location.pathname.split('/')[1] || '/');
  return (
    <Routes key={topLevelKey}>
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
