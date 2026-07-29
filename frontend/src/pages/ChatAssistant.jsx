import React, { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiSend, FiTrash2, FiCpu, FiUser } from 'react-icons/fi';
import { chatAPI } from '../services/api';

function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await chatAPI.getHistory();
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e, customContent) => {
    if (e) e.preventDefault();
    const queryText = customContent || input;
    if (!queryText.trim()) return;

    if (!customContent) setInput('');
    setLoading(true);
    
    // Add user message locally for immediate UI update
    setMessages(prev => [...prev, { role: 'user', content: queryText }]);

    try {
      const res = await chatAPI.sendMessage(queryText);
      // Replace or add assistant message
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Could not query RAG repository.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Clear all AI Chat history?")) return;
    try {
      await chatAPI.clearHistory();
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const suggestions = [
    "What skills do I have?",
    "Summarize my achievements.",
    "Show my internships.",
    "Recommend missing skills."
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto flex flex-col h-[82vh]">
      
      <div className="flex justify-between items-center border-b border-indigo-950/40 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI Assistant Chat</h1>
          <p className="text-sm text-slate-400">Ask questions, outline career suggestions, and fetch details from your uploaded documents</p>
        </div>
        <button 
          onClick={handleClear} 
          className="p-2.5 bg-rose-950/20 border border-rose-950/40 rounded-xl text-xs text-rose-400 hover:bg-rose-950/30 transition flex items-center"
        >
          <FiTrash2 className="mr-1.5" /> Clear History
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 glass-panel border border-indigo-950/40 rounded-3xl p-6 overflow-y-auto space-y-6 max-h-[550px] relative">
        
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-12">
            <FiMessageSquare className="text-5xl text-indigo-400 animate-bounce" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-200">Welcome to MemoryVerse AI Chat</h3>
              <p className="text-xs text-slate-400 max-w-sm">I can retrieve facts from your certificates, summarize resumes, and map career suggestions. Try one of these options:</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-w-md w-full">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(null, s)}
                  className="p-3 bg-indigo-950/25 border border-indigo-900/40 hover:border-indigo-600 rounded-2xl text-left text-xs text-slate-300 font-medium transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex space-x-3 items-start ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Assistant avatar */}
                {msg.role !== 'user' && (
                  <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl mt-1 text-sm">
                    <FiCpu />
                  </div>
                )}

                <div 
                  className={`p-4 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-md shadow-indigo-600/15'
                      : 'bg-indigo-950/25 border border-indigo-900/40 text-slate-200 rounded-bl-none'
                  }`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {msg.content}
                </div>

                {/* User avatar */}
                {msg.role === 'user' && (
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl mt-1 text-sm shadow-md shadow-indigo-600/10">
                    <FiUser />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex space-x-3 items-start justify-start animate-pulse">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl mt-1 text-sm">
                  <FiCpu />
                </div>
                <div className="p-4 rounded-2xl bg-indigo-950/15 border border-indigo-950 text-slate-400 text-xs rounded-bl-none flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={(e) => handleSend(e, null)} className="flex space-x-3 relative z-10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your documents, resume content, or career pathways..."
          className="flex-1 px-4 py-3 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl text-xs focus:outline-none focus:border-indigo-600/80 text-slate-200 transition"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-2xl transition flex items-center justify-center shadow-lg shadow-indigo-600/15"
        >
          <FiSend className="text-sm" />
        </button>
      </form>

    </div>
  );
}

export default ChatAssistant;
