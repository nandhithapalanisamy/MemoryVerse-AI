import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiFileText, FiAward, FiBriefcase, FiFolder, 
  FiSliders, FiArrowRight, FiBookOpen, FiZap, FiActivity
} from 'react-icons/fi';
import { analyticsAPI, documentsAPI } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    career_score: 30,
    total_documents: 0,
    certificates_count: 0,
    projects_count: 0,
    internships_count: 0,
    skills_detected: 0,
    achievements_count: 0,
    recent_insights: []
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, docsRes] = await Promise.all([
        analyticsAPI.getStats(),
        documentsAPI.getAll()
      ]);
      setStats(statsRes.data);
      // Sort docs by date and take latest 4
      const sortedDocs = (docsRes.data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setRecentDocs(sortedDocs.slice(0, 4));
    } catch (err) {
      console.error("Failed to load dashboard statistics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Dashboard Stats Cards Configurations
  const statCards = [
    { name: 'Total Documents', value: stats.total_documents, icon: <FiFolder className="text-blue-400" />, color: 'from-blue-500/10 to-blue-500/0 border-blue-500/20' },
    { name: 'Certifications', value: stats.certificates_count, icon: <FiAward className="text-purple-400" />, color: 'from-purple-500/10 to-purple-500/0 border-purple-500/20' },
    { name: 'Projects', value: stats.projects_count, icon: <FiFileText className="text-cyan-400" />, color: 'from-cyan-500/10 to-cyan-500/0 border-cyan-500/20' },
    { name: 'Internships', value: stats.internships_count, icon: <FiBriefcase className="text-emerald-400" />, color: 'from-emerald-500/10 to-emerald-500/0 border-emerald-500/20' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/40 border border-indigo-950/60 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="space-y-3 max-w-xl">
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider flex items-center w-fit">
            <FiZap className="mr-1.5" /> AI Digital Identity OS
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
            Welcome back to <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">MemoryVerse AI</span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your documents are processed and mapped. Ask your AI Assistant to build custom resumes, portfolios, or run semantic checks on your academic profile.
          </p>
        </div>
      </div>

      {/* Main Stats Block */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Career Score Block */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 border border-indigo-950/40 relative">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">AI Career Readiness Score</h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circle track */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.career_score / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-slate-100">{stats.career_score}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Score</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-200">
              {stats.career_score < 50 ? 'Beginner Level' : stats.career_score < 80 ? 'Intermediate Professional' : 'Highly Employable'}
            </h4>
            <p className="text-xs text-slate-400">Add missing skills or certificates to reach the next tier.</p>
          </div>
          <Link to="/analytics" className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 font-bold pt-2">
            <span>Detailed Analytics</span>
            <FiArrowRight />
          </Link>
        </div>

        {/* Small stats & dynamic notifications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {statCards.map((card) => (
              <div 
                key={card.name} 
                className={`p-6 rounded-2xl bg-gradient-to-br ${card.color} border border-indigo-950/30 flex items-center justify-between hover:scale-[1.02] transition duration-200`}
              >
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.name}</p>
                  <p className="text-3xl font-extrabold text-slate-100">{card.value}</p>
                </div>
                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/30 text-xl">
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats overview */}
          <div className="glass-panel p-6 rounded-2xl border border-indigo-950/40 grid grid-cols-3 text-center">
            <div className="border-r border-indigo-950/50">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skills Detected</p>
              <p className="text-xl font-extrabold text-slate-200 mt-1">{stats.skills_detected}</p>
            </div>
            <div className="border-r border-indigo-950/50">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Achievements</p>
              <p className="text-xl font-extrabold text-slate-200 mt-1">{stats.achievements_count}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Security Tier</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">Active</p>
            </div>
          </div>
        </div>

      </div>

      {/* Lower grid - recent uploads and insights */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Recent Uploads */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-indigo-950/40 space-y-4">
          <div className="flex justify-between items-center border-b border-indigo-950/40 pb-3">
            <h3 className="font-extrabold text-slate-200 flex items-center">
              <FiActivity className="mr-2 text-indigo-400" /> Recent Repository Uploads
            </h3>
            <Link to="/upload" className="text-xs text-indigo-400 hover:underline">Manage All</Link>
          </div>
          <div className="space-y-3">
            {recentDocs.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-slate-500 text-sm">No files uploaded yet.</p>
                <Link to="/upload" className="inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl">
                  Upload Document
                </Link>
              </div>
            ) : (
              recentDocs.map((doc) => (
                <div key={doc.id} className="p-3 rounded-xl bg-indigo-950/15 border border-indigo-950/30 flex justify-between items-center hover:bg-indigo-950/25 transition">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200 truncate max-w-[200px] sm:max-w-[300px]">{doc.filename}</p>
                    <p className="text-[10px] text-slate-400">{doc.category || 'Uncategorized'} | Version {doc.version}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    doc.status === 'Processed' 
                      ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/60'
                      : doc.status === 'Processing'
                      ? 'bg-amber-950/30 text-amber-400 border-amber-900/60'
                      : 'bg-rose-950/30 text-rose-400 border-rose-900/60'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Career Insights */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-indigo-950/40 space-y-4">
          <div className="border-b border-indigo-950/40 pb-3">
            <h3 className="font-extrabold text-slate-200 flex items-center">
              <FiBookOpen className="mr-2 text-indigo-400" /> Recent AI Insights
            </h3>
          </div>
          <div className="space-y-4">
            {stats.recent_insights.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">AI insights will show up after documents are uploaded and processed.</p>
            ) : (
              stats.recent_insights.map((insight, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs bg-indigo-950/10 p-3 rounded-xl border border-indigo-950">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-sm mt-0.5">
                    <FiZap />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-300 leading-relaxed">{insight}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;
