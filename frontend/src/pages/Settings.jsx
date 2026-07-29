import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSettings, FiMoon, FiSun, FiTrash2, FiDownload, FiCheckCircle } from 'react-icons/fi';
import { settingsAPI } from '../services/api';

function Settings({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const [dbSettings, setDbSettings] = useState({
    theme: 'dark',
    language: 'en',
    privacy: 'private'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setDbSettings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      await settingsAPI.update(dbSettings);
      setSuccess('Settings saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await settingsAPI.exportData();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "MemoryVerse_Profile_Backup.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Failed to export profile data.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm("WARNING: Are you absolutely sure you want to permanently delete your MemoryVerse account? This action is irreversible and all your uploaded documents and parsed data will be destroyed!");
    if (!confirmation) return;

    try {
      await settingsAPI.deleteAccount();
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      alert("Failed to delete account.");
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
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      
      <div className="border-b border-indigo-950/40 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-400">Configure theme aesthetics, profile visibility, and data management</p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl text-xs text-emerald-400 text-center flex items-center justify-center space-x-1.5 animate-fade-in">
          <FiCheckCircle />
          <span>{success}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-3xl border border-indigo-950/40 space-y-4">
        <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Aesthetic Preference</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">App Theme Mode</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => { toggleTheme(); setDbSettings({ ...dbSettings, theme: theme === 'dark' ? 'light' : 'dark' }); }}
                className="w-full py-2.5 bg-indigo-950/20 border border-indigo-900/40 hover:bg-indigo-950/40 text-xs text-slate-200 rounded-xl font-semibold flex items-center justify-center space-x-1.5 transition"
              >
                {theme === 'dark' ? (
                  <>
                    <FiMoon />
                    <span>Dark Mode Active</span>
                  </>
                ) : (
                  <>
                    <FiSun />
                    <span>Light Mode Active</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Default Language</label>
            <select
              value={dbSettings.language}
              onChange={(e) => setDbSettings({ ...dbSettings, language: e.target.value })}
              className="w-full px-3 py-2 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs focus:outline-none focus:border-indigo-600 text-slate-200"
            >
              <option value="en" className="bg-[#0b0f19]">English</option>
              <option value="es" className="bg-[#0b0f19]">Spanish</option>
              <option value="fr" className="bg-[#0b0f19]">French</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Profile Visibility</label>
          <select
            value={dbSettings.privacy}
            onChange={(e) => setDbSettings({ ...dbSettings, privacy: e.target.value })}
            className="w-full px-3 py-2 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs focus:outline-none focus:border-indigo-600 text-slate-200"
          >
            <option value="private" className="bg-[#0b0f19]">Private (Default)</option>
            <option value="public" className="bg-[#0b0f19]">Public (Searchable by recruiters)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Danger Zone / Data Management */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-950/40 space-y-4">
        <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Account & Data Management</h3>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={handleExportData}
            className="flex-1 py-2.5 bg-indigo-950 border border-indigo-900 text-indigo-300 hover:bg-indigo-900 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
          >
            <FiDownload />
            <span>Export Data Profile (JSON)</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="flex-1 py-2.5 bg-rose-950/20 border border-rose-950/40 text-rose-400 hover:bg-rose-950/30 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
          >
            <FiTrash2 />
            <span>Delete Account & Purge Data</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default Settings;
