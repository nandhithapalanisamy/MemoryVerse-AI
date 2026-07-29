import React, { useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { FiTrendingUp, FiActivity, FiBriefcase, FiZap } from 'react-icons/fi';
import { analyticsAPI, insightsAPI } from '../services/api';

const COLORS = ['#3b82f6', '#a855f7', '#10b981', '#f97316', '#ec4899'];

function Analytics() {
  const [charts, setCharts] = useState({
    skills_distribution: [],
    certs_by_year: [],
    projects_by_domain: []
  });
  const [insights, setInsights] = useState({
    job_readiness_score: 0,
    role_readiness_breakdown: [],
    career_advice: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chartsRes, insightsRes] = await Promise.all([
        analyticsAPI.getCharts(),
        insightsAPI.getInsights()
      ]);
      setCharts(chartsRes.data);
      setInsights(insightsRes.data);
    } catch (err) {
      console.error(err);
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

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div className="border-b border-indigo-950/40 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Analytics Dashboard</h1>
        <p className="text-sm text-slate-400">Deep AI insights regarding your skills breakdown, project groupings, and target job readiness</p>
      </div>

      {/* Career Readiness Score block */}
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-indigo-950/40 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Aggregate Job Readiness</span>
          <p className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{insights.job_readiness_score}%</p>
          <p className="text-xs text-slate-400 leading-relaxed pt-2">Weighted score computed by comparing user certificates and skills against market expectations.</p>
        </div>

        <div className="lg:col-span-3 glass-panel p-6 rounded-3xl border border-indigo-950/40 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center">
            <FiZap className="mr-2 text-indigo-400 animate-pulse" /> Skill Gap Target Recommendations
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {insights.role_readiness_breakdown.map((role, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-950 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-200 truncate">{role.job_profile}</p>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${role.readiness_score}%` }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-300">{role.readiness_score}% ready</span>
                </div>
                
                <div className="space-y-1.5 text-[10px] text-slate-400">
                  <p className="font-bold text-slate-500">Missing:</p>
                  <p className="truncate">{role.missing_skills.length > 0 ? role.missing_skills.join(", ") : "None! Complete!"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts Graphs Block */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Skills Radar */}
        <div className="glass-panel p-6 rounded-3xl border border-indigo-950/40 space-y-4 min-h-[380px] flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center">
            <FiActivity className="mr-1.5 text-indigo-400" /> Skills distribution mapping
          </h3>
          <div className="flex-1 min-h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart cx="50%" cy="50%" r="80%" data={charts.skills_distribution}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="rgba(255,255,255,0.1)" />
                <Radar name="Skills" dataKey="value" stroke="#818cf8" fill="#4f46e5" fillOpacity={0.35} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#312e81', fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Certificates yearly trends */}
        <div className="glass-panel p-6 rounded-3xl border border-indigo-950/40 space-y-4 min-h-[380px] flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center">
            <FiTrendingUp className="mr-1.5 text-indigo-400" /> Certifications by Year
          </h3>
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.certs_by_year}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#312e81', fontSize: 10 }} />
                <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects by Domain Pie */}
        <div className="glass-panel p-6 rounded-3xl border border-indigo-950/40 space-y-4 min-h-[380px] flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center">
            <FiBriefcase className="mr-1.5 text-indigo-400" /> Projects by Engineering Domain
          </h3>
          <div className="flex-1 min-h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={charts.projects_by_domain}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="domain"
                >
                  {charts.projects_by_domain.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#312e81', fontSize: 10 }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Analytics;
