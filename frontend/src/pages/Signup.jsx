import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { authAPI } from '../services/api';

function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authAPI.signup({ 
        email, 
        password, 
        full_name: fullName 
      });
      setSuccess('Account created successfully! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Email might already be in use.');
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
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/20">
            MV
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Join MemoryVerse
          </h2>
          <p className="text-sm text-slate-400">Build your AI-powered professional digital profile</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/20 border border-rose-900/50 rounded-xl text-xs text-rose-400 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl text-xs text-emerald-400 text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <FiUser />
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-sm focus:outline-none focus:border-indigo-600 text-slate-200 transition"
              />
            </div>
          </div>

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
                placeholder="john.doe@university.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-sm focus:outline-none focus:border-indigo-600 text-slate-200 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <FiLock />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-sm focus:outline-none focus:border-indigo-600 text-slate-200 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
          >
            {loading ? (
              <span>Registering...</span>
            ) : (
              <>
                <span>Sign Up</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline font-bold">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Signup;
