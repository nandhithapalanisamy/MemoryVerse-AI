import React, { useState, useEffect } from 'react';
import { 
  FiUploadCloud, FiLink, FiFolder, FiTrash2, FiCpu, 
  FiFileText, FiGlobe, FiGithub, FiLinkedin, FiClock
} from 'react-icons/fi';
import { documentsAPI, aiAPI } from '../services/api';

function UploadCenter() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // URL Input values
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  
  // Selected files
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Processing states mapping doc_id -> processing_state
  const [processingStatus, setProcessingStatus] = useState({});

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await documentsAPI.getAll();
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    setLoading(true);
    setUploadProgress(20);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      setUploadProgress(50);
      const res = await documentsAPI.upload(formData);
      setUploadProgress(100);
      setSelectedFile(null);
      fetchDocuments();
      
      // Auto trigger AI Processing
      handleTriggerAI(res.data.id);
    } catch (err) {
      alert(err.response?.data?.detail || "File upload failed.");
    } finally {
      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const handleUrlUpload = async (type) => {
    setLoading(true);
    const formData = new FormData();
    if (type === 'portfolio' && portfolioUrl) {
      formData.append('portfolio_url', portfolioUrl);
    } else if (type === 'github' && githubUrl) {
      formData.append('github_url', githubUrl);
    } else if (type === 'linkedin' && linkedinUrl) {
      formData.append('linkedin_url', linkedinUrl);
    } else {
      setLoading(false);
      return;
    }
    
    try {
      await documentsAPI.upload(formData);
      // Clear fields
      setPortfolioUrl('');
      setGithubUrl('');
      setLinkedinUrl('');
      fetchDocuments();
    } catch (err) {
      alert("URL submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAI = async (docId) => {
    setProcessingStatus(prev => ({ ...prev, [docId]: 'Parsing...' }));
    
    try {
      setProcessingStatus(prev => ({ ...prev, [docId]: 'Categorizing...' }));
      await aiAPI.process(docId);
      setProcessingStatus(prev => ({ ...prev, [docId]: 'Completed' }));
      fetchDocuments();
    } catch (err) {
      setProcessingStatus(prev => ({ ...prev, [docId]: 'Error' }));
    } finally {
      setTimeout(() => {
        setProcessingStatus(prev => {
          const next = { ...prev };
          delete next[docId];
          return next;
        });
      }, 3000);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document from your repository?")) return;
    try {
      await documentsAPI.delete(docId);
      fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-indigo-950/40 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Upload Center</h1>
          <p className="text-sm text-slate-400">Add resumes, certificates, and academic folders to feed your digital identity</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Upload column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Drag & Drop Card */}
          <div className="glass-panel p-6 rounded-3xl border border-indigo-950/40 relative">
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4">Upload File</h3>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4 transition ${
                  dragActive ? 'border-indigo-500 bg-indigo-950/15' : 'border-indigo-900/60 bg-transparent'
                }`}
              >
                <FiUploadCloud className="text-4xl text-indigo-400" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-200">Drag and drop file here, or click to browse</p>
                  <p className="text-xs text-slate-500">Supports PDF, DOCX, PPT, JPG, PNG, ZIP (Max 20MB)</p>
                </div>
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label 
                  htmlFor="file-upload"
                  className="px-4 py-2 bg-indigo-950 border border-indigo-900 text-indigo-300 font-semibold rounded-xl text-xs hover:bg-indigo-900 transition cursor-pointer"
                >
                  Browse Files
                </label>
              </div>

              {selectedFile && (
                <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex justify-between items-center text-xs">
                  <span className="truncate max-w-[200px] text-slate-200">{selectedFile.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedFile(null)} 
                    className="text-rose-400 hover:text-rose-300"
                  >
                    Clear
                  </button>
                </div>
              )}

              {uploadProgress > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400 font-bold">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <span>Upload and Process</span>
              </button>
            </form>
          </div>

          {/* Social Profiles URL Input */}
          <div className="glass-panel p-6 rounded-3xl border border-indigo-950/40 space-y-4">
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Social profiles & URLs</h3>
            
            <div className="space-y-4">
              {/* Portfolio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 flex items-center">
                  <FiGlobe className="mr-1.5" /> Portfolio URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://myportfolio.dev"
                    className="flex-1 px-3 py-2 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs focus:outline-none focus:border-indigo-600 text-slate-200"
                  />
                  <button 
                    onClick={() => handleUrlUpload('portfolio')} 
                    className="px-4 bg-indigo-950 border border-indigo-900 text-indigo-300 hover:bg-indigo-900 rounded-xl text-xs font-bold transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* GitHub */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 flex items-center">
                  <FiGithub className="mr-1.5" /> GitHub Profile
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/myusername"
                    className="flex-1 px-3 py-2 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs focus:outline-none focus:border-indigo-600 text-slate-200"
                  />
                  <button 
                    onClick={() => handleUrlUpload('github')} 
                    className="px-4 bg-indigo-950 border border-indigo-900 text-indigo-300 hover:bg-indigo-900 rounded-xl text-xs font-bold transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 flex items-center">
                  <FiLinkedin className="mr-1.5" /> LinkedIn Profile
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/myname"
                    className="flex-1 px-3 py-2 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs focus:outline-none focus:border-indigo-600 text-slate-200"
                  />
                  <button 
                    onClick={() => handleUrlUpload('linkedin')} 
                    className="px-4 bg-indigo-950 border border-indigo-900 text-indigo-300 hover:bg-indigo-900 rounded-xl text-xs font-bold transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* List column */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-indigo-950/40 flex flex-col min-h-[500px]">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-indigo-950 pb-2 flex items-center">
            <FiFolder className="mr-2 text-indigo-400" /> Files Repository ({documents.length})
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {documents.length === 0 ? (
              <p className="text-slate-500 text-xs py-12 text-center">Repository is empty.</p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="p-3 rounded-xl bg-indigo-950/15 border border-indigo-950/40 hover:border-indigo-900 transition flex items-center justify-between">
                  <div className="space-y-1 max-w-[70%]">
                    <p className="text-xs font-bold text-slate-200 truncate">{doc.filename}</p>
                    <p className="text-[10px] text-slate-400">{doc.category || 'Uncategorized'} | v{doc.version}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Process Action */}
                    {doc.status === 'Pending' && !processingStatus[doc.id] && (
                      <button 
                        onClick={() => handleTriggerAI(doc.id)} 
                        title="Process Document with AI"
                        className="p-2 rounded bg-indigo-900 hover:bg-indigo-800 text-white text-xs transition"
                      >
                        <FiCpu />
                      </button>
                    )}
                    
                    {processingStatus[doc.id] && (
                      <span className="text-[9px] font-bold text-indigo-400 animate-pulse bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900/60">
                        {processingStatus[doc.id]}
                      </span>
                    )}

                    {doc.status === 'Processed' && (
                      <span className="p-1 px-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60 text-[9px] font-bold">
                        AI Processed
                      </span>
                    )}

                    <button 
                      onClick={() => handleDelete(doc.id)} 
                      title="Delete File"
                      className="p-2 rounded hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 transition"
                    >
                      <FiTrash2 />
                    </button>
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

export default UploadCenter;
