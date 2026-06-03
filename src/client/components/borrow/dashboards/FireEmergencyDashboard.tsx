import React, { useRef, useState } from 'react';
import {
  Shield, Bell, User, LayoutDashboard, AlertTriangle, Video, Map,
  BarChart, Settings, LifeBuoy, ScrollText, EyeOff, AlertCircle,
  Users, Activity, ScanLine, Lock, Star, Navigation2, Info, Phone,
  Video as VideoIcon, ArrowUpRight, ArrowRight, Mic, PersonStanding, Home,
  ScanEye, Upload, Play, Loader2
} from 'lucide-react';
import { hasLoadedYoloHazardModel, loadYoloHazardModel, loadYoloHazardModelFromUrl, runYoloHazardDetection } from '../../../ml/yoloHazardModel';
import type { CctvDetectionResult } from '../../../../shared/cctvDetection';

const REMOTE_MODEL_URL = 'https://huggingface.co/Snaptrope/resq/resolve/main/resq-fire-smoke-yolo.onnx';

export default function FireEmergencyDashboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);
  const [modelPickerResult, setModelPickerResult] = useState<'success' | 'error' | null>(null);
  const [modelPickerMessage, setModelPickerMessage] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [detectionResult, setDetectionResult] = useState<CctvDetectionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadedVideoUrl) URL.revokeObjectURL(uploadedVideoUrl);
    setUploadedVideoUrl(URL.createObjectURL(file));
    setDetectionResult(null);
  }

  async function handleLoadRemote() {
    setModelPickerResult(null); setModelPickerMessage(''); setDownloadPercent(0);
    try {
      await loadYoloHazardModelFromUrl(REMOTE_MODEL_URL, (pct) => {
        setDownloadPercent(pct);
        setModelPickerMessage(pct < 100 ? `Downloading… ${pct}%` : 'Compiling model…');
      });
      setDownloadPercent(null); setModelName('Fire/Smoke YOLO (HuggingFace)');
      setModelPickerResult('success'); setModelPickerMessage('Model loaded successfully.');
      setTimeout(() => setShowModelPicker(false), 1200);
    } catch (err) {
      setDownloadPercent(null);
      setModelPickerResult('error');
      setModelPickerMessage('Model did not load. Check connection or upload manually.');
    }
  }

  async function handleLocalModelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setModelPickerResult(null); setModelPickerMessage('Reading file…'); setDownloadPercent(50);
    try {
      await loadYoloHazardModel(file);
      setDownloadPercent(null); setModelName(file.name);
      setModelPickerResult('success'); setModelPickerMessage('Model loaded successfully.');
      setTimeout(() => setShowModelPicker(false), 1200);
    } catch {
      setDownloadPercent(null);
      setModelPickerResult('error'); setModelPickerMessage('Model did not load. Use a valid YOLO ONNX file.');
    }
  }

  async function handleRunDetection() {
    if (!videoRef.current || !hasLoadedYoloHazardModel()) return;
    setIsRunning(true);
    try {
      const result = await runYoloHazardDetection(videoRef.current);
      setDetectionResult(result);
    } catch { /* ignore */ }
    setIsRunning(false);
  }

  return (
    <div className="flex h-screen w-screen bg-[#F4F6F5] font-paragraph text-[#2A4B41] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2A4B41] text-white flex flex-col h-full flex-shrink-0 z-20 shadow-xl">
        {/* Sidebar Header */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-[#1A332B] p-2 rounded-lg">
            <Shield className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Command Center</h1>
            <p className="text-[10px] text-[#6BA88D] font-bold tracking-widest uppercase mt-0.5">System Online</p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto">
          <a href="/city" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1A332B] text-yellow-500 font-bold border-l-4 border-yellow-500">
            <Home className="w-5 h-5" />
            Go Home
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors font-semibold">
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors font-semibold">
            <AlertTriangle className="w-5 h-5" />
            Incidents
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors font-semibold">
            <Video className="w-5 h-5" />
            Live Feed
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors font-semibold">
            <Map className="w-5 h-5" />
            Map
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors font-semibold">
            <BarChart className="w-5 h-5" />
            Analytics
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors font-semibold">
            <Settings className="w-5 h-5" />
            Settings
          </a>
        </nav>

        {/* AI Model Panel */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="text-[9px] font-bold tracking-widest text-[#6BA88D] uppercase mb-3 flex items-center gap-2">
            <ScanEye className="w-3 h-3" /> AI — Fire/Smoke
          </div>
          {/* Status */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${modelName ? 'bg-emerald-400' : 'bg-gray-600'}`}></div>
            <span className="text-[10px] text-white/50 truncate">{modelName || 'No model loaded'}</span>
          </div>
          {/* Progress */}
          {downloadPercent !== null ? (
            <div className="mb-3">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${downloadPercent}%` }}></div>
              </div>
              <span className="text-[10px] text-white/40">{modelPickerMessage}</span>
            </div>
          ) : null}
          {/* Result */}
          {detectionResult && downloadPercent === null ? (
            <div className={`rounded-lg p-2 mb-3 ${detectionResult.isHazard ? 'bg-red-900/40 border border-red-700/50' : 'bg-emerald-900/40 border border-emerald-700/50'}`}>
              <div className={`text-[11px] font-bold ${detectionResult.isHazard ? 'text-red-400' : 'text-emerald-400'}`}>
                {detectionResult.isHazard ? `⚠ ${detectionResult.label}` : '✓ No hazard'}
              </div>
              {detectionResult.confidence > 0 ? (
                <div className="text-[10px] text-white/40">{Math.round(detectionResult.confidence * 100)}% confidence</div>
              ) : null}
            </div>
          ) : null}
          {/* Buttons */}
          {downloadPercent === null ? (
            <div className="flex flex-col gap-1.5">
              <button onClick={() => { setModelPickerResult(null); setModelPickerMessage(''); setShowModelPicker(true); }}
                className="text-[10px] font-bold py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all text-left flex items-center gap-2">
                <Upload className="w-3 h-3" />{modelName ? 'Change model' : 'Load model'}
              </button>
              <label className="text-[10px] font-bold py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-2">
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                <Video className="w-3 h-3" />{uploadedVideoUrl ? 'Change video' : 'Upload video'}
              </label>
              <button onClick={handleRunDetection} disabled={!modelName || isRunning}
                className="text-[10px] font-bold py-2 px-3 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">
                {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                {isRunning ? 'Detecting…' : 'Run detection'}
              </button>
            </div>
          ) : null}
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 pt-0 flex flex-col gap-4">
          <button className="w-full bg-[#E53E3E] text-white font-bold py-4 rounded-xl text-sm uppercase tracking-wider hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
            Evacuation Mode
          </button>
          
          <div className="flex flex-col gap-3 mt-4 px-2">
            <a href="#" className="flex items-center gap-3 text-white/50 hover:text-white/80 transition-colors text-sm font-medium">
              <LifeBuoy className="w-4 h-4" />
              Support
            </a>
            <a href="#" className="flex items-center gap-3 text-white/50 hover:text-white/80 transition-colors text-sm font-medium">
              <ScrollText className="w-4 h-4" />
              Logs
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Dot Pattern Background Overlay */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#C5D0CB 2px, transparent 2px)', backgroundSize: '30px 30px', opacity: 0.5 }}></div>
        
        {/* Top Navigation */}
        <header className="h-20 bg-[#355A4F] flex items-center justify-between px-8 text-white z-10 flex-shrink-0 shadow-md">
          <div className="flex items-center gap-12">
            <div className="text-3xl font-bold tracking-tight text-emerald-300">ResQ</div>
            <nav className="flex gap-8 text-[11px] font-bold tracking-widest uppercase">
              <a href="#" className="text-emerald-300 border-b-[3px] border-emerald-300 pb-1">About Us</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors pb-1">Solutions</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors pb-1">Platform</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors pb-1">Dashboards</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors pb-1">Safety AI</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors pb-1">Contact & Testimonials</a>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-white hover:text-emerald-300 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#355A4F]"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2A4B41] rounded-full flex items-center justify-center border-2 border-emerald-400">
                <User className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="flex flex-col">
                <div className="font-bold text-xs tracking-wider uppercase text-white">Duty Officer</div>
                <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">Sector 7-G</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 z-10 relative">
          <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Visibility</div>
                  <div className="text-3xl font-bold text-red-600">LOW</div>
                </div>
                <div className="w-14 h-14 bg-[#FFF5F5] text-red-500 rounded-2xl flex items-center justify-center">
                  <EyeOff className="w-7 h-7" />
                </div>
              </div>
              
              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Risk Level</div>
                  <div className="text-3xl font-bold text-red-600">HIGH</div>
                </div>
                <div className="w-14 h-14 bg-[#FFF5F5] text-red-500 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-7 h-7" />
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">People Count</div>
                  <div className="text-3xl font-bold text-[#1A332B]">12</div>
                </div>
                <div className="w-14 h-14 bg-[#F0F4F2] text-[#2A4B41] rounded-2xl flex items-center justify-center">
                  <Users className="w-7 h-7" />
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">AI Confidence</div>
                  <div className="text-3xl font-bold text-[#1A332B]">93%</div>
                </div>
                <div className="w-14 h-14 bg-[#E2ECE8] text-[#2A4B41] rounded-2xl flex items-center justify-center">
                  <Settings className="w-7 h-7" />
                </div>
              </div>
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-3 gap-6 h-[400px]">
              {/* Live Feed */}
              <div className="col-span-2 bg-[#1C1A1E] rounded-3xl overflow-hidden shadow-lg relative flex flex-col h-full">
                <div className="px-6 py-4 flex items-center justify-between z-10 absolute top-0 w-full bg-gradient-to-b from-black/80 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-white/30 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-white font-bold tracking-widest uppercase text-sm">Live Feed: Corridor C-12</span>
                  </div>
                  <div className="flex gap-6 font-mono text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-emerald-400">FPS: 60.2</span>
                    <span className="text-emerald-400">Latency: 12ms</span>
                    <span className="text-red-500">Warning: Hazard Detected</span>
                  </div>
                </div>
                
                {/* Live Feed Video */}
                <div className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden">
                  <video
                    ref={videoRef}
                    src={uploadedVideoUrl || "https://res.cloudinary.com/dbnnd43kl/video/upload/v1777321354/From_KlickPin_CF_Engine_55_57_Arrived___New_photo_download_Scammer_pictures_Real_life_video_-_Pin-1086141635137543474_uvuaig.mp4"}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-80"
                  />
                  {/* Subtle scanline overlay */}
                  <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay"></div>
                  
                  <div className="absolute inset-0 opacity-30">
                    {/* Simulated text data overlay on screen */}
                    <div className="absolute top-1/4 left-1/4 font-mono text-[8px] text-white/50 w-64 break-words leading-tight">
                      A2 9F B8 C1 00 23 FF AA 11 9B C3 4A <br/>
                      01 00 00 00 11 22 33 44 55 66 77 88
                    </div>
                    <div className="absolute top-3/4 left-1/3 font-mono text-[8px] text-white/50 w-64 break-words leading-tight">
                      INIT SCAN SEQUENCE... <br/>
                      BUFFER 0x8F9A LOADED
                    </div>
                  </div>
                  
                  {/* Bounding box */}
                  <div className="relative w-1/2 h-1/2 border-2 border-yellow-400 -mt-10 -ml-10 z-10 bg-yellow-400/5">
                    <div className="absolute -top-6 left-[-2px] bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 uppercase font-mono tracking-wider">
                      Hazard: Smoke_Detection_04
                    </div>
                    <div className="absolute bottom-2 right-2 text-yellow-400 text-[10px] font-bold uppercase font-mono tracking-wider">
                      Density: 84%
                    </div>
                    
                    {/* Inner tracking lines */}
                    <div className="absolute top-1/2 left-1/4 w-32 h-px bg-white/20"></div>
                    <div className="absolute top-1/4 left-1/2 w-px h-16 bg-white/20"></div>
                    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 ml-4 text-white/50 font-mono text-[10px]">13 A&mdash;06D83 C- 6088 D- 868</div>
                  </div>

                  {/* Scanning circle */}
                  <div className="absolute right-16 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-red-500/30 flex items-center justify-center z-10">
                    <div className="w-28 h-28 rounded-full border border-red-500 border-l-transparent border-t-transparent animate-[spin_3s_linear_infinite]"></div>
                    <span className="absolute text-red-500 text-[8px] font-mono tracking-widest animate-pulse">SCANNING...</span>
                  </div>
                </div>

                {/* Visibility Range Badge */}
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md rounded-xl px-5 py-3 pr-16 z-20 shadow-xl border border-white/40">
                  <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1">Visibility Range</div>
                  <div className="text-4xl font-bold text-yellow-500 leading-none">1.5m</div>
                </div>
              </div>

              {/* Active Alerts */}
              <div className="col-span-1 flex flex-col bg-white rounded-3xl p-6 shadow-sm border border-transparent h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[11px] font-bold tracking-widest text-red-700 uppercase">Active Alerts</h2>
                  <span className="bg-red-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider">1 NEW</span>
                </div>
                
                <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                  {/* Alert Card 1 - High Priority */}
                  <div className="bg-[#FFF5F5] border-2 border-red-200 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-[#F6DFDF] text-red-500 rounded-xl flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold text-red-700 text-lg leading-tight">Hazard Detected</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-1 absolute top-5 right-5">12:04:12</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed mt-2 pl-16">
                      Smoke and gas anomalies detected in Ventilation Shaft C-12. Probability: <span className="font-bold">98%.</span>
                    </p>
                    <div className="flex gap-3 mt-5 pl-16">
                      <button className="bg-red-700 text-white font-bold py-2 px-6 rounded-full text-xs uppercase tracking-wider hover:bg-red-800 transition-colors">Action</button>
                      <button className="bg-transparent border-2 border-red-200 text-gray-500 font-bold py-2 px-6 rounded-full text-xs uppercase tracking-wider hover:bg-red-50 transition-colors">Dismiss</button>
                    </div>
                  </div>

                  {/* Alert Card 2 - Info */}
                  <div className="bg-[#F8F9FA] border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-[#EAECEF] text-gray-500 rounded-xl flex items-center justify-center shrink-0">
                          <Activity className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold text-[#1A332B] text-lg leading-tight">Sensor<br/>Recalibration</div>
                          <div className="text-[10px] text-gray-400 font-mono absolute top-[11.5rem] right-10">11:58:04</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-500 font-medium leading-relaxed mt-2 pl-16">
                      Zone 4 Thermal Sensors auto-recalibrated following ambient temperature shift.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-3 gap-6 h-[400px]">
              
              {/* Building Layout */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-transparent flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[11px] font-bold tracking-widest text-[#1A332B] uppercase">Building Layout: Level 4</h2>
                  <button className="text-[10px] font-bold text-[#2A4B41] flex items-center gap-1 hover:opacity-70 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-full">
                    <ScanLine className="w-3 h-3" /> Enlarge
                  </button>
                </div>
                
                <div className="bg-[#D3DDDB] rounded-2xl flex-1 relative overflow-hidden flex items-center justify-center border border-gray-200">
                  {/* Abstract Building Layout */}
                  <div className="w-full h-full absolute inset-0 p-8 flex items-center justify-center">
                    <div className="w-full h-full max-w-[280px] max-h-[220px] border border-gray-400/20 flex relative">
                      <div className="w-[35%] h-full bg-[#E8B5B5] border-r border-gray-400/20"></div>
                      <div className="w-[65%] h-full bg-[#C1D4CD] relative overflow-hidden flex flex-col justify-end pb-8">
                         <svg className="absolute w-full h-full inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                           <path d="M 0 50 Q 50 100 100 20" fill="none" stroke="#2E7D32" strokeWidth="1" />
                           <circle cx="50" cy="75" r="3" fill="#FACC15" stroke="#FFFFFF" strokeWidth="0.5" />
                         </svg>
                      </div>
                      
                      {/* Top wireframe globe like detail */}
                      <svg className="absolute w-full h-full inset-0 pointer-events-none opacity-20" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r="45" fill="none" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="1 2" />
                         <ellipse cx="50" cy="50" rx="45" ry="15" fill="none" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="1 2" />
                         <ellipse cx="50" cy="50" rx="15" ry="45" fill="none" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="1 2" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Legends */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className="bg-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm text-[9px] font-bold uppercase tracking-wider text-gray-800">
                      <div className="w-3 h-3 bg-[#E8B5B5] rounded-[3px]"></div>
                      Restricted
                    </div>
                    <div className="bg-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm text-[9px] font-bold uppercase tracking-wider text-gray-800">
                      <div className="w-3 h-3 bg-[#C1D4CD] rounded-[3px]"></div>
                      Safe Zone
                    </div>
                  </div>
                  
                  {/* Safe Route Badge */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg border border-gray-100">
                    <Navigation2 className="w-5 h-5 text-emerald-700" />
                    <div className="text-[9px] font-bold text-[#1A332B] leading-tight uppercase tracking-widest">
                      Safe Route<br/>Suggested
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Center */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-transparent flex flex-col h-full">
                <h2 className="text-[11px] font-bold tracking-widest text-[#1A332B] uppercase mb-6">Action Center</h2>
                
                <div className="flex flex-col gap-3 flex-1">
                  <button className="flex items-center justify-between border-2 border-red-600 rounded-2xl px-6 py-4 hover:bg-red-50 transition-colors group">
                    <span className="font-bold text-red-600 uppercase tracking-widest text-xs">Restrict Area 4-C</span>
                    <Lock className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                  </button>
                  
                  <button className="flex items-center justify-between bg-[#FCE38A] border-2 border-transparent rounded-2xl px-6 py-4 hover:bg-[#F3D675] transition-colors group shadow-sm">
                    <span className="font-bold text-amber-600 uppercase tracking-widest text-xs">Notify Authorities</span>
                    <Star className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                  </button>
                  
                  <button className="flex items-center justify-between border-2 border-[#2A4B41] rounded-2xl px-6 py-4 hover:bg-emerald-50 transition-colors group">
                    <span className="font-bold text-[#2A4B41] uppercase tracking-widest text-xs">Guide Evacuation</span>
                    <PersonStanding className="w-5 h-5 text-[#2A4B41] group-hover:scale-110 transition-transform" />
                  </button>
                </div>

                <div className="bg-[#F4F6F5] rounded-2xl p-5 mt-4 border border-gray-100 flex gap-4 items-start">
                  <div className="w-5 h-5 shrink-0 mt-0.5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <Info className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-800 uppercase tracking-widest mb-1.5">System Status</div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      AI threat detection protocols are currently operating at peak efficiency. All protocols active.
                    </p>
                  </div>
                </div>
              </div>

              {/* Staff & Routing */}
              <div className="flex flex-col gap-6 h-full">
                
                {/* Staff Connectivity */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-transparent h-[45%]">
                  <h2 className="text-[11px] font-bold tracking-widest text-[#1A332B] uppercase mb-4">Staff Connectivity</h2>
                  <div className="flex flex-col justify-around h-full pb-4">
                    {/* Staff 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src="https://ui-avatars.com/api/?name=Captain+Miller&background=1C352D&color=fff&rounded=true" alt="Captain Miller" className="w-12 h-12 rounded-full border border-gray-100 shadow-sm" />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#1A332B]">Captain Miller</div>
                          <div className="text-[10px] text-gray-500 font-medium mt-1">Ground Team Alpha • <span className="text-emerald-600">Active</span></div>
                        </div>
                      </div>
                      <button className="w-10 h-10 rounded-2xl bg-[#F0F4F2] flex items-center justify-center text-[#2A4B41] hover:bg-[#E2ECE8] transition-colors">
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Staff 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src="https://ui-avatars.com/api/?name=Sgt+Kowalski&background=1C352D&color=fff&rounded=true" alt="Sgt. Kowalski" className="w-12 h-12 rounded-full border border-gray-100 shadow-sm" />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#1A332B]">Sgt. Kowalski</div>
                          <div className="text-[10px] text-gray-500 font-medium mt-1">In Restricted Zone • <span className="text-red-600">Alert</span></div>
                        </div>
                      </div>
                      <button className="w-10 h-10 rounded-2xl bg-[#FFF5F5] flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors">
                        <VideoIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Safe Route Navigation */}
                <div className="bg-[#DFE7E4] rounded-3xl p-6 relative overflow-hidden flex-1 flex flex-col justify-center">
                  <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#C5D0CB 2px, transparent 2px)', backgroundSize: '16px 16px', opacity: 0.6 }}></div>
                  
                  <div className="relative z-10">
                    <h2 className="text-[10px] font-bold tracking-widest text-yellow-600 uppercase mb-6 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-yellow-500 text-white flex items-center justify-center"><ArrowUpRight className="w-3 h-3" /></span> Safe Route Navigation
                    </h2>
                    
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border-2 border-gray-400 flex items-center justify-center text-gray-500 shrink-0">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div className="font-bold text-sm text-[#1A332B]">Exit Stairwell B (80m)</div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border-2 border-yellow-500 flex items-center justify-center text-yellow-600 shrink-0">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                        <div className="font-bold text-sm text-[#1A332B]">External Assembly Point (150m)</div>
                      </div>
                    </div>
                  </div>

                  {/* Mic Button */}
                  <button className="absolute bottom-6 right-6 w-16 h-16 bg-[#17A376] rounded-full shadow-[0_8px_30px_rgb(23,163,118,0.4)] flex items-center justify-center text-white hover:bg-emerald-400 hover:scale-105 transition-all z-10">
                    <Mic className="w-7 h-7" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Model picker modal */}
      {showModelPicker ? (
        <div className="model-picker" onClick={(e) => { if (e.target === e.currentTarget && downloadPercent === null) setShowModelPicker(false); }}>
          <div className="model-picker__dialog">
            {modelPickerResult === null && downloadPercent === null ? (
              <>
                <p className="model-picker__title">Load Fire/Smoke Model</p>
                <p className="model-picker__label">Choose how to load the YOLO fire/smoke ONNX model.</p>
                <div className="model-picker__options">
                  <label className="model-picker__option">
                    <input type="file" accept=".onnx" style={{ display: 'none' }} onChange={handleLocalModelUpload} />
                    <span className="model-picker__btn">Upload local .onnx file</span>
                  </label>
                  <span className="model-picker__divider">or</span>
                  <button className="model-picker__btn model-picker__btn--remote" onClick={handleLoadRemote}>
                    Load from Hugging Face (remote)
                  </button>
                </div>
                <div className="model-picker__footer">
                  <button className="model-picker__cancel" onClick={() => setShowModelPicker(false)}>Cancel</button>
                </div>
              </>
            ) : null}
            {downloadPercent !== null ? (
              <div className="model-picker__loading">
                <p className="model-picker__title">Loading model…</p>
                <div className="model-picker__progress-track">
                  <div className="model-picker__progress-bar" style={{ width: `${downloadPercent}%` }} />
                </div>
                <p className="model-picker__label">{modelPickerMessage}</p>
              </div>
            ) : null}
            {modelPickerResult !== null && downloadPercent === null ? (
              <div className={`model-picker__result model-picker__result--${modelPickerResult}`}>
                <span className="model-picker__result-icon">{modelPickerResult === 'success' ? '✓' : '✕'}</span>
                <p className="model-picker__title">{modelPickerResult === 'success' ? 'Model loaded successfully' : 'Model did not load'}</p>
                <p className="model-picker__label">{modelPickerMessage}</p>
                <div className="model-picker__footer">
                  {modelPickerResult === 'error' ? (
                    <button className="model-picker__btn model-picker__btn--remote" style={{ width: 'auto', padding: '8px 16px' }}
                      onClick={() => { setModelPickerResult(null); setModelPickerMessage(''); }}>Try again</button>
                  ) : null}
                  <button className="model-picker__cancel" onClick={() => { setShowModelPicker(false); setModelPickerResult(null); }}>
                    {modelPickerResult === 'success' ? 'Close' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
