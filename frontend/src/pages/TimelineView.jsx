import React, { useState, useEffect } from 'react';
import { FiClock, FiAward, FiFileText, FiBriefcase, FiFlag } from 'react-icons/fi';
import { aiAPI } from '../services/api';

function TimelineView() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.getTimeline();
      setTimeline(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'Certificate': return <FiAward className="text-purple-400" />;
      case 'Project': return <FiFileText className="text-blue-400" />;
      case 'Internship': return <FiBriefcase className="text-emerald-400" />;
      default: return <FiFlag className="text-orange-400" />;
    }
  };

  const getEventBorder = (type) => {
    switch (type) {
      case 'Certificate': return 'border-purple-500/30';
      case 'Project': return 'border-blue-500/30';
      case 'Internship': return 'border-emerald-500/30';
      default: return 'border-orange-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Group events by year
  const groupedEvents = timeline.reduce((acc, curr) => {
    if (!acc[curr.year]) {
      acc[curr.year] = [];
    }
    acc[curr.year].push(curr);
    return acc;
  }, {});

  const years = Object.keys(groupedEvents).sort((a, b) => b - a); // descending order

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      <div className="border-b border-indigo-950/40 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Digital Journey Timeline</h1>
        <p className="text-sm text-slate-400">An automatic chronological progression of your certificates, projects, internships, and milestones</p>
      </div>

      {timeline.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-indigo-950/40 text-center space-y-4">
          <FiClock className="text-5xl text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">Your digital timeline is empty. AI automatically generates timeline cards after document processing!</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-indigo-900/60 ml-4 md:ml-32 space-y-12 pb-12">
          
          {years.map((year) => (
            <div key={year} className="relative">
              
              {/* Year badge label on the left */}
              <div className="absolute -left-[18px] md:-left-[122px] top-1.5 px-3 py-1 bg-indigo-950 border border-indigo-800 text-indigo-300 font-extrabold text-xs rounded-full shadow-md">
                Year {year}
              </div>

              {/* Event card details stacked under this year */}
              <div className="space-y-6 ml-6">
                {groupedEvents[year].map((event, idx) => (
                  <div 
                    key={event.id}
                    className={`relative glass-panel p-6 rounded-2xl border ${getEventBorder(event.event_type)} flex flex-col md:flex-row md:items-center justify-between hover:scale-[1.01] transition duration-200`}
                  >
                    {/* Event connector circle indicator */}
                    <div className="absolute -left-[35px] top-7 w-4.5 h-4.5 rounded-full bg-[#060814] border-2 border-indigo-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                    </div>

                    <div className="space-y-2 md:max-w-[70%]">
                      <div className="flex items-center space-x-2">
                        <span className="p-2 rounded-xl bg-indigo-950/50 border border-indigo-900/50 text-base">
                          {getEventIcon(event.event_type)}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          {event.event_type}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-100">{event.event_title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>
                    </div>

                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-4 md:mt-0 font-mono">
                      {event.date || `${year}`}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default TimelineView;
