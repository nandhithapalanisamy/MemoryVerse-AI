import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UploadCenter from './pages/UploadCenter';
import KnowledgeGraph from './pages/KnowledgeGraph';
import TimelineView from './pages/TimelineView';
import ChatAssistant from './pages/ChatAssistant';
import ResumeGenerator from './pages/ResumeGenerator';
import PortfolioGenerator from './pages/PortfolioGenerator';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

// Helper component for private routes
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  const [theme, setTheme] = useState('dark');

  // Synchronize layout theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Private App Routes */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout theme={theme} toggleTheme={toggleTheme}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/upload" element={<UploadCenter />} />
                  <Route path="/graph" element={<KnowledgeGraph />} />
                  <Route path="/timeline" element={<TimelineView />} />
                  <Route path="/chat" element={<ChatAssistant />} />
                  <Route path="/resume" element={<ResumeGenerator />} />
                  <Route path="/portfolio" element={<PortfolioGenerator />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings toggleTheme={toggleTheme} theme={theme} />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
