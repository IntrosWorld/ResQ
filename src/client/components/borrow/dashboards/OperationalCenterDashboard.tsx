import React, { useState } from 'react';
import {
  Bell, User, LayoutDashboard, AlertTriangle, Map,
  BarChart, Settings, Heart, Plus, Minus, Users, Phone,
  Camera, Stethoscope, Briefcase, Activity, Target, Home
} from 'lucide-react';
import { TwilioAlertSetup, loadAlertConfig, type AlertConfig } from '../../TwilioAlertSetup';

export default function OperationalCenterDashboard() {
  const [alertSetupOpen, setAlertSetupOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(() => loadAlertConfig());
  return (
    <div className="flex h-screen w-screen bg-[#0B0F19] font-paragraph text-slate-300 overflow-hidden selection:bg-cyan-900 selection:text-cyan-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#070B14] border-r border-slate-800/50 flex flex-col h-full flex-shrink-0 z-20">
        {/* Sidebar Header (Empty space to align with Top Nav if needed, but TopNav goes all the way left) */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
           <div className="flex items-center gap-3">
            <div className="text-2xl font-bold tracking-tight text-[#3B82F6]">ResQ</div>
            <div className="w-px h-6 bg-slate-700"></div>
            <div className="text-[11px] text-cyan-500 font-bold tracking-widest uppercase">Operational<br/>Center</div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
          <a href="/city" className="flex items-center gap-4 px-4 py-3.5 rounded-lg bg-[#1E293B]/40 text-[#38BDF8] font-bold border-l-[3px] border-[#38BDF8]">
            <Home className="w-5 h-5" />
            Go Home
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors font-semibold">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors font-semibold">
            <AlertTriangle className="w-5 h-5" />
            Incidents
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors font-semibold">
            <Map className="w-5 h-5" />
            Map
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors font-semibold">
            <BarChart className="w-5 h-5" />
            Analytics
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors font-semibold mt-auto">
            <Settings className="w-5 h-5" />
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Navigation */}
        <header className="h-20 bg-[#0B0F19] border-b border-slate-800/50 flex items-center justify-end px-8 z-10 flex-shrink-0">
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors" onClick={() => setAlertSetupOpen(true)} title="Alert notifications">
              <Bell className="w-5 h-5" />
              {alertConfig?.enabled ? <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full"></span> : null}
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <div className="bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              1 Active Critical
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 z-10 relative bg-[#111623]">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
            
            {/* Top Critical Alert Card */}
            <div className="bg-[#1A131A] border border-rose-500/40 rounded-2xl p-5 flex items-center justify-between shadow-[0_0_20px_rgba(225,29,72,0.05)]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-950/50 border border-rose-500/30 rounded-xl flex items-center justify-center shrink-0 mt-1">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-rose-200/90 text-sm font-bold tracking-wider uppercase">Possible Cardiac Arrest</h2>
                  <p className="text-slate-300 text-[15px] font-medium">
                    AI analysis detected sudden collapse in CCTV Sector 4. Immediate response required.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="bg-[#FFA3A3] text-rose-950 font-bold px-8 py-3.5 rounded-full hover:bg-[#FFB5B5] transition-colors shadow-[0_0_15px_rgba(255,163,163,0.3)]">
                  Dispatch<br/>Rescue
                </button>
                <button className="bg-transparent border border-rose-500/30 text-rose-200/80 font-medium px-8 py-3.5 rounded-full hover:bg-rose-950/30 transition-colors">
                  Mute<br/>Alert
                </button>
              </div>
            </div>

            {/* Three Column Grid */}
            <div className="grid grid-cols-12 gap-6 h-[500px]">
              
              {/* Left Column (Vitals) */}
              <div className="col-span-3 flex flex-col gap-6">
                
                {/* Heart Rate Card */}
                <div className="bg-[#161C2A] border border-slate-800/60 rounded-2xl p-5 flex-1 flex flex-col relative overflow-hidden shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-bold tracking-wide text-cyan-600/80">Heart Rate (BPM)</div>
                    <div className="bg-rose-950/40 border border-rose-500/20 text-rose-400 text-[9px] font-bold px-2 py-1 rounded tracking-wider uppercase">Critical High</div>
                  </div>
                  <div className="flex items-center gap-2 mb-8">
                    <div className="text-4xl font-bold text-[#06B6D4]">142</div>
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
                  </div>
                  
                  {/* EKG Graph */}
                  <div className="mt-auto h-24 relative flex items-end">
                    <svg viewBox="0 0 200 60" className="w-full h-full stroke-cyan-400 stroke-2 fill-none drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                      <path d="M0,30 L40,30 L45,15 L50,45 L55,10 L60,50 L65,30 L90,30 L95,15 L100,45 L105,10 L110,50 L115,30 L140,30 L145,15 L150,45 L155,10 L160,50 L165,30 L200,30" />
                    </svg>
                  </div>
                </div>

                {/* Oxygen Saturation Card */}
                <div className="bg-[#161C2A] border border-slate-800/60 rounded-2xl p-5 flex-1 flex flex-col shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-bold tracking-wide text-cyan-600/80">Oxygen Saturation<br/>(SpO2)</div>
                    <div className="bg-rose-950/40 border border-rose-500/20 text-rose-400 text-[9px] font-bold px-2 py-1 rounded tracking-wider uppercase">Hypoxic</div>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <div className="text-4xl font-bold text-[#06B6D4]">88</div>
                    <div className="text-sm text-[#06B6D4] font-bold">%</div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-auto flex flex-col gap-2">
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 w-[88%] shadow-[0_0_10px_rgba(34,211,238,0.8)] rounded-full"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                      <span>0%</span>
                      <span>Normal Range (95-100%)</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column (Live Feed) */}
              <div className="col-span-5 bg-[#1A1A24] rounded-3xl overflow-hidden border border-slate-800 relative shadow-xl">
                {/* Simulated CCTV Background Image */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B0F19] z-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1555626906-fcf10d6851b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')", filter: 'brightness(0.5) contrast(1.2) hue-rotate(-10deg) saturate(0.5)'}}>
                  <div className="absolute inset-0 bg-fuchsia-900/20 mix-blend-overlay"></div>
                </div>
                
                {/* Person silhouette overlay to mimic the design */}
                <div className="absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-16 bg-black/60 blur-md rounded-[100%] rotate-6 z-0"></div>
                <div className="absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-0">
                  <div className="w-32 h-8 bg-slate-900 rounded-full rotate-6 relative">
                     <div className="absolute -left-6 top-1 w-8 h-8 bg-slate-900 rounded-full"></div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded text-[10px] font-bold text-slate-200 tracking-wider flex items-center gap-2 border border-white/10 z-20 uppercase">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  Live | Sector 4 - Metro Station
                </div>

                {/* AI Collapse Detection Overlay */}
                <div className="absolute bottom-6 left-6 right-6 bg-[#1F1923]/90 backdrop-blur-xl border border-rose-300/20 rounded-2xl p-5 z-20 flex gap-4 items-center shadow-2xl">
                  <div className="w-12 h-12 rounded-xl border border-rose-400/30 bg-rose-950/20 flex items-center justify-center shrink-0">
                    <Target className="w-6 h-6 text-rose-300" />
                  </div>
                  <div>
                    <h3 className="text-rose-200 font-bold tracking-widest text-sm uppercase mb-1">AI Collapse Detection</h3>
                    <p className="text-slate-300 text-xs font-medium leading-relaxed">
                      Subject identified at 03:42:12 UTC. Posture: Prone. Movement: None.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column (Logistics) */}
              <div className="col-span-4 flex flex-col gap-6">
                
                {/* Map Card */}
                <div className="bg-[#0C1527] rounded-3xl border border-slate-800 overflow-hidden flex-1 relative shadow-lg">
                  {/* Abstract Map Background */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0C1527] via-[#102A4E] to-[#0C1527] opacity-60"></div>
                  
                  {/* Map Lines */}
                  <svg className="absolute inset-0 w-full h-full stroke-cyan-500/20 stroke-1" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 0 30 Q 30 40 50 10 T 100 20" fill="none" />
                    <path d="M 20 100 Q 30 60 70 50 T 100 80" fill="none" />
                    <path d="M 50 10 L 50 50 L 80 50" fill="none" />
                  </svg>
                  
                  {/* Map Pins */}
                  <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                      <Briefcase className="w-4 h-4 text-[#0C1527]" />
                    </div>
                    <div className="w-0.5 h-6 bg-cyan-100"></div>
                  </div>
                  
                  <div className="absolute top-[40%] right-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-70 scale-75">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Briefcase className="w-4 h-4 text-[#0C1527]" />
                    </div>
                    <div className="w-0.5 h-6 bg-white"></div>
                  </div>
                  
                  <div className="absolute bottom-[35%] right-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                      <Briefcase className="w-4 h-4 text-[#0C1527]" />
                    </div>
                    <div className="w-0.5 h-6 bg-white"></div>
                  </div>

                  {/* Map Controls */}
                  <div className="absolute top-4 right-4 bg-[#080D1A]/80 backdrop-blur rounded-lg border border-slate-700 overflow-hidden flex flex-col">
                    <button className="p-2 text-cyan-400 hover:bg-slate-800 transition-colors border-b border-slate-700">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-cyan-400 hover:bg-slate-800 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ETA overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-[#080D1A]/80 backdrop-blur-md rounded-xl p-4 border border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ETA Unit R-102</div>
                      <div className="text-xl font-bold text-cyan-400">03:45 MIN</div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 w-2/3 shadow-[0_0_10px_rgba(34,211,238,0.8)] rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Response Logistics Card */}
                <div className="bg-[#161C2A] rounded-2xl border border-slate-800/60 p-5 shadow-lg flex-shrink-0">
                  <h3 className="text-[11px] font-bold tracking-widest text-cyan-500 uppercase mb-5">Response Logistics</h3>
                  
                  <div className="flex flex-col gap-4">
                    {/* Item 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Stethoscope className="w-4 h-4 text-cyan-500" />
                        <div className="text-sm font-medium text-slate-200">Ambulance R-102</div>
                      </div>
                      <div className="bg-cyan-950/50 border border-cyan-800/50 text-cyan-400 text-[9px] font-bold px-2 py-1 rounded tracking-wider uppercase">En Route</div>
                    </div>
                    
                    {/* Item 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">+</div>
                        <div className="text-sm font-medium text-slate-200">St. Jude Medical</div>
                      </div>
                      <div className="text-slate-500 text-[9px] font-bold px-2 py-1 tracking-wider uppercase">Ready</div>
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-slate-500" />
                        <div className="text-sm font-medium text-slate-200">Triage Team</div>
                      </div>
                      <div className="text-slate-500 text-[9px] font-bold px-2 py-1 tracking-wider uppercase">Standby</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Bottom Status Bar */}
        <footer className="h-16 bg-[#161C2A] border-t border-slate-800/60 flex items-center justify-between px-8 z-10 flex-shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium tracking-wide">Active Incidents</span>
              <span className="text-lg font-bold text-cyan-500">04</span>
            </div>
            <div className="w-px h-4 bg-slate-800"></div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium tracking-wide">Response Time (Avg)</span>
              <span className="text-lg font-bold text-cyan-500">4:12</span>
            </div>
            <div className="w-px h-4 bg-slate-800"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium tracking-wide">System Status</span>
              <div className="flex items-center gap-1.5 ml-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <span className="text-xs text-emerald-500 font-bold tracking-widest uppercase">Nominal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 relative">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <img src="https://ui-avatars.com/api/?name=Op+1&background=0EA5E9&color=fff&rounded=true" alt="Operator" className="w-8 h-8 rounded-full border-2 border-[#161C2A]" />
                <img src="https://ui-avatars.com/api/?name=Op+2&background=F59E0B&color=fff&rounded=true" alt="Operator" className="w-8 h-8 rounded-full border-2 border-[#161C2A]" />
              </div>
              <span className="text-xs text-slate-400 font-medium">2 Ops Assigned</span>
            </div>
            
            {/* Floating Action Button */}
            <button className="absolute -top-10 -right-4 w-16 h-16 bg-cyan-400 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center text-[#0B0F19] hover:bg-cyan-300 hover:scale-105 transition-all">
              <Phone className="w-7 h-7 fill-current" />
            </button>
          </div>
        </footer>

      </div>
      <TwilioAlertSetup open={alertSetupOpen} onClose={() => setAlertSetupOpen(false)} onSave={(cfg) => setAlertConfig(cfg)} current={alertConfig} />
    </div>
  );
}
