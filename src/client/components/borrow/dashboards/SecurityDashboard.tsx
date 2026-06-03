import React, { useRef, useState } from 'react';
import {
  Bell, User, LayoutDashboard, AlertTriangle, Map,
  Settings, Camera, Users, Target, Activity, ShieldAlert, CheckCircle2, ChevronRight, Home,
  ScanEye, Upload, Play, Loader2, Video
} from 'lucide-react';
import { hasLoadedYoloPersonModel, loadYoloPersonModel, loadYoloPersonModelFromUrl, runYoloPersonDetection } from '../../../ml/yoloPersonModel';
import type { PersonDetectionResult } from '../../../ml/yoloPersonModel';
import { TwilioAlertSetup, loadAlertConfig, type AlertConfig } from '../../TwilioAlertSetup';

const REMOTE_MODEL_URL = '/api/models/person-coco/model.onnx';

export default function SecurityDashboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);
  const [modelPickerResult, setModelPickerResult] = useState<'success' | 'error' | null>(null);
  const [modelPickerMessage, setModelPickerMessage] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [detectionResult, setDetectionResult] = useState<PersonDetectionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [alertSetupOpen, setAlertSetupOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(() => loadAlertConfig());

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (uploadedVideoUrl) URL.revokeObjectURL(uploadedVideoUrl);
    setUploadedVideoUrl(URL.createObjectURL(file));
    setDetectionResult(null);
  }

  async function handleLoadRemote() {
    setModelPickerResult(null); setModelPickerMessage(''); setDownloadPercent(0);
    try {
      await loadYoloPersonModelFromUrl(REMOTE_MODEL_URL, (pct) => {
        setDownloadPercent(pct);
        setModelPickerMessage(pct < 100 ? `Downloading… ${pct}%` : 'Compiling model…');
      });
      setDownloadPercent(null); setModelName('COCO Person YOLO (HuggingFace)');
      setModelPickerResult('success'); setModelPickerMessage('Model loaded successfully.');
      setTimeout(() => setShowModelPicker(false), 1200);
    } catch (err) {
      setDownloadPercent(null);
      const detail = err instanceof Error ? err.message : String(err);
      setModelPickerResult('error'); setModelPickerMessage(`Model did not load: ${detail}`);
    }
  }

  async function handleLocalModelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setModelPickerResult(null); setModelPickerMessage('Reading file…'); setDownloadPercent(50);
    try {
      await loadYoloPersonModel(file);
      setDownloadPercent(null); setModelName(file.name);
      setModelPickerResult('success'); setModelPickerMessage('Model loaded successfully.');
      setTimeout(() => setShowModelPicker(false), 1200);
    } catch (err) {
      setDownloadPercent(null);
      const detail = err instanceof Error ? err.message : String(err);
      setModelPickerResult('error'); setModelPickerMessage(`Model did not load: ${detail}`);
    }
  }

  async function handleRunDetection() {
    if (!videoRef.current || !hasLoadedYoloPersonModel()) return;
    setIsRunning(true);
    try {
      const result = await runYoloPersonDetection(videoRef.current);
      setDetectionResult(result);
    } catch { /* ignore */ }
    setIsRunning(false);
  }

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
            DASHBOARD
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-semibold text-sm">
            <Camera className="w-5 h-5" />
            LIVE FEED
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-semibold text-sm">
            <AlertTriangle className="w-5 h-5" />
            INCIDENTS
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-semibold text-sm">
            <Map className="w-5 h-5" />
            MAP
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-semibold text-sm">
            <Users className="w-5 h-5" />
            TEAMS
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-semibold text-sm mt-8">
            <Settings className="w-5 h-5" />
            SETTINGS
          </a>
        </nav>
        
        {/* AI Model Panel */}
        <div className="border-t border-slate-800/50 px-4 py-4">
          <div className="text-[9px] font-bold tracking-widest text-[#38BDF8]/70 uppercase mb-3 flex items-center gap-2">
            <ScanEye className="w-3 h-3" /> AI — Person/Intrusion
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${modelName ? 'bg-[#38BDF8]' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] text-slate-500 truncate">{modelName || 'No model loaded'}</span>
          </div>
          {downloadPercent !== null ? (
            <div className="mb-3">
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-[#38BDF8] transition-all duration-300" style={{ width: `${downloadPercent}%` }}></div>
              </div>
              <span className="text-[10px] text-slate-600">{modelPickerMessage}</span>
            </div>
          ) : null}
          {detectionResult && downloadPercent === null ? (
            <div className={`rounded-lg p-2 mb-3 ${detectionResult.hasPerson ? 'bg-red-900/30 border border-red-800/50' : 'bg-slate-800/50 border border-slate-700/50'}`}>
              <div className={`text-[11px] font-bold ${detectionResult.hasPerson ? 'text-red-400' : 'text-slate-400'}`}>
                {detectionResult.hasPerson ? `⚠ ${detectionResult.count} person(s) detected` : '✓ No intrusion'}
              </div>
              {detectionResult.topDetection ? (
                <div className="text-[10px] text-slate-600">{Math.round(detectionResult.topDetection.confidence * 100)}% confidence</div>
              ) : null}
            </div>
          ) : null}
          {downloadPercent === null ? (
            <div className="flex flex-col gap-1.5">
              <button onClick={() => { setModelPickerResult(null); setModelPickerMessage(''); setShowModelPicker(true); }}
                className="text-[10px] font-bold py-2 px-3 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all text-left flex items-center gap-2">
                <Upload className="w-3 h-3" />{modelName ? 'Change model' : 'Load model'}
              </button>
              <label className="text-[10px] font-bold py-2 px-3 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer flex items-center gap-2">
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                <Video className="w-3 h-3" />{uploadedVideoUrl ? 'Change video' : 'Upload video'}
              </label>
              <button onClick={handleRunDetection} disabled={!modelName || isRunning}
                className="text-[10px] font-bold py-2 px-3 rounded bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">
                {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                {isRunning ? 'Detecting…' : 'Run detection'}
              </button>
            </div>
          ) : null}
        </div>

        <div className="px-4 pb-8 flex flex-col gap-4">
            <button className="w-full bg-[#BE123C] hover:bg-[#E11D48] text-white font-bold py-3.5 rounded-md shadow-[0_0_20px_rgba(190,18,60,0.4)] transition-all uppercase tracking-widest text-xs">
                Initiate Lockdown
            </button>
            <div className="flex flex-col gap-3 mt-4 px-4">
                <a href="#" className="flex items-center gap-3 text-xs font-semibold text-slate-500 hover:text-slate-300 uppercase tracking-widest">
                    <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[8px]">?</span>
                    Support
                </a>
                <a href="#" className="flex items-center gap-3 text-xs font-semibold text-slate-500 hover:text-slate-300 uppercase tracking-widest">
                    <Activity className="w-4 h-4" />
                    System Log
                </a>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Top Navigation */}
        <header className="h-20 flex items-center justify-between px-8 flex-shrink-0 border-b border-slate-800/50 bg-[#070B14]/80 backdrop-blur-md">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#0EA5E9] shadow-[0_0_8px_#0EA5E9]"></div>
                 <span className="text-[#0EA5E9] text-xs font-bold tracking-widest uppercase">Surveillance Active</span>
             </div>
             <div className="text-slate-400 text-xs font-semibold tracking-widest uppercase">
                 Threat Level: <span className="text-slate-300">Low</span>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-slate-200 transition-colors" onClick={() => setAlertSetupOpen(true)} title="Alert notifications">
              <Bell className="w-5 h-5" />
              {alertConfig?.enabled ? <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full"></span> : null}
            </button>
            <button className="relative text-slate-400 hover:text-slate-200 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </button>
            <button className="relative text-slate-400 hover:text-slate-200 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center overflow-hidden">
               <img src="https://ui-avatars.com/api/?name=Agent&background=0f172a&color=fff" alt="User" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-4 gap-6">
                
                {/* Card 1 */}
                <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex flex-col justify-between shadow-lg h-32 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Suspicious Activity</span>
                        <BarChartIcon className="w-4 h-4 text-[#38BDF8]" />
                    </div>
                    <div className="flex items-end gap-3 z-10">
                        <span className="text-4xl font-bold text-white">78%</span>
                        <span className="text-xs font-bold text-[#EF4444] mb-1">+12%</span>
                    </div>
                    {/* decorative line */}
                    <div className="absolute bottom-4 left-5 right-5 h-1 bg-slate-800 rounded-full">
                        <div className="h-full bg-slate-700 w-3/4 rounded-full"></div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex flex-col justify-between shadow-lg h-32 relative">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">People Count</span>
                        <Users className="w-4 h-4 text-[#818CF8]" />
                    </div>
                    <div className="flex items-end gap-3 z-10">
                        <span className="text-4xl font-bold text-white">15</span>
                        <span className="text-xs font-bold text-[#38BDF8] mb-1">Normal</span>
                    </div>
                     <div className="absolute bottom-4 left-5 right-5 flex gap-1">
                        <div className="h-1 bg-[#818CF8] w-1/4 rounded-full"></div>
                        <div className="h-1 bg-[#818CF8] w-1/4 rounded-full"></div>
                        <div className="h-1 bg-slate-800 w-1/4 rounded-full"></div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex flex-col justify-between shadow-lg h-32 relative">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Incidents Today</span>
                        <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                    </div>
                    <div className="flex items-end gap-3 z-10">
                        <span className="text-4xl font-bold text-white">4</span>
                        <span className="text-xs font-semibold text-slate-500 mb-1">Last: 12m ago</span>
                    </div>
                    <div className="absolute bottom-4 left-5 right-5 flex gap-1">
                        <div className="h-1 bg-[#EF4444] w-1/5 rounded-full"></div>
                        <div className="h-1 bg-[#EF4444] w-1/5 rounded-full"></div>
                        <div className="h-1 bg-[#EF4444] w-1/5 rounded-full"></div>
                        <div className="h-1 bg-[#EF4444] w-1/5 rounded-full"></div>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex flex-col justify-between shadow-lg h-32 relative">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">AI Confidence</span>
                        <Settings className="w-4 h-4 text-[#38BDF8]" />
                    </div>
                    <div className="flex items-end gap-3 z-10">
                        <span className="text-4xl font-bold text-white">89%</span>
                        <span className="text-xs font-bold text-[#38BDF8] mb-1">Optimal</span>
                    </div>
                    <div className="absolute bottom-4 left-5 right-5 h-1 bg-slate-800 rounded-full">
                        <div className="h-full bg-[#38BDF8] w-[89%] rounded-full shadow-[0_0_10px_#38BDF8]"></div>
                    </div>
                </div>

            </div>

            {/* Main Video & Logs Grid */}
            <div className="flex gap-6 h-[600px]">
                
                {/* Left Side: Video + Bottom Alert */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Video Feed */}
                    <div className="flex-1 bg-black rounded-xl border border-slate-800 relative overflow-hidden group">
                        <video
                            ref={videoRef}
                            src={uploadedVideoUrl || "/videos/intrusion.mp4"}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover grayscale opacity-80 mix-blend-screen"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        
                        {/* Status Overlay */}
                        <div className="absolute bottom-6 left-6 flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-[#EF4444] animate-pulse"></div>
                            <span className="text-white font-bold tracking-widest uppercase text-xs">Live Feed: Zone B-04</span>
                            <span className="text-slate-400 text-xs ml-2">REC: 02:15:48</span>
                        </div>

                        {/* Controls Overlay */}
                        <div className="absolute bottom-6 right-6 flex items-center gap-2">
                            <button className="w-10 h-10 rounded bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-800">
                                <SearchIcon className="w-4 h-4" />
                            </button>
                            <button className="w-10 h-10 rounded bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-800">
                                <MaximizeIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* AI Bounding Box */}
                        <div className="absolute top-[30%] left-[45%] w-32 h-64 border-2 border-[#EF4444] bg-[#EF4444]/10 shadow-[0_0_20px_rgba(239,68,68,0.2)] flex flex-col justify-between">
                            <div className="bg-[#EF4444] text-white text-[10px] font-bold p-1.5 uppercase tracking-wider">
                                Suspect ID:<br/>4921 | Risk:<br/>High
                            </div>
                            <div className="bg-[#38BDF8] text-slate-900 text-[10px] font-bold p-1.5 uppercase tracking-wider self-end -mr-24 mb-16 max-w-[100px]">
                                Object:<br/>Laptop |<br/>Status:<br/>Removed
                            </div>
                        </div>
                    </div>

                    {/* Bottom Alert Card */}
                    <div className="bg-[#0F1629] rounded-xl border border-slate-800 shadow-[0_0_30px_rgba(239,68,68,0.05)] p-6 relative overflow-hidden group">
                         {/* Subtle red glow border on hover */}
                         <div className="absolute inset-0 border border-[#EF4444]/0 group-hover:border-[#EF4444]/30 rounded-xl transition-colors duration-500 pointer-events-none"></div>
                         
                         <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                    <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-white font-bold tracking-wide text-lg leading-tight uppercase">
                                        Possible<br/>Theft<br/>Detected
                                    </h2>
                                    <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">
                                        Automated AI Trigger: High-Risk Movement Pattern in Zone B
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="bg-[#38BDF8] hover:bg-[#0EA5E9] text-slate-900 font-bold px-6 py-3 rounded shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all uppercase tracking-widest text-xs">
                                    Alert Security
                                </button>
                                <button className="bg-transparent border border-[#38BDF8]/50 text-[#38BDF8] hover:bg-[#38BDF8]/10 font-bold px-6 py-3 rounded transition-all uppercase tracking-widest text-xs">
                                    Track Suspect
                                </button>
                                <button className="bg-transparent border border-slate-700 text-slate-400 hover:text-slate-200 font-bold px-6 py-3 rounded transition-all uppercase tracking-widest text-xs">
                                    Log
                                </button>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Right Side: Map & Logs */}
                <div className="w-[380px] flex flex-col gap-6">
                    
                    {/* Suspect Movement Map */}
                    <div className="bg-[#111827] rounded-xl border border-slate-800 p-5 flex flex-col h-[280px]">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-bold tracking-widest text-slate-300 uppercase">Suspect Movement Map</h3>
                        </div>
                        <div className="flex-1 bg-[#0A0F1A] border border-slate-800 rounded-lg relative overflow-hidden">
                            {/* Dark Grid Background */}
                            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            
                            {/* Zones */}
                            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 p-4 gap-4">
                                <div className="flex items-center justify-center text-[10px] font-bold text-slate-600 tracking-widest">ZONE A</div>
                                <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[10px] font-bold text-[#EF4444] tracking-widest">ZONE B</div>
                                <div className="flex items-center justify-center text-[10px] font-bold text-slate-600 tracking-widest">ZONE C</div>
                                <div className="flex items-center justify-center text-[10px] font-bold text-slate-600 tracking-widest">ZONE D</div>
                            </div>

                            {/* Movement Line */}
                            <svg className="absolute inset-0 w-full h-full stroke-[#818CF8] stroke-2 fill-none drop-shadow-[0_0_5px_rgba(129,140,248,0.8)] z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <circle cx="25" cy="25" r="2" fill="#818CF8" />
                                <path d="M 25 25 L 75 25 L 85 75" />
                                <circle cx="85" cy="75" r="2" fill="#818CF8" className="animate-pulse" />
                            </svg>

                            <div className="absolute bottom-2 right-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest z-20 bg-[#0A0F1A]/80 px-2 py-1 rounded">
                                Current Location: Zone B-04
                            </div>
                        </div>
                    </div>

                    {/* Action Log */}
                    <div className="bg-[#111827] rounded-xl border border-slate-800 p-5 flex-1 flex flex-col relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-6">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-bold tracking-widest text-slate-300 uppercase">Action Log</h3>
                        </div>

                        {/* Log Timeline */}
                        <div className="flex-1 overflow-y-auto pr-2 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[7px] top-2 bottom-0 w-px bg-slate-800"></div>

                            <div className="flex flex-col gap-6">
                                {/* Log Item 1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]"></div>
                                    <div className="text-[10px] font-bold text-slate-500 mb-1">02:15:45</div>
                                    <h4 className="text-xs font-bold text-slate-200 mb-1">High-Risk Movement Pattern</h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">Suspect moving rapidly toward Exit 4 while concealing object.</p>
                                </div>

                                {/* Log Item 2 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-[#818CF8] shadow-[0_0_8px_#818CF8]"></div>
                                    <div className="text-[10px] font-bold text-slate-500 mb-1">02:15:30</div>
                                    <h4 className="text-xs font-bold text-slate-200 mb-1">Restricted Object Access</h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">RFID mismatch on laptop terminal 04. Object removed.</p>
                                </div>

                                {/* Log Item 3 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-slate-600"></div>
                                    <div className="text-[10px] font-bold text-slate-500 mb-1">02:14:10</div>
                                    <h4 className="text-xs font-bold text-slate-200 mb-1">Subject Enters Zone B</h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">Normal entry via Station 2 (visitor status).</p>
                                </div>

                                {/* Log Item 4 */}
                                <div className="relative pl-6 pb-2">
                                    <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-slate-600"></div>
                                    <div className="text-[10px] font-bold text-slate-500 mb-1">02:10:05</div>
                                    <h4 className="text-xs font-bold text-slate-200 mb-1">Gate Entrance Authorized</h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">Main security gate authentication successful.</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating Status Badges inside Action Log */}
                        <div className="absolute bottom-16 right-4 left-4 flex justify-between gap-2 pointer-events-none">
                            <div className="bg-[#0A0F1A]/90 backdrop-blur border border-slate-700 rounded-full px-3 py-1.5 flex items-center gap-2 text-[8px] font-bold tracking-widest uppercase text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></div>
                                Network: Latency 14ms
                            </div>
                            <div className="bg-[#0A0F1A]/90 backdrop-blur border border-slate-700 rounded-full px-3 py-1.5 flex items-center gap-2 text-[8px] font-bold tracking-widest uppercase text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#818CF8]"></div>
                                AI Engine: Stable
                            </div>
                        </div>

                        <button className="w-full mt-4 py-3 border border-slate-800 rounded text-[10px] font-bold tracking-widest uppercase text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
                            View Full System Log
                        </button>
                    </div>

                </div>
            </div>

          </div>
        </main>

      </div>

      <TwilioAlertSetup open={alertSetupOpen} onClose={() => setAlertSetupOpen(false)} onSave={(cfg) => setAlertConfig(cfg)} current={alertConfig} />

      {/* Model picker modal */}
      {showModelPicker ? (
        <div className="model-picker" onClick={(e) => { if (e.target === e.currentTarget && downloadPercent === null) setShowModelPicker(false); }}>
          <div className="model-picker__dialog">
            {modelPickerResult === null && downloadPercent === null ? (
              <>
                <p className="model-picker__title">Load Person/Intrusion Model</p>
                <p className="model-picker__label">Choose how to load the YOLO COCO person ONNX model.</p>
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

// Small missing lucide icons helper
function BarChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function MaximizeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}
