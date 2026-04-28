"use client";

import React from "react";
import { ChevronDown, AlertCircle, Activity, Shield, Users, MapPin, Zap, Home } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#13151a] text-gray-200 p-4 font-sans selection:bg-emerald-500/30">
      
      {/* Top Filter Bar */}
      <div className="flex items-center gap-4 mb-4 text-xs font-semibold text-gray-400">
        <a href="/city" className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-4 py-2 rounded border border-emerald-500/30 transition-colors mr-auto">
          <Home className="size-4" /> Go Home
        </a>
        <button className="flex items-center gap-2 bg-[#1a1c23] hover:bg-[#252830] px-4 py-2 rounded border border-gray-800 transition-colors">
          Year <span className="text-white">2024</span> <ChevronDown className="size-3" />
        </button>
        <button className="flex items-center gap-2 bg-[#1a1c23] hover:bg-[#252830] px-4 py-2 rounded border border-gray-800 transition-colors">
          Quarter <span className="text-white">Q1</span> <ChevronDown className="size-3" />
        </button>
        <button className="flex items-center gap-2 bg-[#1a1c23] hover:bg-[#252830] px-4 py-2 rounded border border-gray-800 transition-colors">
          Sector <span className="text-white">Banks</span> <ChevronDown className="size-3" />
        </button>
        <button className="flex items-center gap-2 bg-[#1a1c23] hover:bg-[#252830] px-4 py-2 rounded border border-gray-800 transition-colors">
          Member <span className="text-white">Branch</span> <ChevronDown className="size-3" />
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* ROW 1 */}
        {/* 1. Live Incidents */}
        <div className="bg-[#1a1c23] rounded-xl border border-gray-800 p-5 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 z-10">
            <h2 className="text-lg font-bold text-white">Live Incidents</h2>
            <span className="text-[10px] uppercase tracking-wider bg-gray-800 px-2 py-1 rounded text-gray-400">Rest Area</span>
          </div>
          <div className="flex items-center gap-6 z-10">
            {/* SVG Donut */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-lg">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#252830" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00d2ff" strokeWidth="8" strokeDasharray="251" strokeDashoffset="50" className="opacity-90" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ff3b3b" strokeWidth="8" strokeDasharray="251" strokeDashoffset="200" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00e676" strokeWidth="8" strokeDasharray="251" strokeDashoffset="180" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">492</span>
              </div>
            </div>
            {/* Bar Chart Mockup */}
            <div className="flex-1 h-32 flex items-end gap-1">
              {[30, 80, 20, 40, 30, 50, 40, 60, 50, 70, 60, 80].map((h, i) => (
                <div key={i} className="flex-1 bg-gray-800 rounded-t-sm relative group" style={{ height: '100%' }}>
                  <div 
                    className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-500 ${i === 1 ? 'bg-[#00e676]' : i === 3 ? 'bg-yellow-400' : i === 11 ? 'bg-red-500' : 'bg-[#00d2ff]'}`} 
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Response Activities */}
        <div className="bg-[#1a1c23] rounded-xl border border-gray-800 p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Response Activities</h2>
            <span className="text-[10px] uppercase tracking-wider bg-gray-800 px-2 py-1 rounded text-gray-400">Fleet Briefing</span>
          </div>
          <div className="flex gap-8">
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-3xl font-black text-white">34</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-yellow-500">6</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">In Progress</div>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-3 justify-center">
              {[
                { name: "Unit Deployment A", time: "26m", color: "bg-red-500", w: "80%" },
                { name: "Medical Evac B", time: "70m", color: "bg-[#00e676]", w: "40%" },
                { name: "Fire Suppression", time: "30m", color: "bg-gray-700", w: "60%" },
                { name: "Perimeter Sweep", time: "50m", color: "bg-yellow-500", w: "90%" },
              ].map((act, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 truncate w-32">{act.name}</span>
                  <div className="flex-1 mx-4 bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div className={`${act.color} h-full rounded-full`} style={{ width: act.w }} />
                  </div>
                  <span className="text-gray-500 w-8 text-right">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Incident Categories */}
        <div className="bg-[#1a1c23] rounded-xl border border-gray-800 p-5 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">Incident Categories</h2>
          <div className="flex justify-around items-center mb-6">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#252830" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00e676" strokeWidth="12" strokeDasharray="251" strokeDashoffset="100" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">21</div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 uppercase tracking-widest whitespace-nowrap">Medical</div>
            </div>
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#252830" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00e676" strokeWidth="12" strokeDasharray="251" strokeDashoffset="60" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">26</div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 uppercase tracking-widest whitespace-nowrap">Security</div>
            </div>
          </div>
          <div className="mt-auto grid grid-cols-2 gap-4 text-xs">
            <div className="flex justify-between border-b border-gray-800 pb-1">
              <span className="text-gray-400">Hostel Wing A</span>
              <span className="text-white">10</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-1">
              <span className="text-gray-400">Sector 7</span>
              <span className="text-white">15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Main Lobby</span>
              <span className="text-white">17</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Perimeter</span>
              <span className="text-white">5</span>
            </div>
          </div>
        </div>

        {/* ROW 2 */}
        {/* 4. Inspections */}
        <div className="bg-[#1a1c23] rounded-xl border border-gray-800 p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Inspections</h2>
            <span className="text-[10px] uppercase tracking-wider bg-gray-800 px-2 py-1 rounded text-gray-400">Sensors</span>
          </div>
          <div className="flex gap-4">
            <div className="grid grid-cols-2 gap-2 flex-1">
              {[
                { n: 203, l: "Full Scope", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
                { n: 203, l: "Thematic", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
                { n: 203, l: "Follow Up", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
                { n: 203, l: "Offline", bg: "bg-gray-700/30", border: "border-gray-600", text: "text-gray-400" },
              ].map((b, i) => (
                <div key={i} className={`flex flex-col items-center justify-center p-2 rounded-lg border ${b.bg} ${b.border}`}>
                  <span className={`text-xl font-bold ${b.text}`}>{b.n}</span>
                  <span className="text-[10px] text-gray-300 mt-1">{b.l}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 flex flex-col justify-center gap-4 text-xs">
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50">
                <div className="text-white mb-1">Cameras Online</div>
                <div className="text-emerald-400 font-mono">20-Feb-2024</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50">
                <div className="text-white mb-1">Upcoming Maintenance</div>
                <div className="text-yellow-400 font-mono">25-Feb-2024</div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Requests & SOS */}
        <div className="bg-[#1a1c23] rounded-xl border border-gray-800 p-5 flex flex-col relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Requests & SOS</h2>
            <span className="text-xl font-black text-white">3435</span>
          </div>
          {/* Tree Diagram Mockup */}
          <div className="flex-1 flex flex-col items-center justify-center pt-4 relative">
             <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-1 rounded text-xs font-bold z-10">New SOS</div>
             <div className="w-px h-6 bg-gray-700"></div>
             <div className="w-64 h-px bg-gray-700 relative">
               <div className="absolute left-0 -top-6 w-px h-6 bg-gray-700"></div>
               <div className="absolute right-0 -top-6 w-px h-6 bg-gray-700"></div>
             </div>
             <div className="flex justify-between w-64 pt-2 z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded text-[10px]">Processing</div>
                  <div className="flex gap-4">
                    <div className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-[10px]">Denied</div>
                    <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-[10px]">Approved</div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded text-[10px]">Under Review</div>
                  <div className="flex gap-4">
                    <div className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-[10px]">Pending</div>
                    <div className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded text-[10px]">Closed</div>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* 6. Requests / Responders */}
        <div className="bg-[#1a1c23] rounded-xl border border-gray-800 p-5 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-4">Requests Map</h2>
          <div className="flex gap-4">
            <div className="w-1/2 rounded-lg bg-gray-800 relative overflow-hidden flex items-center justify-center border border-gray-700">
               <MapPin className="text-gray-600 size-12 absolute opacity-20" />
               <div className="absolute top-4 left-4 size-3 bg-red-500 rounded-full animate-ping"></div>
               <div className="absolute bottom-6 right-6 size-2 bg-emerald-500 rounded-full"></div>
               <div className="absolute top-1/2 left-1/2 size-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="w-1/2 flex flex-col gap-3">
               <h3 className="text-xs font-bold text-gray-400 uppercase">Security Staff</h3>
               <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                 <div className="size-2 bg-emerald-500 rounded-full"></div> Active Patrol
               </div>
               <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                 <div className="size-2 bg-yellow-500 rounded-full"></div> Responding
               </div>
               <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                 <div className="size-2 bg-gray-500 rounded-full"></div> Offline
               </div>
               
               <h3 className="text-xs font-bold text-gray-400 uppercase mt-2">Nearby</h3>
               <div className="text-xs text-white">Unit A-77 <span className="text-gray-500">(2m)</span></div>
               <div className="text-xs text-white">Unit B-12 <span className="text-gray-500">(5m)</span></div>
            </div>
          </div>
        </div>

        {/* ROW 3 */}
        {/* 7. Loss / Damage Summary */}
        <div className="bg-[#1a1c23] rounded-xl border border-gray-800 p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Loss / Damage Summary</h2>
            <span className="text-[10px] uppercase tracking-wider bg-gray-800 px-2 py-1 rounded text-gray-400">2023 Q1</span>
          </div>
          <div className="flex gap-6 items-center">
            {/* Half Donut Gauge */}
            <div className="relative w-32 h-16 overflow-hidden flex-shrink-0">
               <svg viewBox="0 0 100 50" className="w-full h-full">
                 <path d="M 10 50 A 40 40 0 0 1 90 50" fill="transparent" stroke="#252830" strokeWidth="20" />
                 <path d="M 10 50 A 40 40 0 0 1 50 10" fill="transparent" stroke="#ff3b3b" strokeWidth="20" />
               </svg>
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                 <span className="text-lg font-black text-white">$1.2M</span>
               </div>
            </div>
            <div className="flex-1 text-xs space-y-2">
               <div className="flex justify-between border-b border-gray-800 pb-1">
                 <span className="text-gray-400">Estimated Risk Prevented</span>
                 <span className="text-emerald-400">160</span>
               </div>
               <div className="flex justify-between border-b border-gray-800 pb-1">
                 <span className="text-gray-400">Incidents Avoided</span>
                 <span className="text-white">45</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-400">Reduction %</span>
                 <span className="text-emerald-400 bg-emerald-500/20 px-1 rounded">40%</span>
               </div>
            </div>
          </div>
        </div>

        {/* 8. People */}
        <div className="bg-[#1a1c23] rounded-xl border border-gray-800 p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">People Status</h2>
            <span className="text-xl font-black text-white">296</span>
          </div>
          <div className="flex items-center justify-around gap-4 mb-4">
             <div className="flex flex-col items-center gap-2">
               <div className="relative w-16 h-16">
                 <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-md">
                   <circle cx="50" cy="50" r="40" fill="transparent" stroke="#252830" strokeWidth="16" />
                   <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00d2ff" strokeWidth="16" strokeDasharray="251" strokeDashoffset="55" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">78%</div>
               </div>
               <span className="text-[10px] text-gray-400 uppercase tracking-widest">Safe</span>
             </div>
             <div className="flex flex-col items-center gap-2">
               <div className="relative w-16 h-16">
                 <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-md">
                   <circle cx="50" cy="50" r="40" fill="transparent" stroke="#252830" strokeWidth="16" />
                   <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8b5cf6" strokeWidth="16" strokeDasharray="251" strokeDashoffset="188" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">25%</div>
               </div>
               <span className="text-[10px] text-gray-400 uppercase tracking-widest">Evacuating</span>
             </div>
             
             <div className="flex-1 flex flex-col justify-center text-xs space-y-2 pl-4 border-l border-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-400">Guests Safe</span>
                  <span className="text-white">102</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Missing/Unaccounted</span>
                  <span className="text-red-400">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Staff Active</span>
                  <span className="text-white">24</span>
                </div>
             </div>
          </div>
        </div>

        {/* 9. Frameworks */}
        <div className="bg-[#1a1c23] rounded-xl border border-gray-800 p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Frameworks</h2>
          </div>
          <div className="flex-1 flex items-center justify-between px-2">
             {/* Hexagons */}
             {[
               { id: "ML2", color: "bg-orange-500", label: "Cortile", n: "07" },
               { id: "ML3", color: "bg-yellow-500", label: "Foreign", n: "16" },
               { id: "ML4", color: "bg-emerald-500", label: "Vereless", n: "82" },
               { id: "ML0", color: "bg-emerald-500", label: "Brewes", n: "87" },
               { id: "ML1", color: "bg-blue-500", label: "Finance", n: "12" },
             ].map((hex, i) => (
               <div key={i} className="flex flex-col items-center gap-2 relative">
                 <div className={`${hex.color} w-10 h-12 flex items-center justify-center relative shadow-lg shadow-black/50 z-10`} style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                   <span className="text-white font-bold text-xs">{hex.id}</span>
                 </div>
                 {i < 4 && <div className="absolute top-6 left-5 w-full h-px bg-gray-700 -z-0"></div>}
                 <div className="text-center mt-2">
                   <div className="text-sm font-bold text-white">{hex.n}</div>
                   <div className="text-[10px] text-gray-500 uppercase">{hex.label}</div>
                 </div>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
