import React, { useState } from 'react';
import { FiGlobe, FiDownload, FiCheckCircle } from 'react-icons/fi';

function PortfolioGenerator() {
  const [template, setTemplate] = useState('dark-indigo');

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    window.location.href = `/api/generators/portfolio/export?token=${token}`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      <div className="flex justify-between items-center border-b border-indigo-950/40 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">One-Click Portfolio</h1>
          <p className="text-sm text-slate-400">Generate and download a complete static portfolio website loaded with your digital identity records</p>
        </div>
        <button 
          onClick={handleDownload}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center shadow-lg shadow-indigo-600/15"
        >
          <FiDownload className="mr-1.5 text-sm" /> Download Web Bundle
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Style selection */}
        <div className="md:col-span-1 glass-panel p-6 rounded-3xl border border-indigo-950/40 space-y-4">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Aesthetic Theme</h3>
          
          <div className="space-y-3">
            <div 
              onClick={() => setTemplate('dark-indigo')}
              className={`p-4 rounded-2xl bg-indigo-950/20 border-2 cursor-pointer space-y-1 relative transition ${
                template === 'dark-indigo' ? 'border-indigo-500' : 'border-indigo-950'
              }`}
            >
              {template === 'dark-indigo' && <span className="absolute top-3 right-3 text-indigo-400 text-sm"><FiCheckCircle /></span>}
              <p className="text-xs font-bold text-slate-200">Space Indigo (Dark)</p>
              <p className="text-[10px] text-slate-500">Premium deep dark gradient background with electric indigo highlights.</p>
            </div>

            <div 
              onClick={() => setTemplate('aurora-green')}
              className={`p-4 rounded-2xl bg-emerald-950/25 border-2 cursor-pointer space-y-1 relative transition ${
                template === 'aurora-green' ? 'border-emerald-500' : 'border-indigo-950'
              }`}
            >
              {template === 'aurora-green' && <span className="absolute top-3 right-3 text-emerald-400 text-sm"><FiCheckCircle /></span>}
              <p className="text-xs font-bold text-slate-200">Aurora Green (Aesthetic)</p>
              <p className="text-[10px] text-slate-500">Deep obsidian background blended with smooth mint green glow effects.</p>
            </div>
          </div>
        </div>

        {/* Portfolio Live Preview and features */}
        <div className="md:col-span-2 glass-panel p-8 rounded-3xl border border-indigo-950/40 space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-indigo-950/40">
            <h3 className="font-extrabold text-slate-200 flex items-center">
              <FiGlobe className="mr-2 text-indigo-400" /> Export Details & Preview
            </h3>
            <span className="text-[10px] bg-indigo-950 px-2 py-0.5 rounded text-indigo-300 font-bold border border-indigo-900/60 uppercase">Single Page App</span>
          </div>

          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 bg-indigo-950/10 border border-indigo-950/40 rounded-2xl space-y-2">
              <p className="font-bold text-slate-200">What is inside the ZIP file?</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>`index.html` – Beautiful, responsive responsive web page using Tailwind CDN.</li>
                <li>`README.txt` – Simple deployment setup notes.</li>
                <li>Full integration of your projects list, certificates catalog, timeline achievements, and profile links.</li>
              </ul>
            </div>
            
            <p className="text-slate-400 leading-relaxed">
              When you click **Download Web Bundle**, MemoryVerse AI compiles all nodes from your digital identity, bundles them as a static single-page application, and packs it into a ZIP file. 
              You can double-click and run it instantly offline, or publish it directly to GitHub Pages, Netlify, or Vercel with one click!
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default PortfolioGenerator;
