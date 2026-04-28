import React from 'react';
import { 
  Bell, User, LayoutDashboard, Users, Activity, Settings, 
  Map, History, Stethoscope, AlertTriangle, Video, MapPin, Home
} from 'lucide-react';

export default function MedicalDashboard() {
  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] font-paragraph text-slate-800 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#F8FAFC] border-r border-slate-200 flex flex-col h-full flex-shrink-0 z-20">
        {/* Sidebar Header */}
        <div className="h-24 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#064E3B] rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#064E3B]">ResQ</span>
              <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">ON-CALL: ER UNIT A</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
          <a href="/city" className="flex items-center gap-4 px-4 py-3 rounded-lg bg-[#E6F4F1] text-[#064E3B] font-bold">
            <Home className="w-5 h-5" />
            Go Home
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors font-semibold text-sm">
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors font-semibold text-sm">
            <Users className="w-5 h-5" />
            Patients
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors font-semibold text-sm">
            <Map className="w-5 h-5" />
            Ambulance Tracking
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors font-semibold text-sm">
            <Video className="w-5 h-5" />
            CCTV Monitoring
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors font-semibold text-sm">
            <History className="w-5 h-5" />
            Alert History
          </a>
        </nav>
        
        <div className="px-6 pb-8 flex flex-col gap-4">
            <button className="w-full bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold py-3.5 rounded-lg shadow-sm transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                LOG CODE RED
            </button>
            <div className="flex flex-col gap-3 mt-4">
                <a href="#" className="flex items-center gap-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                </a>
                <a href="#" className="flex items-center gap-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                    <div className="w-4 h-4 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px] font-bold">?</div>
                    Support
                </a>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 bg-white">
        
        {/* Top Navigation */}
        <header className="h-20 flex items-center justify-between px-8 flex-shrink-0 border-b border-slate-100 bg-white z-20">
          <div className="flex items-center gap-12">
             <div className="text-xl font-bold tracking-tight text-slate-800">ResQ</div>
             <nav className="flex gap-8 text-sm font-bold tracking-wide text-slate-500">
                <a href="#" className="text-[#064E3B] border-b-[3px] border-[#064E3B] pb-1.5 pt-1.5">Overview</a>
                <a href="#" className="hover:text-slate-800 transition-colors py-1.5">Patients</a>
                <a href="#" className="hover:text-slate-800 transition-colors py-1.5">Ambulance Tracking</a>
                <a href="#" className="hover:text-slate-800 transition-colors py-1.5">CCTV Monitoring</a>
                <a href="#" className="hover:text-slate-800 transition-colors py-1.5">Alert History</a>
             </nav>
          </div>
          <div className="flex items-center gap-6">
            <button className="bg-[#B91C1C] hover:bg-[#991B1B] text-white text-[10px] font-bold px-4 py-2 rounded uppercase tracking-widest transition-colors">
              EMERGENCY
            </button>
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
               <User className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 relative bg-[#F8FAFC]/50">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
            
            {/* Top Row: Metrics & Alert */}
            <div className="grid grid-cols-4 gap-6 h-[200px]">
                {/* Fire Emergency Video Panel */}
                <div className="col-span-3 bg-black rounded-xl overflow-hidden shadow-sm relative group border border-slate-100">
                    <video 
                        src="https://res.cloudinary.com/dbnnd43kl/video/upload/v1777315710/fire_1_mx4kyl.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded text-white text-[10px] font-bold tracking-widest uppercase border border-white/10 z-10">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444] animate-pulse"></div>
                        LIVE FEED: INCIDENT SITE
                    </div>
                </div>

                {/* Alert Card */}
                <div className="bg-[#B91C1C] rounded-xl p-6 shadow-md flex flex-col justify-between text-white relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 text-white/10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <AlertTriangle className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest mb-3 backdrop-blur-sm">
                            <Stethoscope className="w-3 h-3" />
                            AI DIAGNOSIS ACTIVE
                        </div>
                        <h2 className="text-xl font-bold leading-tight mb-2">Possible Cardiac<br/>Arrest Detected</h2>
                        <p className="text-xs text-red-100 font-medium leading-relaxed max-w-[90%]">
                            Irregular arrhythmia pattern identified in Bed 04 (Patient: J. Doe). Threshold exceeded by 42%.
                        </p>
                    </div>
                    <div className="flex gap-3 relative z-10 mt-4">
                        <button className="bg-white text-[#B91C1C] font-bold text-[10px] px-4 py-2.5 rounded uppercase tracking-widest hover:bg-red-50 transition-colors">
                            ACKNOWLEDGE
                        </button>
                        <button className="bg-transparent border border-white/40 hover:bg-white/10 font-bold text-[10px] px-4 py-2.5 rounded uppercase tracking-widest transition-colors">
                            VIEW HISTORY
                        </button>
                    </div>
                </div>
            </div>

            {/* Middle Row: ECG & CCTV */}
            <div className="grid grid-cols-3 gap-6 h-[260px]">
                {/* Real-Time Video Stream */}
                <div className="col-span-2 bg-black rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col group">
                    <div className="absolute top-4 left-4 z-20 flex justify-between items-center w-[calc(100%-2rem)]">
                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded text-white text-[10px] font-bold tracking-widest uppercase border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse"></div>
                            AI EMERGENCY DETECTION STREAM
                        </div>
                    </div>
                    
                    {/* Video Player */}
                    <div className="flex-1 w-full h-full relative z-10 flex items-center justify-center">
                        <video src="/videos/yolo.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        
                        {/* Popup for Ambulance Call */}
                        <div className="absolute bottom-6 right-6 bg-[#B91C1C]/90 backdrop-blur-md border border-red-500 p-4 rounded-xl shadow-2xl z-30 animate-pulse flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white text-[#B91C1C] flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-xs tracking-widest uppercase mb-0.5">EMERGENCY DETECTED</h4>
                                <p className="text-red-100 text-[10px] font-bold tracking-wider">AMBULANCE DISPATCHED</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CCTV Stream */}
                <div className="col-span-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col relative group">
                    <div className="h-[75%] relative overflow-hidden bg-black flex items-center justify-center">
                         <img 
                            src="/images/heart-attack.jpg" 
                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                            alt="Hospital Corridor"
                        />
                        {/* Overlay Badge */}
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-mono text-white border border-white/20 flex items-center gap-1.5 uppercase">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                            REC • CAM 08 - NORTH WING
                        </div>
                        {/* Bounding Box */}
                        <div className="absolute top-[20%] left-[30%] w-[35%] h-[60%] border-2 border-red-500 bg-red-500/10 flex items-start justify-center">
                            <div className="bg-red-500 text-white text-[7px] font-bold px-1.5 py-0.5 uppercase tracking-widest mt-4">
                                COLLAPSE DETECTED
                            </div>
                        </div>
                    </div>
                    <div className="h-[25%] p-4 flex items-center justify-between bg-white">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">North Corridor A3</h4>
                            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Auto-detection: Medical Emergency</p>
                        </div>
                        <Video className="w-5 h-5 text-[#B91C1C]" />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Map & Priorities */}
            <div className="grid grid-cols-3 gap-6 h-[340px]">
                
                {/* Active Ambulance Units Map */}
                <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
                    <div className="p-5 flex justify-between items-center border-b border-slate-100 z-10 bg-white">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#E6F4F1] text-[#064E3B] flex items-center justify-center">
                                <MapPin className="w-3 h-3" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm tracking-wide">Active Ambulance Units</h3>
                        </div>
                        <div className="flex gap-3">
                            <span className="bg-[#E6F4F1] text-[#064E3B] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">2 In Transit</span>
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">4 Standby</span>
                        </div>
                    </div>
                    
                    {/* Simulated Map Background */}
                    <div className="flex-1 bg-[#E2E8F0] relative overflow-hidden group">
                        {/* Map Image (Chicago style) */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-40 mix-blend-multiply filter contrast-125"></div>
                        <div className="absolute inset-0 bg-[#A7F3D0]/20 mix-blend-overlay"></div>
                        
                        {/* Map Line (Route) */}
                        <svg className="absolute inset-0 w-full h-full stroke-[#B91C1C] stroke-2 fill-none drop-shadow-md z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M 45 45 Q 50 60 55 55 T 60 65" strokeDasharray="2,2" className="animate-[dash_5s_linear_infinite]" />
                        </svg>

                        {/* Location Markers */}
                        <div className="absolute top-[40%] left-[42%] bg-white px-2 py-1 rounded shadow-md border border-slate-200 text-[8px] font-bold text-slate-800 z-20 whitespace-nowrap">
                            UNIT 04 - 2.4 MILES
                        </div>
                        <div className="absolute top-[45%] left-[45%] w-8 h-8 bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-20 animate-pulse">
                            <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute top-[65%] left-[60%] w-6 h-6 bg-[#064E3B] rounded-full flex items-center justify-center border-2 border-white shadow-lg z-20">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>

                        {/* ETA Overlay Card */}
                        <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-slate-100 z-30 w-56">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-[#E6F4F1] flex items-center justify-center shrink-0">
                                    <ClockIcon className="w-4 h-4 text-[#064E3B]" />
                                </div>
                                <div>
                                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ESTIMATED ETA</div>
                                    <div className="text-xl font-bold text-slate-800 leading-none">04:12 <span className="text-[10px] text-slate-500">MINS</span></div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-medium border-t border-slate-100 pt-2 mb-1">
                                <span className="text-slate-500">Patient Condition</span>
                                <span className="text-red-600 font-bold uppercase tracking-widest">Critical Stable</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-medium">
                                <span className="text-slate-500">Staff on Board</span>
                                <span className="text-slate-800 font-bold">2 Paramedics</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Priority List */}
                <div className="col-span-1 bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-lg">Unit A Priority</h3>
                        <a href="#" className="text-[#064E3B] text-[10px] font-bold uppercase tracking-widest hover:underline">View All</a>
                    </div>
                    
                    <div className="flex flex-col gap-4 flex-1">
                        {/* Patient 1 */}
                        <div className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 -ml-2 rounded-lg transition-colors">
                            <img src="https://i.pravatar.cc/150?u=a1" alt="Jane" className="w-12 h-12 rounded-full border-2 border-red-500 shadow-sm p-0.5" />
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-800 text-sm">Jane Doe</span>
                                    <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest bg-red-50 px-1.5 py-0.5 rounded">BED 04</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Post-Op Recovery • <span className="text-red-500">High Risk</span></div>
                            </div>
                            <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                        
                        {/* Patient 2 */}
                        <div className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 -ml-2 rounded-lg transition-colors">
                            <img src="https://i.pravatar.cc/150?u=a2" alt="Samuel" className="w-12 h-12 rounded-full border-2 border-[#10B981] shadow-sm p-0.5" />
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-800 text-sm">Samuel Smith</span>
                                    <span className="text-[9px] font-bold text-[#064E3B] uppercase tracking-widest bg-[#E6F4F1] px-1.5 py-0.5 rounded">BED 12</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Observation • Stable</div>
                            </div>
                            <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>

                        {/* Patient 3 */}
                        <div className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 -ml-2 rounded-lg transition-colors">
                            <img src="https://i.pravatar.cc/150?u=a3" alt="Maria" className="w-12 h-12 rounded-full border-2 border-[#10B981] shadow-sm p-0.5" />
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-800 text-sm">Maria Garcia</span>
                                    <span className="text-[9px] font-bold text-[#064E3B] uppercase tracking-widest bg-[#E6F4F1] px-1.5 py-0.5 rounded">BED 09</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5">General Intake • Stable</div>
                            </div>
                            <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                    </div>

                    <button className="w-full mt-4 bg-[#E6F4F1] hover:bg-[#D1EAE3] text-[#064E3B] font-bold py-3 rounded-lg transition-colors text-xs uppercase tracking-widest flex justify-center items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-[#064E3B] text-white flex items-center justify-center text-xs leading-none">+</div>
                        ADMIT NEW PATIENT
                    </button>

                    {/* Floating Action Button */}
                    <button className="absolute -right-4 top-[65%] w-12 h-12 bg-[#B91C1C] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-800 transition-colors hover:scale-110">
                        <MapPin className="w-5 h-5" />
                    </button>
                </div>
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

// Icons
function HeartIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;
}

function WindIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" /><path d="M9.6 4.6A2 2 0 1 1 11 8H2" /><path d="M12.6 19.4A2 2 0 1 0 14 16H2" /></svg>;
}

function ClockIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

function ChevronRightIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;
}
