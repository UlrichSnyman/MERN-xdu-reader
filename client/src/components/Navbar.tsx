import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Literary Works
        </Link>
        
        <div className="nav-menu">
          <Link to="/" className="nav-link">
            Library
          </Link>
          <Link to="/lore" className="nav-link">
            Lore
          </Link>
          <Link to="/suggestions" className="nav-link">
            Suggestions
          </Link>
          
          {isAuthenticated ? (
            <div className="admin-menu">
              <Link to="/admin/dashboard" className="nav-link admin-link">
                Dashboard
              </Link>
              <span className="user-info">Welcome, {user?.username}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/admin/login" className="nav-link admin-link">
              Admin Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;