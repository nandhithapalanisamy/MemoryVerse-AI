import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  FiHome, FiUploadCloud, FiGitBranch, FiClock, FiMessageSquare, 
  FiFileText, FiGlobe, FiBarChart2, FiSettings, FiLogOut, 
  FiBell, FiMoon, FiSun, FiSearch, FiCheck, FiX
} from 'react-icons/fi';
import { authAPI, notificationsAPI, searchAPI } from '../services/api';

function Layout({ children, theme, toggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState({ full_name: 'Student', email: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
    
    // Poll notifications every 10 seconds for real-time feel
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      setUser(res.data);
    } catch (err) {
      console.error("Failed to load user profile", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigate('/login');
    } catch (err) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await searchAPI.query(searchQuery);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <FiHome /> },
    { name: 'Upload Center', path: '/upload', icon: <FiUploadCloud /> },
    { name: 'Knowledge Graph', path: '/graph', icon: <FiGitBranch /> },
    { name: 'Journey Timeline', path: '/timeline', icon: <FiClock /> },
    { name: 'AI Chat Assistant', path: '/chat', icon: <FiMessageSquare /> },
    { name: 'Resume Builder', path: '/resume', icon: <FiFileText /> },
    { name: 'Portfolio Website', path: '/portfolio', icon: <FiGlobe /> },
    { name: 'Analytics', path: '/analytics', icon: <FiBarChart2 /> },
    { name: 'Settings', path: '/settings', icon: <FiSettings /> },
  ];

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-[#060814] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Sidebar */}
      <aside className={`w-64 glass-panel border-r border-indigo-950/45 p-6 flex flex-col justify-between hidden md:flex`}>
        <div className="space-y-8">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-500/30">
              MV
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">MemoryVerse</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    active 
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25'
                      : 'hover:bg-indigo-950/30 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors w-full"
        >
          <FiLogOut className="text-lg" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto max-h-screen">
        
        {/* Header */}
        <header className="px-6 py-4 glass-panel flex justify-between items-center border-b border-indigo-950/40 relative z-30">
          
          {/* Left search */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <FiSearch />
            </div>
            <input
              type="text"
              placeholder="Search documents semantically... (e.g. projects with Python)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-indigo-950/20 border border-indigo-900/40 rounded-full text-sm text-slate-200 focus:outline-none focus:border-indigo-600/80 transition-colors"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => { setSearchQuery(''); setSearchResults([]); setSearching(false); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                <FiX />
              </button>
            )}
          </form>

          {/* Right toggles & profile */}
          <div className="flex items-center space-x-4">
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-indigo-950/20 border border-indigo-900/40 hover:bg-indigo-950/40 text-slate-400 hover:text-slate-200 transition"
            >
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl bg-indigo-950/20 border border-indigo-900/40 hover:bg-indigo-950/40 text-slate-400 hover:text-slate-200 transition relative"
              >
                <FiBell />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#060814]"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 glass-panel border border-indigo-950 rounded-2xl p-4 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-indigo-950 pb-2">
                    <span className="font-bold text-slate-100">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:underline flex items-center">
                        <FiCheck className="mr-1" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {notifications.length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-2.5 rounded-xl border transition ${n.read ? 'border-indigo-950/30 bg-transparent' : 'border-indigo-900 bg-indigo-950/30'}`}>
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-indigo-300">{n.type}</span>
                            {!n.read && (
                              <button onClick={() => handleMarkRead(n.id)} className="text-[10px] text-slate-400 hover:text-slate-200">
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile badge */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-indigo-950">
              <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-200">{user.full_name}</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>
            </div>

          </div>
        </header>

        {/* Global Search Results overlay */}
        {searching && (
          <div className="m-6 p-6 glass-panel rounded-2xl border border-indigo-900/60 glow-blue max-w-4xl animate-fade-in relative z-25">
            <div className="flex justify-between items-center border-b border-indigo-950 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-100 flex items-center">
                <FiSearch className="mr-2 text-indigo-400" /> Semantic Search Results
              </h3>
              <button 
                onClick={() => { setSearching(false); setSearchResults([]); }}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Close Search
              </button>
            </div>
            <div className="space-y-4">
              {searchResults.length === 0 ? (
                <p className="text-slate-400 text-sm py-4 text-center">No matching information found semantically in your repositories.</p>
              ) : (
                searchResults.map((res, i) => (
                  <div key={i} className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-950 space-y-2 hover:border-indigo-800/80 transition">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-100">{res.filename}</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 text-[10px] border border-indigo-900">{res.category}</span>
                    </div>
                    <p className="text-xs text-slate-400 italic">"...{res.text}..."</p>
                    <div className="text-[10px] text-slate-500 font-mono text-right">Similarity Score: {res.score.toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Panel Content */}
        <main className="flex-1 p-6 relative">
          {children}
        </main>
      </div>

    </div>
  );
}

export default Layout;
