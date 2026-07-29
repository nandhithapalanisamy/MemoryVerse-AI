import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { authAPI } from '../services/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(email);
      setMessage(res.data.message || 'Password reset link sent to your email.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060814] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl -z-10"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl space-y-6 shadow-2xl relative z-10 border border-indigo-950/50">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Reset Password
          </h2>
          <p className="text-sm text-slate-400">Enter your email to receive recovery instructions</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/20 border border-rose-900/50 rounded-xl text-xs text-rose-400 text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl text-xs text-emerald-400 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <FiMail />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-sm focus:outline-none focus:border-indigo-600 text-slate-200 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
          >
            {loading ? <span>Sending...</span> : <span>Send Recovery Link</span>}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2">
          <Link to="/login" className="inline-flex items-center text-indigo-400 hover:underline font-bold space-x-1.5">
            <FiArrowLeft />
            <span>Back to Login</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default ForgotPassword;
