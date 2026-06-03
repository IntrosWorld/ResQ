import React, { useState } from 'react';
import {
  Bell, User, LayoutDashboard, AlertTriangle, Map,
  Settings, Camera, Users, Target, Activity, ShieldAlert, Radio, Clock, Home
} from 'lucide-react';
import { TwilioAlertSetup, loadAlertConfig, type AlertConfig } from '../../TwilioAlertSetup';

export default function UnifiedCommandDashboard() {
  const [alertSetupOpen, setAlertSetupOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(() => loadAlertConfig());
  return (
    <div className="flex h-screen w-screen bg-[#070B14] font-paragraph text-slate-300 overflow-hidden selection:bg-cyan-900 selection:text-cyan-100 relative">
      
      {/* Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-[#070B14]/80 backdrop-blur-xl border-r border-slate-800/50 flex flex-col h-full flex-shrink-0 z-20">
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold tracking-tight text-[#818CF8]">ResQ</div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
          <a href="/city" className="flex items-center gap-4 px-4 py-3 rounded-lg bg-[#111827] text-[#38BDF8] font-bold border-l-2 border-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.1)]">
            <Home className="w-5 h-5" />
            GO HOME
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-semibold text-sm">
            <LayoutDashboard className="w-5 h-5" />
            UNIFIED CMD
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-semibold text-sm">
            <Map className="w-5 h-5" />
            GLOBAL MAP
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-semibold text-sm">
            <Camera className="w-5 h-5" />
            ALL FEEDS
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-semibold text-sm">
            <AlertTriangle className="w-5 h-5" />
            INCIDENTS
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-semibold text-sm mt-8">
            <Settings className="w-5 h-5" />
            SETTINGS
          </a>
        </nav>
        
        <div className="px-4 pb-8 flex flex-col gap-4">
            <button className="w-full bg-[#BE123C] hover:bg-[#E11D48] text-white font-bold py-3.5 rounded-md shadow-[0_0_20px_rgba(190,18,60,0.4)] transition-all uppercase tracking-widest text-xs">
                Broadcast Alert
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Top Navigation */}
        <header className="h-20 flex items-center justify-between px-8 flex-shrink-0 border-b border-slate-800/50 bg-[#070B14]/80 backdrop-blur-md">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#0EA5E9] shadow-[0_0_8px_#0EA5E9] animate-pulse"></div>
                 <span className="text-[#0EA5E9] text-xs font-bold tracking-widest uppercase">System Online</span>
             </div>
             <div className="text-slate-400 text-xs font-semibold tracking-widest uppercase">
                 Threat Level: <span className="text-amber-500 font-bold">Elevated</span>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-slate-200 transition-colors" onClick={() => setAlertSetupOpen(true)} title="Alert notifications">
              <Bell className="w-5 h-5" />
              {alertConfig?.enabled ? <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full"></span> : null}
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center overflow-hidden">
               <img src="https://ui-avatars.com/api/?name=Commander&background=0f172a&color=fff" alt="User" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            
            {/* Main Center & Right Grid */}
            <div className="flex gap-6 h-[700px]">
                
                {/* Left Side: Map / Feeds */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex-1 bg-black/40 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#070B14]/80 backdrop-blur z-10">
                            <h3 className="text-xs font-bold tracking-widest text-slate-300 uppercase">Live Global Feed</h3>
                        </div>
                        <div className="relative flex-1">
                             <img 
                                src="https://images.unsplash.com/photo-1558000143-a60d5b27452d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
                                className="w-full h-full object-cover grayscale opacity-60 mix-blend-screen"
                                alt="City Monitoring"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            
                            {/* Alert Markers */}
                            <div className="absolute top-[40%] left-[30%] w-8 h-8 bg-rose-500/20 border border-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.5)] animate-pulse">
                                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                            </div>
                            <div className="absolute top-[60%] left-[60%] w-8 h-8 bg-amber-500/20 border border-amber-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Operational Awareness Feed */}
                <div className="w-[420px] flex flex-col h-full bg-[#111827] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 bg-[#0A0F1A]">
                        <h2 className="text-lg font-bold text-white tracking-wide uppercase mb-1">Operational Awareness</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Read-only tactical feed for authorized responders</p>
                        
                        <div className="mt-6 flex items-center justify-between bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                            <div className="flex items-center gap-3">
                                <Radio className="w-5 h-5 text-[#38BDF8]" />
                                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Active Assets</span>
                            </div>
                            <div className="bg-[#38BDF8]/10 text-[#38BDF8] text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-widest border border-[#38BDF8]/30">
                                2 Teams On-Site
                            </div>
                        </div>
                    </div>

                    {/* Feed List */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        
                        {/* Alert 1: Medical */}
                        <div className="bg-[#0A0F1A] border border-slate-800 rounded-xl p-5 relative group hover:border-slate-600 transition-colors">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 rounded-l-xl"></div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-rose-500/20 text-rose-400 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-rose-500/20">Critical</span>
                                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                                    <Clock className="w-3 h-3" />
                                    12 Minutes Ago
                                </div>
                            </div>
                            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-1">Medical Alert Detected</h4>
                            <div className="text-slate-400 text-xs font-semibold tracking-wide mb-4">
                                Room 402 • 4F
                            </div>
                            
                            <div className="bg-slate-900/50 rounded p-3 mb-4 border border-slate-800">
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Perspective: North Wing</div>
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2">Last Comms</div>
                                <p className="text-slate-300 text-xs italic">"Guest reporting severe chest pain and difficulty breathing."</p>
                            </div>

                            <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold py-2.5 rounded uppercase tracking-widest transition-colors">
                                View Briefing
                            </button>
                        </div>

                        {/* Alert 2: Security */}
                        <div className="bg-[#0A0F1A] border border-slate-800 rounded-xl p-5 relative group hover:border-slate-600 transition-colors">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-xl"></div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-amber-500/20 text-amber-400 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-amber-500/20">High</span>
                                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                                    <Clock className="w-3 h-3" />
                                    3 Minutes Ago
                                </div>
                            </div>
                            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-1">Security Alert Detected</h4>
                            <div className="text-slate-400 text-xs font-semibold tracking-wide mb-4">
                                Room Lobby East • 1F
                            </div>
                            
                            <div className="bg-slate-900/50 rounded p-3 mb-4 border border-slate-800">
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Perspective: North Wing</div>
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2">Last Comms</div>
                                <p className="text-slate-300 text-xs italic">"Suspicious person seen near baggage storage area."</p>
                            </div>

                            <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold py-2.5 rounded uppercase tracking-widest transition-colors">
                                View Briefing
                            </button>
                        </div>

                        {/* Alert 3: Fire */}
                        <div className="bg-[#0A0F1A] border border-slate-800 rounded-xl p-5 relative group hover:border-slate-600 transition-colors">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 rounded-l-xl"></div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-rose-500/20 text-rose-400 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-rose-500/20">Critical</span>
                                <div className="flex items-center gap-1.5 text-rose-500 animate-pulse text-[10px] font-bold tracking-widest uppercase">
                                    Just Now
                                </div>
                            </div>
                            <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-1">Fire Alert Detected</h4>
                            <div className="text-slate-400 text-xs font-semibold tracking-wide mb-4">
                                Room Kitchen • 1F
                            </div>

                            <button className="w-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold py-2.5 rounded uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(225,29,72,0.4)] mt-2">
                                View Briefing
                            </button>
                        </div>

                    </div>
                </div>

            </div>

          </div>
        </main>

      </div>
      <TwilioAlertSetup open={alertSetupOpen} onClose={() => setAlertSetupOpen(false)} onSave={(cfg) => setAlertConfig(cfg)} current={alertConfig} />
    </div>
  );
}
