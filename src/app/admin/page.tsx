'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Cpu, Settings, BarChart3, Menu, X, 
  FileEdit, Globe, Activity, CheckCircle, AlertCircle, Sparkles, 
  Trash2, Eye, Calendar, Search, Filter, ArrowRight, Upload,
  Plus, Save, Send, Clock, Facebook, MessageSquare, Rss, Laptop,
  HelpCircle, Award, Image as ImageIcon
} from 'lucide-react';

// --- TS Types & Mock Data ---
interface Article {
  id: string;
  title: string;
  slug: string;
  status: 'Published' | 'Draft' | 'Scheduled';
  date: string;
  category: string;
  wordCount: number;
  readingTime: number;
}

const mockArticles: Article[] = [
  { id: '1', title: 'Foot and Mouth Disease in Cattle', slug: 'fmd-cattle-guide', status: 'Published', date: 'Today', category: 'Livestock', wordCount: 1420, readingTime: 6 },
  { id: '2', title: 'Avian Influenza Bio-Security Measures', slug: 'avian-flu-biosecurity', status: 'Published', date: 'Yesterday', category: 'Poultry', wordCount: 1850, readingTime: 8 },
  { id: '3', title: 'Understanding Feline Hyperthyroidism', slug: 'feline-hyperthyroidism', status: 'Draft', date: '2 days ago', category: 'Pets', wordCount: 920, readingTime: 4 },
  { id: '4', title: 'Vaccination Schedules for Canine Parvovirus', slug: 'canine-parvovirus-vaccines', status: 'Scheduled', date: 'In 3 days', category: 'Pets', wordCount: 1200, readingTime: 5 },
];

export default function EnhancedAdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Navigation & Layout
  const [activeTab, setActiveTab] = useState<'dashboard' | 'writer' | 'manager' | 'automation' | 'settings' | 'analytics'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Writer State
  const [writerMode, setWriterMode] = useState<'topic' | 'url'>('topic');
  const [articleType, setArticleType] = useState('Livestock');
  const [articleLength, setArticleLength] = useState('Medium');
  const [editorContent, setEditorContent] = useState({
    title: '', slug: '', excerpt: '', metaDescription: '', tags: '', content: ''
  });
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');

  // Manager State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);

  // Show Toast Auto-dismiss
  showToast;
  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'ChihAna21*') {
      setAuthenticated(true);
      showToast('Welcome back, Admin!', 'success');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F19] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 mb-3">
              <Cpu className="text-emerald-400 w-6 h-6" />
            </div>
            <h1 className="text-white text-2xl font-black tracking-tight">VetSphere Admin</h1>
            <p className="text-gray-400 text-sm mt-1">AI Automated CMS Terminal</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Access Passphrase"
                className="w-full px-5 py-4 rounded-xl bg-gray-950/50 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
            >
              Unlock Dashboard <ArrowRight size={18} />
            </button>
            {loginError && (
              <div className="flex items-center gap-2 text-red-400 justify-center text-sm bg-red-950/30 py-2 rounded-lg border border-red-900/30">
                <AlertCircle size={16} /> {loginError}
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Toast Alert System */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl bg-gray-900/90 shadow-2xl animate-fade-in transition-all border-gray-800">
          {toast.type === 'success' && <CheckCircle className="text-emerald-400" size={20} />}
          {toast.type === 'error' && <AlertCircle className="text-red-400" size={20} />}
          {toast.type === 'info' && <Sparkles className="text-blue-400" size={20} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Layout */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0E1322] border-r border-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-0 md:translate-x-0'} transition-transform duration-200 ease-in-out flex flex-col`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-white text-sm shadow-md">
              VS
            </div>
            <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">VetSphere</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'writer', label: 'AI Content Engine', icon: Cpu },
            { id: 'manager', label: 'Article Hub', icon: FileText },
            { id: 'automation', label: 'Automations', icon: Activity },
            { id: 'analytics', label: 'Analytics Insights', icon: BarChart3 },
            { id: 'settings', label: 'Global Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  isSelected 
                    ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-600/5 border border-emerald-500/20 text-emerald-400 shadow-sm' 
                    : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-200 border border-transparent'
                }`}
              >
                <Icon size={18} className={isSelected ? 'text-emerald-400' : 'text-gray-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800 bg-gray-950/20 text-xs text-gray-500 flex justify-between">
          <span>Engine v2.1.0</span>
          <span className="text-emerald-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Nodes Online</span>
        </div>
      </aside>

      {/* Main Dashboard Space Container */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="h-20 bg-[#0E1322]/50 backdrop-blur-md border-b border-gray-800/80 sticky top-0 z-30 px-6 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white p-2 bg-gray-800/50 rounded-lg">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-full font-mono text-gray-400">Environment: Production</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">A</div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-8">
          
          {/* --- VIEW: DASHBOARD --- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Overview Core Terminal</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Real-time status metrics and instant functions.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setActiveTab('writer')} className="bg-emerald-600 hover:bg-emerald-500 text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-950/40"><Plus size={16} /> Run AI Generation</button>
                </div>
              </div>

              {/* Glassmorphism KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { title: 'Total Content Base', value: '1,248', desc: '+12 this week', icon: FileText, color: 'text-blue-400' },
                  { title: 'Published Today', value: '4 Articles', desc: 'Targeting 5 standard', icon: Globe, color: 'text-emerald-400' },
                  { title: 'AI Synthesized', value: '88.4%', desc: '1,103 overall index', icon: Cpu, color: 'text-purple-400' },
                  { title: 'Core Node Matrix', value: 'Healthy', desc: 'Latency 114ms', icon: Laptop, color: 'text-amber-400' }
                ].map((card, i) => (
                  <div key={i} className="bg-gradient-to-b from-gray-900/60 to-gray-900/30 backdrop-blur-sm border border-gray-800 p-5 rounded-2xl relative group overflow-hidden">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">{card.title}</span>
                      <card.icon size={18} className={card.color} />
                    </div>
                    <div className="mt-3">
                      <h3 className="text-2xl font-black tracking-tight">{card.value}</h3>
                      <p className="text-xs text-gray-500 mt-1">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity Feeds */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
                  <h3 className="font-bold text-base mb-4 flex items-center gap-2"><Activity size={18} className="text-emerald-400" /> Recent Cluster Activity Log</h3>
                  <div className="space-y-4">
                    {[
                      { msg: 'Article "FMD in Cattle" posted automatically to Facebook API.', time: '14 mins ago', status: 'success' },
                      { msg: 'RSS Pipeline identified 3 new target concepts from VetMed Journal.', time: '1 hour ago', status: 'info' },
                      { msg: 'AI successfully resolved 4 reader questions under Feline Diabetes.', time: '3 hours ago', status: 'success' },
                    ].map((act, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-900/40 rounded-xl border border-gray-800/60 text-sm">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${act.status === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        <div className="flex-1">
                          <p className="text-gray-200">{act.msg}</p>
                          <span className="text-[11px] text-gray-500 font-mono mt-0.5 block">{act.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base mb-4 flex items-center gap-2"><Cpu size={18} className="text-purple-400" /> Model Infrastructure</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Primary LLM Node</span>
                        <span className="bg-purple-900/30 border border-purple-800 text-purple-300 font-bold px-2 py-0.5 rounded-md font-mono">Gemini-Pro-1.5</span>
                      </div>
                      <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-800 flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Vision Engine Pool</span>
                        <span className="bg-blue-900/30 border border-blue-800 text-blue-300 font-bold px-2 py-0.5 rounded-md font-mono">Unsplash-v2</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-800 mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5 text-gray-400 font-medium">
                      <span>Monthly API Quota Utilization</span>
                      <span>42.8%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: '42.8%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: AI WRITER ENGINE --- */}
          {activeTab === 'writer' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">AI Content Pipeline Configuration</h2>
                <p className="text-gray-400 text-sm mt-0.5">Control advanced parameters for text generation models.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Generation Controller Panel */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
                  <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
                    <button onClick={() => setWriterMode('topic')} className={`flex-1 text-center font-bold text-xs py-2 rounded-lg transition ${writerMode === 'topic' ? 'bg-gray-800 text-emerald-400' : 'text-gray-400'}`}>Topic Prompt</button>
                    <button onClick={() => setWriterMode('url')} className={`flex-1 text-center font-bold text-xs py-2 rounded-lg transition ${writerMode === 'url' ? 'bg-gray-800 text-emerald-400' : 'text-gray-400'}`}>Scrape URL</button>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-semibold">
                      {writerMode === 'topic' ? 'Target Topic Vector' : 'Source Document URL'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={writerMode === 'topic' ? "e.g., Canine Distemper Outbreaks" : "https://vet-journal.example/article"}
                      className="w-full text-sm px-4 py-3 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Category Matrix</label>
                      <select value={articleType} onChange={(e) => setArticleType(e.target.value)} className="w-full text-sm px-3 py-2.5 rounded-xl bg-gray-950/60 border border-gray-800 focus:outline-none">
                        <option>Livestock</option>
                        <option>Poultry</option>
                        <option>Pets</option>
                        <option>Wildlife</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Length Scale</label>
                      <select value={articleLength} onChange={(e) => setArticleLength(e.target.value)} className="w-full text-sm px-3 py-2.5 rounded-xl bg-gray-950/60 border border-gray-800 focus:outline-none">
                        <option>Short (500w)</option>
                        <option>Medium (1200w)</option>
                        <option>Long (2500w)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40">
                      <Sparkles size={16} /> Synthesize Article
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-xs font-semibold rounded-xl text-gray-300 flex items-center justify-center gap-1.5"><HelpCircle size={14} /> Add FAQs</button>
                      <button className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-xs font-semibold rounded-xl text-gray-300 flex items-center justify-center gap-1.5"><Award size={14} /> Add Quiz</button>
                    </div>
                  </div>
                </div>

                {/* Main Integrated Workspace & Workspace Editor */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="border-b border-gray-800 bg-gray-950/40 px-5 py-3 flex justify-between items-center flex-wrap gap-3">
                      <div className="flex gap-2 p-0.5 bg-gray-900 border border-gray-800 rounded-lg">
                        <button onClick={() => setEditorTab('edit')} className={`text-xs font-bold px-3 py-1.5 rounded-md transition ${editorTab === 'edit' ? 'bg-gray-800 text-emerald-400' : 'text-gray-400'}`}>Structured Data</button>
                        <button onClick={() => setEditorTab('preview')} className={`text-xs font-bold px-3 py-1.5 rounded-md transition ${editorTab === 'preview' ? 'bg-gray-800 text-emerald-400' : 'text-gray-400'}`}>Interactive Live Preview</button>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                        <span>Words: <strong className="text-gray-200">0</strong></span>
                        <span>Reading: <strong className="text-gray-200">0m</strong></span>
                        <span className="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded border border-gray-800 text-emerald-400">SEO: <strong>0/100</strong></span>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {editorTab === 'edit' ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block font-semibold">SEO Optimized Title</label>
                              <input type="text" className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:outline-none" placeholder="Enter post title" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block font-semibold">Permanent Slug Pointer</label>
                              <input type="text" className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:outline-none" placeholder="post-slug-url" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block font-semibold">Excerpt Summary</label>
                              <textarea rows={2} className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:outline-none" placeholder="Short description..." />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block font-semibold">Meta Description (155 characters max)</label>
                              <textarea rows={2} className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:outline-none" placeholder="Google tracking text..." />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block font-semibold">Comma-Separated Tags</label>
                              <input type="text" className="w-full text-sm px-4 py-2.5 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:outline-none" placeholder="cattle, health, medicine" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block font-semibold">Hero Media Resource</label>
                              <div className="flex gap-2">
                                <input type="text" className="flex-1 text-sm px-4 py-2.5 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:outline-none" placeholder="https://images.unsplash..." />
                                <button className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 text-gray-300"><Upload size={16} /></button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 mb-1 block font-semibold">Core Markdown Article Content</label>
                            <textarea rows={12} className="w-full font-mono text-sm px-4 py-3 rounded-xl bg-gray-950/60 border border-gray-800 text-white focus:outline-none leading-relaxed" placeholder="# Use standard markdown titles and formatting..." />
                          </div>
                        </>
                      ) : (
                        <div className="prose prose-invert max-w-none text-sm text-gray-300 min-h-[400px] bg-gray-950/30 p-4 rounded-xl border border-gray-800/50">
                          <p className="text-gray-500 italic font-mono text-xs">Live Markdown rendering window is empty.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Pipeline Controller */}
                  <div className="flex flex-wrap gap-2 justify-end bg-gray-900/20 p-3 rounded-xl border border-gray-800/60">
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5"><Save size={14} /> Save Draft</button>
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5"><Eye size={14} /> Preview</button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"><Clock size={14} /> Schedule</button>
                    <button className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-950"><Send size={14} /> Publish Active</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: ARTICLE HUB MANAGER --- */}
          {activeTab === 'manager' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Database Document Core</h2>
                <p className="text-gray-400 text-sm mt-0.5">Filter, inspect, and bulk-process existing assets.</p>
              </div>

              {/* Filtering Suite */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-900/30 p-4 rounded-2xl border border-gray-800">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-3 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search titles/slugs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-gray-300 focus:outline-none">
                    <option>All Statuses</option>
                    <option>Published</option>
                    <option>Draft</option>
                    <option>Scheduled</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions Console */}
              {selectedArticles.length > 0 && (
                <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-xl flex flex-wrap gap-2 items-center justify-between text-xs animate-fade-in">
                  <span className="font-medium text-emerald-400 pl-2">Selected: <strong>{selectedArticles.length}</strong> resources</span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-300 transition">Bulk Publish</button>
                    <button className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-300 transition">Bulk Sync FAQs</button>
                    <button className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-900/40 rounded-lg transition flex items-center gap-1"><Trash2 size={12} /> Bulk Delete</button>
                  </div>
                </div>
              )}

              {/* Main Professional Data Table */}
              <div className="bg-gray-900/20 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-950/50 border-b border-gray-800 text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                        <th className="py-4 px-5 w-10">
                          <input 
                            type="checkbox" 
                            onChange={(e) => {
                              if (e.target.checked) setSelectedArticles(mockArticles.map(a => a.id));
                              else setSelectedArticles([]);
                            }}
                            className="rounded border-gray-800 bg-gray-950 checked:bg-emerald-500" 
                          />
                        </th>
                        <th className="py-4 px-4">Status Vector</th>
                        <th className="py-4 px-4">Article Title Context</th>
                        <th className="py-4 px-4">Runtime Index</th>
                        <th className="py-4 px-4 text-right">Actions Panel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 text-sm">
                      {mockArticles.map((art) => (
                        <tr key={art.id} className="hover:bg-gray-900/40 transition-colors group">
                          <td className="py-3.5 px-5">
                            <input 
                              type="checkbox" 
                              checked={selectedArticles.includes(art.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedArticles([...selectedArticles, art.id]);
                                else setSelectedArticles(selectedArticles.filter(id => id !== art.id));
                              }}
                              className="rounded border-gray-800 bg-gray-950 text-emerald-500" 
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                              art.status === 'Published' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                              art.status === 'Draft' ? 'bg-gray-800 text-gray-400' : 'bg-blue-950/40 text-blue-400 border border-blue-900/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${art.status === 'Published' ? 'bg-emerald-400' : art.status === 'Draft' ? 'bg-gray-400' : 'bg-blue-400'}`} />
                              {art.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-gray-200">
                            <div>
                              <p className="group-hover:text-emerald-400 transition-colors">{art.title}</p>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">/{art.slug}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-gray-400 text-xs">{art.date}</span>
                            <span className="text-[11px] text-gray-600 block mt-0.5">{art.wordCount} words • {art.readingTime}m reading</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition" title="Edit Content"><FileEdit size={14} /></button>
                              <button className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition" title="Live Link Out"><Eye size={14} /></button>
                              <button className="p-1.5 bg-red-950/40 hover:bg-red-950 border border-red-900/30 text-red-400 rounded-lg transition" title="Destroy Asset"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Matrix */}
                <div className="bg-gray-950/40 border-t border-gray-800 px-5 py-3.5 flex items-center justify-between text-xs text-gray-400">
                  <span>Displaying 1-4 of 1,248 entries</span>
                  <div className="flex gap-1">
                    <button className="px-3 py-1.5 bg-gray-800 disabled:opacity-40 text-gray-300 rounded-lg cursor-not-allowed">Previous</button>
                    <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition">Next</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: AUTOMATION NETWORKS --- */}
          {activeTab === 'automation' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">AI & Social Syndication Pipeline</h2>
                <p className="text-gray-400 text-sm mt-0.5">Automate third-party sync processes without human validation loops.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Autonomous AI Publishing Engine', icon: Cpu, desc: 'Generates and posts content based on internal search keyword trend graphs.', active: true },
                  { title: 'Meta/Facebook API Synchronization', icon: Facebook, desc: 'Creates customized descriptions and shares new assets to page walls automatically.', active: true },
                  { title: 'AI Instant Comment Interaction', icon: MessageSquare, desc: 'Evaluates and processes user text on articles within 90s using Gemini.', active: false },
                  { title: 'Medical RSS Live Monitor', icon: Rss, desc: 'Scrapes global veterinary research libraries to capture emerging medical vectors.', active: true },
                ].map((auto, i) => (
                  <div key={i} className="bg-gray-900/30 border border-gray-800 p-5 rounded-2xl flex items-start gap-4 justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl mt-0.5 text-emerald-400">
                        <auto.icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-200">{auto.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{auto.desc}</p>
                      </div>
                    </div>
                    <div>
                      <button 
                        onClick={() => showToast(`${auto.title} status toggled!`, 'info')}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${auto.active ? 'bg-emerald-600' : 'bg-gray-800'}`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow-md absolute transform transition-transform ${auto.active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- VIEW: ANALYTICS INSIGHTS --- */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Analytics & Aggregations</h2>
                <p className="text-gray-400 text-sm mt-0.5">Data visual tracking arrays for the VetSphere platform.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/30 border border-gray-800 p-5 rounded-2xl md:col-span-2">
                  <h3 className="text-sm font-bold text-gray-300 mb-6">Traffic & Output Volatility Index (Last 30 Days)</h3>
                  {/* Mock Chart Visualization */}
                  <div className="h-44 flex items-end justify-between gap-1 pt-4 border-b border-l border-gray-800 px-2">
                    {[35, 45, 22, 65, 50, 85, 90, 60, 75, 40, 85, 100].map((val, idx) => (
                      <div key={idx} className="w-full bg-emerald-600/20 hover:bg-emerald-500/40 border-t border-emerald-500/40 rounded-t-sm group relative transition-all" style={{ height: `${val}%` }}>
                        <div className="absolute top--8 left-1/2 transform -translate-x-1/2 bg-gray-950 border border-gray-800 px-1.5 py-0.5 rounded text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          Vol: {val * 12}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-gray-600 mt-2 px-1">
                    <span>Q1 Block</span>
                    <span>Mid-Period</span>
                    <span>Current Runtime</span>
                  </div>
                </div>

                <div className="bg-gray-900/30 border border-gray-800 p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-gray-300">Category Density</h3>
                  <div className="space-y-3 pt-2">
                    {[
                      { name: 'Livestock Insights', count: '452 posts', pct: '36%' },
                      { name: 'Poultry Medicine', count: '312 posts', pct: '25%' },
                      { name: 'Domestic Pets', count: '280 posts', pct: '22%' },
                      { name: 'Wildlife & Exotic', count: '204 posts', pct: '17%' },
                    ].map((cat, i) => (
                      <div key={i} className="text-xs">
                        <div className="flex justify-between text-gray-400 mb-1">
                          <span className="font-medium text-gray-300">{cat.name}</span>
                          <span>{cat.pct} ({cat.count})</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: cat.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW: SETTINGS SUB-ARRAY --- */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">System Environment Adjustments</h2>
                <p className="text-gray-400 text-sm mt-0.5">Manage secret parameters and cloud network keys securely.</p>
              </div>

              <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">Site Profiles</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block font-mono">WEBSITE_NAME</label>
                        <input type="text" defaultValue="VetSphere Intelligence Hub" className="w-full text-xs px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block font-mono">SITE_LOGO_RESOURCE</label>
                        <div className="flex gap-2">
                          <input type="text" defaultValue="/assets/branding/logo.svg" className="flex-1 text-xs px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none" />
                          <button className="px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 text-xs font-bold"><ImageIcon size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3">Model Credentials Pipeline</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block font-mono">OPENAI_API_SECURE_KEY</label>
                        <input type="password" placeholder="sk-••••••••••••••••••••••••" className="w-full text-xs px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block font-mono">GEMINI_AI_TOKEN_VECTOR</label>
                        <input type="password" placeholder="AIzaSy••••••••••••••••••••" className="w-full text-xs px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800/80 flex justify-end">
                  <button onClick={() => showToast('Configuration arrays synced down successfully.', 'success')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-950">
                    <Save size={14} /> Commit Settings Changes
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
