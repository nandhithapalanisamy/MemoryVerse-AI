import React, { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiEdit, FiCheckCircle } from 'react-icons/fi';
import { analyticsAPI, documentsAPI } from '../services/api';

function ResumeGenerator() {
  const [stats, setStats] = useState({
    certificates_count: 0,
    projects_count: 0,
    internships_count: 0,
    skills_detected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await analyticsAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocx = () => {
    // Redirect browser directly to the endpoint so the file streams
    const token = localStorage.getItem('token');
    window.location.href = `/api/generators/resume/docx?token=${token}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      <div className="flex justify-between items-center border-b border-indigo-950/40 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI Resume Builder</h1>
          <p className="text-sm text-slate-400">Generate an ATS-friendly, professional Word resume with one click using your repository contents</p>
        </div>
        <button 
          onClick={handleDownloadDocx}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center shadow-lg shadow-indigo-600/15"
        >
          <FiDownload className="mr-1.5 text-sm" /> Export as DOCX
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Templates Panel */}
        <div className="md:col-span-1 glass-panel p-6 rounded-3xl border border-indigo-950/40 space-y-4">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Template Selection</h3>
          
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-indigo-950/30 border-2 border-indigo-500 space-y-2 relative">
              <span className="absolute top-3 right-3 text-indigo-400 text-base"><FiCheckCircle /></span>
              <p className="text-xs font-bold text-slate-100">Standard Academic Template</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">ATS-friendly layout structured for university placements and internship applications.</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-indigo-950/10 border border-indigo-950/40 space-y-2 opacity-50 cursor-not-allowed">
              <p className="text-xs font-bold text-slate-400">Modern Creative Template</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">Sleek multi-column format with customizable sidebars. (Premium)</p>
            </div>
          </div>
        </div>

        {/* Live Preview / Resume details Panel */}
        <div className="md:col-span-2 glass-panel p-8 rounded-3xl border border-indigo-950/40 space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-indigo-950/40">
            <h3 className="font-extrabold text-slate-200 flex items-center">
              <FiFileText className="mr-2 text-indigo-400" /> Auto-Generated Resume Summary
            </h3>
            <span className="text-[10px] bg-indigo-950 px-2 py-0.5 rounded text-indigo-300 font-bold border border-indigo-900/60 uppercase">Live Preview</span>
          </div>

          <div className="space-y-6 text-xs text-slate-300">
            
            {/* Header info */}
            <div className="text-center space-y-1.5 py-4 bg-indigo-950/10 border border-indigo-950/40 rounded-2xl">
              <p className="text-base font-extrabold text-slate-100">My Profile Name</p>
              <p className="text-[10px] text-slate-400">Powered by MemoryVerse AI Data Nodes</p>
            </div>

            {/* Resume breakdown stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-indigo-950/15 border border-indigo-950 rounded-xl">
                <span className="text-slate-500 font-bold">Skills Registered</span>
                <p className="text-lg font-bold text-slate-200 mt-0.5">{stats.skills_detected} Skills</p>
              </div>
              <div className="p-3 bg-indigo-950/15 border border-indigo-950 rounded-xl">
                <span className="text-slate-500 font-bold">Projects Built</span>
                <p className="text-lg font-bold text-slate-200 mt-0.5">{stats.projects_count} Projects</p>
              </div>
              <div className="p-3 bg-indigo-950/15 border border-indigo-950 rounded-xl">
                <span className="text-slate-500 font-bold">Internship Records</span>
                <p className="text-lg font-bold text-slate-200 mt-0.5">{stats.internships_count} Internships</p>
              </div>
              <div className="p-3 bg-indigo-950/15 border border-indigo-950 rounded-xl">
                <span className="text-slate-500 font-bold">Verified Certifications</span>
                <p className="text-lg font-bold text-slate-200 mt-0.5">{stats.certificates_count} Certs</p>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 leading-relaxed">
              * Note: The Word exporter compiles all your parsed documents (work experiences, courses, and certifications) into a standard ATS structure to bypass scanner rules. Click **Export as DOCX** in the top right to download.
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

export default ResumeGenerator;
