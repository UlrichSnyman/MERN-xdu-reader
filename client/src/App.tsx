import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/work/:id" element={<WorkDetailPage />} />
              <Route path="/read/:chapterId" element={<ReaderView />} />
              <Route path="/lore" element={<LoreLibrary />} />
              <Route path="/lore/:id" element={<LoreDetailPage />} />
              <Route path="/suggestions" element={<SuggestionsPage />} />
              <Route path="/admin/login" element={<LoginForm />} />
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
