import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import WorkDetailPage from './components/WorkDetailPage';
import ReaderView from './components/ReaderView';
import SuggestionsPage from './components/SuggestionsPage';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/work/:id" element={<WorkDetailPage />} />
                <Route path="/read/:pageId" element={<ReaderView />} />
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
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
