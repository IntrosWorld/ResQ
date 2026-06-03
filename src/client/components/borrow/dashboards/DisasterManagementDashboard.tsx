import React, { useRef, useState } from 'react';
import {
  LayoutDashboard, Video, Map, Users, AlertTriangle,
  Settings, Bell, Search, MapPin, Grid, Shield,
  Plus, Minus, Crosshair, HelpCircle, LogOut,
  Truck, Flame, CheckCircle, Activity,
  ChevronRight, Home,
  ScanEye, Upload, Play, Loader2
} from 'lucide-react';
import { hasLoadedYoloCollapseModel, loadYoloCollapseModel, loadYoloCollapseModelFromUrl, runYoloCollapseDetection } from '../../../ml/yoloCollapseModel';
import type { CctvDetectionResult } from '../../../../shared/cctvDetection';
import { TwilioAlertSetup, loadAlertConfig, type AlertConfig } from '../../TwilioAlertSetup';

const REMOTE_MODEL_URL = '/api/models/fallsafe/model.onnx';

export default function DisasterManagementDashboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [downloadPercent, setDownloadPercent] = useState<number | null>(null);
  const [modelPickerResult, setModelPickerResult] = useState<'success' | 'error' | null>(null);
  const [modelPickerMessage, setModelPickerMessage] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [detectionResult, setDetectionResult] = useState<CctvDetectionResult | null>(null);
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
      await loadYoloCollapseModelFromUrl(REMOTE_MODEL_URL, (pct) => {
        setDownloadPercent(pct);
        setModelPickerMessage(pct < 100 ? `Downloading… ${pct}%` : 'Compiling model…');
      });
      setDownloadPercent(null); setModelName('FallSafe Collapse YOLO (HuggingFace)');
      setModelPickerResult('success'); setModelPickerMessage('Model loaded successfully.');
      setTimeout(() => setShowModelPicker(false), 1200);
    } catch {
      setDownloadPercent(null);
      setModelPickerResult('error'); setModelPickerMessage('Model did not load. Check connection or upload manually.');
    }
  }

  async function handleLocalModelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setModelPickerResult(null); setModelPickerMessage('Reading file…'); setDownloadPercent(50);
    try {
      await loadYoloCollapseModel(file);
      setDownloadPercent(null); setModelName(file.name);
      setModelPickerResult('success'); setModelPickerMessage('Model loaded successfully.');
      setTimeout(() => setShowModelPicker(false), 1200);
    } catch {
      setDownloadPercent(null);
      setModelPickerResult('error'); setModelPickerMessage('Model did not load. Use a valid YOLO ONNX file.');
    }
  }

  async function handleRunDetection() {
    if (!videoRef.current || !hasLoadedYoloCollapseModel()) return;
    setIsRunning(true);
    try {
      const result = await runYoloCollapseDetection(videoRef.current);
      setDetectionResult(result);
    } catch { /* ignore */ }
    setIsRunning(false);
  }
  return (
    <div className="flex h-screen w-screen bg-[#090A0F] font-sans text-white overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 bg-[#0E1015] border-r border-[#1C1F26] flex flex-col h-full flex-shrink-0 z-20">
        {/* Logo Area */}
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-bold text-[#FF9F43] tracking-wide">ResQCrisis</h1>
          <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase mt-1">Incident Command</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 flex flex-col gap-2">
          <a href="/city" className="flex items-center gap-4 px-8 py-4 bg-[#1A1C23] text-[#FF9F43] border-l-2 border-[#FF9F43] font-bold tracking-wider text-xs">
            <Home className="w-5 h-5" />
            GO HOME
          </a>
          <a href="#" className="flex items-center gap-4 px-8 py-4 text-gray-400 hover:text-white transition-colors font-bold tracking-wider text-xs">
            <Grid className="w-5 h-5" />
            DASHBOARD
          </a>
          <a href="#" className="flex items-center gap-4 px-8 py-4 text-gray-400 hover:text-white transition-colors font-bold tracking-wider text-xs">
            <Video className="w-5 h-5" />
            CCTV
          </a>
          <a href="#" className="flex items-center gap-4 px-8 py-4 text-gray-400 hover:text-white transition-colors font-bold tracking-wider text-xs">
            <Map className="w-5 h-5" />
            MAP
          </a>
          <a href="#" className="flex items-center gap-4 px-8 py-4 text-gray-400 hover:text-white transition-colors font-bold tracking-wider text-xs">
            <Users className="w-5 h-5" />
            UNITS
          </a>
          <a href="#" className="flex items-center gap-4 px-8 py-4 text-gray-400 hover:text-white transition-colors font-bold tracking-wider text-xs">
            <AlertTriangle className="w-5 h-5" />
            ALERTS
          </a>
        </nav>

        {/* AI Model Panel */}
        <div className="border-t border-[#1C1F26] px-6 py-4">
          <div className="text-[9px] font-bold tracking-widest text-[#FF9F43]/70 uppercase mb-3 flex items-center gap-2">
            <ScanEye className="w-3 h-3" /> AI — Fall/Collapse
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${modelName ? 'bg-[#FF9F43]' : 'bg-gray-700'}`}></div>
            <span className="text-[10px] text-gray-600 truncate">{modelName || 'No model loaded'}</span>
          </div>
          {/* Compact video preview — only shown when user uploads a video */}
          {uploadedVideoUrl ? (
            <div className="mb-3 rounded-lg overflow-hidden border border-[#1C1F26] bg-black aspect-video">
              <video ref={videoRef} src={uploadedVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90" />
            </div>
          ) : (
            // Hidden video ref for detection even without preview
            <video ref={videoRef} src={uploadedVideoUrl || undefined} muted playsInline style={{ display: 'none' }} />
          )}
          {downloadPercent !== null ? (
            <div className="mb-3">
              <div className="h-1.5 bg-[#1C1F26] rounded-full overflow-hidden mb-1">
                <div className="h-full bg-[#FF9F43] transition-all duration-300" style={{ width: `${downloadPercent}%` }}></div>
              </div>
              <span className="text-[10px] text-gray-600">{modelPickerMessage}</span>
            </div>
          ) : null}
          {detectionResult && downloadPercent === null ? (
            <div className={`rounded-lg p-2 mb-3 ${detectionResult.isHazard ? 'bg-red-900/30 border border-red-800/50' : 'bg-[#16181D] border border-[#1C1F26]'}`}>
              <div className={`text-[11px] font-bold ${detectionResult.isHazard ? 'text-red-400' : 'text-gray-500'}`}>
                {detectionResult.isHazard ? `⚠ ${detectionResult.label}` : '✓ No collapse detected'}
              </div>
              {detectionResult.confidence > 0 ? (
                <div className="text-[10px] text-gray-600">{Math.round(detectionResult.confidence * 100)}% confidence</div>
              ) : null}
            </div>
          ) : null}
          {downloadPercent === null ? (
            <div className="flex flex-col gap-1.5">
              <button onClick={() => { setModelPickerResult(null); setModelPickerMessage(''); setShowModelPicker(true); }}
                className="text-[10px] font-bold py-2 px-3 rounded bg-[#16181D] border border-[#1C1F26] text-gray-500 hover:text-white hover:border-[#FF9F43]/30 transition-all text-left flex items-center gap-2">
                <Upload className="w-3 h-3" />{modelName ? 'Change model' : 'Load model'}
              </button>
              <label className="text-[10px] font-bold py-2 px-3 rounded bg-[#16181D] border border-[#1C1F26] text-gray-500 hover:text-white hover:border-[#FF9F43]/30 transition-all cursor-pointer flex items-center gap-2">
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                <Video className="w-3 h-3" />{uploadedVideoUrl ? 'Change video' : 'Upload video'}
              </label>
              <button onClick={handleRunDetection} disabled={!modelName || !uploadedVideoUrl || isRunning}
                className="text-[10px] font-bold py-2 px-3 rounded bg-[#FF9F43]/10 border border-[#FF9F43]/30 text-[#FF9F43] hover:bg-[#FF9F43]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">
                {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                {isRunning ? 'Detecting…' : 'Run detection'}
              </button>
            </div>
          ) : null}
        </div>

        {/* Bottom Sidebar */}
        <div className="px-8 pb-8 flex flex-col gap-6">
          <button className="w-full bg-[#FF9F43] hover:bg-[#F28C28] text-[#090A0F] font-bold py-3.5 rounded text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors">
            <Bell className="w-4 h-4" />
            NEW DISPATCH
          </button>

          <div className="flex flex-col gap-4 mt-2">
            <a href="#" className="flex items-center gap-4 text-xs font-bold tracking-wider text-gray-400 hover:text-white uppercase transition-colors">
              <HelpCircle className="w-4 h-4" />
              SUPPORT
            </a>
            <a href="#" className="flex items-center gap-4 text-xs font-bold tracking-wider text-gray-400 hover:text-white uppercase transition-colors">
              <LogOut className="w-4 h-4" />
              LOG OUT
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* Top Header */}
        <header className="h-20 border-b border-[#1C1F26] flex items-center justify-between px-8 bg-[#090A0F] flex-shrink-0 z-10">
          <div className="flex items-center w-full max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search operational sectors..."
                className="w-full bg-[#12141A] border border-[#1C1F26] rounded-md py-2.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9F43] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <span className="text-[10px] font-bold tracking-[0.15em] text-gray-400">DISASTER MANAGEMENT DASHBOARD</span>
            <button className="flex items-center gap-2 border border-[#3A1D1D] bg-[#2A1515] px-4 py-2 rounded text-[9px] font-bold tracking-widest text-[#FF5A5A] uppercase">
              <div className="w-1.5 h-1.5 bg-[#FF5A5A] rounded-full animate-pulse"></div>
              EMERGENCY MODE ACTIVE
            </button>
            <div className="flex items-center gap-4">
              <button className="relative text-gray-400 hover:text-white transition-colors" onClick={() => setAlertSetupOpen(true)} title="Alert notifications">
                <Bell className="w-5 h-5" />
                {alertConfig?.enabled ? <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full"></span> : null}
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <img src="https://ui-avatars.com/api/?name=Cmdr+John&background=FF9F43&color=090A0F" alt="User" className="w-8 h-8 rounded border border-[#1C1F26]" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-hidden p-6 flex flex-col gap-6 relative">

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-6 shrink-0 h-28">
            {/* Stat 1 */}
            <div className="bg-[#16181D] rounded-lg p-5 flex flex-col justify-between border border-[#1C1F26]">
              <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">AFFECTED ZONES</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-white leading-none">4</span>
                <Grid className="w-5 h-5 text-[#FF9F43]" />
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-[#16181D] rounded-lg p-5 flex flex-col justify-between border border-[#1C1F26]">
              <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">PEOPLE COUNT</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-white leading-none">120</span>
                <Users className="w-5 h-5 text-[#FF9F43]" />
              </div>
            </div>

            {/* Stat 3 (Highlight) */}
            <div className="bg-[#16181D] rounded-lg p-5 flex flex-col justify-between border-2 border-[#FF5A5A] relative overflow-hidden shadow-[0_0_15px_rgba(255,90,90,0.1)]">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF5A5A]"></div>
              <span className="text-[9px] font-bold tracking-widest text-[#FF5A5A] uppercase">DAMAGE LEVEL</span>
              <div className="flex items-end justify-between relative z-10">
                <span className="text-4xl font-bold text-[#FF5A5A] leading-none">High</span>
                <AlertTriangle className="w-5 h-5 text-[#FF5A5A]" />
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-[#16181D] rounded-lg p-5 flex flex-col justify-between border border-[#1C1F26]">
              <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">RESPONSE UNITS</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-white leading-none">6</span>
                <MapPin className="w-5 h-5 text-[#FF9F43]" />
              </div>
            </div>
          </div>

          {/* Center Map & Right Panel */}
          <div className="flex gap-6 flex-1 min-h-0">

            {/* Left/Center: Map */}
            <div className="flex-1 bg-[#16181D] border border-[#1C1F26] rounded-xl overflow-hidden relative group">
              {/* Glowing Map Background */}
              <div className="absolute inset-0 bg-[#090A0F]">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                  alt="City Map"
                  className="w-full h-full object-cover opacity-30 mix-blend-screen invert sepia saturate-200 hue-rotate-315 contrast-125"
                />
                <div className="absolute inset-0 bg-[#090A0F]/60 mix-blend-multiply"></div>
                {/* Fire Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF5A5A]/20 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-[#FF9F43]/20 blur-[80px] rounded-full pointer-events-none"></div>
              </div>

              {/* Map Overlays */}
              <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
                <div className="bg-[#16181D]/80 backdrop-blur-md border border-[#1C1F26] px-4 py-2.5 rounded flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#FF9F43] shadow-[0_0_8px_#FF9F43]"></div>
                  <span className="text-[9px] font-bold tracking-widest text-white uppercase">RESCUE UNIT ALPHA-1 (ACTIVE)</span>
                </div>
                <div className="bg-[#16181D]/80 backdrop-blur-md border border-[#1C1F26] px-4 py-2.5 rounded flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#FF5A5A] shadow-[0_0_8px_#FF5A5A]"></div>
                  <span className="text-[9px] font-bold tracking-widest text-white uppercase">HIGH RISK PERIMETER (42M)</span>
                </div>
              </div>

              {/* Evacuation Routes Card */}
              <div className="absolute bottom-6 left-6 bg-[#16181D]/90 backdrop-blur-md border border-[#1C1F26] rounded-xl p-5 w-80 shadow-2xl z-10">
                <h3 className="text-[10px] font-bold text-[#FF9F43] uppercase tracking-widest mb-4">EVACUATION ROUTES</h3>

                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded bg-[#FF9F43]/20 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-[#FF9F43]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white mb-0.5">Route 22-Beta (Optimal)</div>
                      <div className="text-[10px] text-gray-500">ETA: 12min | Obstacles: None</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 opacity-50">
                    <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white mb-0.5">Main St Corridor (Blocked)</div>
                      <div className="text-[10px] text-[#FF5A5A]">Heavy debris detected</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Controls */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
                <div className="flex flex-col bg-[#16181D]/90 backdrop-blur-md border border-[#1C1F26] rounded-lg overflow-hidden">
                  <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1C1F26] transition-colors border-b border-[#1C1F26]">
                    <Plus className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1C1F26] transition-colors">
                    <Minus className="w-5 h-5" />
                  </button>
                </div>
                <button className="w-10 h-10 bg-[#FF9F43] hover:bg-[#F28C28] text-[#090A0F] rounded-lg flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(255,159,67,0.3)] mt-2">
                  <Crosshair className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right Panel: CCTV & Alert */}
            <div className="w-80 flex flex-col gap-6 shrink-0 h-full">

              {/* CCTV Grid */}
              <div className="grid grid-cols-2 grid-rows-2 gap-3 h-[65%]">
                {/* CAM-01 */}
                <div className="relative border border-[#1C1F26] rounded bg-[#16181D] overflow-hidden group">
                  <img src="/images/disaster.jpg" className="w-full h-full object-cover opacity-80 grayscale group-hover:grayscale-0 transition-all duration-700" alt="Structural Damage" />
                  <div className="absolute inset-0 border border-[#FF9F43]/30 pointer-events-none"></div>
                  <div className="absolute top-2 left-2 bg-[#FF9F43]/90 text-[#090A0F] text-[7px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">CAM-01 STRUCTURAL</div>
                  <div className="absolute bottom-1/4 left-0 w-full h-[1px] bg-[#FF9F43]/50"></div>
                </div>
                {/* CAM-02 */}
                <div className="relative border border-[#1C1F26] rounded bg-[#16181D] overflow-hidden group">
                  {/* Thermal look */}
                  <img src="/images/flood.jpg" className="w-full h-full object-cover opacity-90 mix-blend-luminosity filter contrast-150 invert sepia hue-rotate-180" alt="Thermal" />
                  <div className="absolute inset-0 bg-[#FF5A5A]/30 mix-blend-color"></div>
                  <div className="absolute top-2 left-2 bg-[#1A1C23]/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">CAM-02 THERMAL</div>
                </div>
                {/* CAM-03 */}
                <div className="relative border border-[#1C1F26] rounded bg-[#16181D] overflow-hidden group">
                  <img src="/images/flood.jpg" className="w-full h-full object-cover opacity-70 sepia-[.5] hue-rotate-180 contrast-125 group-hover:scale-105 transition-transform duration-1000" alt="Debris" />
                  <div className="absolute top-2 left-2 bg-[#1A1C23]/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">CAM-03 DEBRIS DET.</div>
                </div>
                {/* CAM-04 */}
                <div className="relative border border-[#1C1F26] rounded bg-[#16181D] overflow-hidden group">
                  <img src="/images/disaster.jpg" className="w-full h-full object-cover opacity-80" alt="Aerial" />
                  <div className="absolute top-2 left-2 bg-[#FF5A5A]/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest">CAM-04 AERIAL</div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                    <svg width="40" height="40" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#FF9F43" strokeWidth="2" strokeDasharray="5,5" />
                      <circle cx="50" cy="50" r="2" fill="#FF9F43" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Alert Card */}
              <div className="flex-1 bg-[#1A1817] border border-[#3A2A20] rounded-xl p-5 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                  <AlertTriangle className="w-32 h-32 text-[#FF5A5A]" />
                </div>
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-10 h-10 rounded bg-[#FF5A5A]/20 flex items-center justify-center shrink-0 border border-[#FF5A5A]/30">
                    <AlertTriangle className="w-5 h-5 text-[#FF5A5A]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#FF5A5A] leading-tight mb-2 tracking-wide">SEVERE STRUCTURAL RISK DETECTED</h3>
                    <p className="text-[10px] text-[#A0A0A0] leading-relaxed">
                      Sector 4C - Immediate evacuation recommended within 200m radius.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Row: Comms & Units */}
          <div className="grid grid-cols-4 gap-6 shrink-0 h-28">

            {/* Live Comms */}
            <div className="col-span-1 bg-[#16181D] border border-[#1C1F26] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[9px] font-bold text-[#FF9F43] uppercase tracking-widest">LIVE INCIDENT COMMS</h3>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF9F43]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                </div>
              </div>
              <div className="text-[11px] text-gray-300 font-medium mb-3">
                <span className="text-[#FF9F43] font-bold">HQ:</span> Alpha-1, what is your status at Zone 4C?
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Send tactical message..." className="flex-1 bg-[#090A0F] border border-[#1C1F26] rounded px-3 py-1.5 text-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF9F43]" />
                <button className="bg-[#FF9F43] hover:bg-[#F28C28] text-[#090A0F] font-bold text-[10px] px-3 py-1.5 rounded uppercase tracking-wider transition-colors">SEND</button>
              </div>
            </div>

            {/* Units Status */}
            <div className="col-span-3 grid grid-cols-3 gap-6">
              {/* Unit 1 */}
              <div className="bg-[#16181D] border border-[#1C1F26] rounded-xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg border border-[#3A2A20] bg-[#1A1612] flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-[#FF9F43]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white mb-0.5">Med-Evac Ready</div>
                    <div className="text-[10px] text-gray-500">Sector 2 - Staging</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-[#FF9F43] uppercase tracking-widest">DEPLOY</span>
              </div>

              {/* Unit 2 */}
              <div className="bg-[#16181D] border border-[#1C1F26] rounded-xl p-4 flex flex-col justify-center gap-2 group relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg border border-[#3A2A20] bg-[#1A1612] flex items-center justify-center shrink-0">
                      <Flame className="w-5 h-5 text-[#FF9F43]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white mb-0.5">Fire Suppression</div>
                      <div className="text-[10px] text-gray-500">Sector 4 - Onsite</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-white uppercase tracking-widest">ACTIVE</span>
                </div>
                {/* Progress bar inside card */}
                <div className="w-[85%] h-1 bg-[#090A0F] rounded-full self-end mt-1">
                  <div className="w-[60%] h-full bg-[#FF9F43] rounded-full"></div>
                </div>
              </div>

              {/* Unit 3 */}
              <div className="bg-[#16181D] border border-[#1C1F26] rounded-xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg border border-[#3A1D1D] bg-[#1A1515] flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-[#FF5A5A]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white mb-0.5">Heavy Rescue</div>
                    <div className="text-[10px] text-gray-500">In Transit - 4m</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-[#FF5A5A] uppercase tracking-widest">VIEW GPS</span>
              </div>
            </div>

          </div>

        </main>

        {/* Footer Bar */}
        <footer className="h-8 border-t border-[#1C1F26] bg-[#0E1015] flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-3 flex-1">
            <Video className="w-3 h-3 text-[#FF5A5A]" />
            <span className="text-[8px] font-bold text-[#FF5A5A] uppercase tracking-widest w-24">INCIDENT FEED LIVE</span>
            <div className="flex-1 h-[2px] bg-[#1C1F26] rounded-full relative max-w-xl">
              <div className="absolute left-0 top-0 h-full w-[85%] bg-[#FF5A5A] rounded-full"></div>
            </div>
          </div>
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest ml-4">OPERATIONAL BANDWIDTH: 85%</span>
        </footer>

      </div>

      <TwilioAlertSetup open={alertSetupOpen} onClose={() => setAlertSetupOpen(false)} onSave={(cfg) => setAlertConfig(cfg)} current={alertConfig} />

      {/* Model picker modal */}
      {showModelPicker ? (
        <div className="model-picker" onClick={(e) => { if (e.target === e.currentTarget && downloadPercent === null) setShowModelPicker(false); }}>
          <div className="model-picker__dialog">
            {modelPickerResult === null && downloadPercent === null ? (
              <>
                <p className="model-picker__title">Load Fall/Collapse Model</p>
                <p className="model-picker__label">Choose how to load the FallSafe YOLO11 ONNX model.</p>
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
