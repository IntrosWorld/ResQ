"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShieldAlert, MessageSquare, Bot, Send } from "lucide-react";

const navLinks = ["About Us", "Solutions", "Platform", "Dashboards", "Safety AI", "Contact & Testimonials"];

interface HeroSectionProps {
  onNavigateTo: (path: string) => void;
}

export default function HeroSection({ onNavigateTo }: HeroSectionProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "agent", text: "Hello! I am the ResQ AI Agent. How can I assist you with the platform today?" },
    { role: "user", text: "What exactly does this platform do?" },
    { role: "agent", text: "ResQ integrates existing CCTV with YOLO object detection to instantly identify emergencies like fires or crowd panic. It then routes safe paths and coordinates local responders before traditional emergency services even arrive." },
  ]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden selection:bg-red-500/30">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          src="https://res.cloudinary.com/dbnnd43kl/video/upload/v1777328191/InShot_20260428_032211050_zpqghw.mp4"
          autoPlay muted loop playsInline
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#050508] z-10" />
      </div>

      {/* Navbar */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-[#050508]/90 backdrop-blur-md border-b border-white/10 py-4" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">ResQ</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              if (link === "Solutions") {
                return (
                  <div key={link} className="relative group">
                    <a href={`#${link.toLowerCase().replace(" ", "-")}`} className="text-sm font-medium text-gray-300 hover:text-white transition-colors py-4">
                      {link}
                    </a>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                      <div className="bg-white rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] p-8 flex gap-12 border border-gray-100 min-w-[650px] text-left relative before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-b-white">
                        <div className="flex-1">
                          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-6">Use Cases</h3>
                          <div className="flex flex-col gap-6">
                            {[["Fire Detection", "Instant thermal and smoke anomaly alerts"], ["Women Safety / Intrusion", "AI tracking for unauthorized personnel & distress"], ["Medical Emergency", "Ambulance dispatch and vitals tracking"], ["Crowd Panic Management", "Density monitoring and stampede prevention"], ["Smart CCTV City Monitoring", "City-wide surveillance and threat detection"], ["Unified Command Center", "Centralized dashboard for all crisis ops"]].map(([title, desc]) => (
                              <a key={title} href="#" className="group/item block">
                                <h4 className="text-sm font-bold text-gray-900 group-hover/item:text-emerald-600 transition-colors">{title}</h4>
                                <p className="text-xs text-gray-500 font-medium mt-1">{desc}</p>
                              </a>
                            ))}
                          </div>
                        </div>
                        <div className="w-px bg-gray-100" />
                        <div className="flex-1">
                          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-6">Core Features</h3>
                          <div className="flex flex-col gap-6">
                            {[["Real-time Monitoring", "Live feeds with AI bounding boxes"], ["Emergency Alerts", "Instant push notifications to responders"], ["Smart Routing", "Optimal paths for evacuation and ambulances"], ["Risk Analytics", "Predictive heatmaps and incident reports"], ["Mobile Response App", "Field agent coordination and status tracking"]].map(([title, desc]) => (
                              <a key={title} href="#" className="group/item block">
                                <h4 className="text-sm font-bold text-gray-900 group-hover/item:text-emerald-600 transition-colors">{title}</h4>
                                <p className="text-xs text-gray-500 font-medium mt-1">{desc}</p>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              if (link === "Platform") {
                return (
                  <a key={link} href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">{link}</a>
                );
              }
              return (
                <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">{link}</a>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => onNavigateTo("/login")} className="text-sm font-semibold text-white hover:text-gray-300 transition-colors">Login</button>
            <button className="text-sm font-semibold bg-white text-black px-6 py-2.5 rounded-sm hover:bg-gray-200 transition-colors">Sign Up</button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-full left-0 w-full bg-[#050508]/95 backdrop-blur-xl border-b border-white/10 flex flex-col px-6 py-6 gap-4 shadow-2xl"
          >
            {navLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`} className="text-sm font-medium text-gray-300 py-2 border-b border-white/5">{link}</a>
            ))}
            <div className="flex flex-col gap-3 mt-4">
              <button onClick={() => { setMobileMenuOpen(false); onNavigateTo("/login"); }} className="w-full block text-center py-3 rounded-md border border-white/20 text-white text-sm font-semibold">Login</button>
              <button className="w-full text-center py-3 rounded-md bg-white text-black text-sm font-semibold">Sign Up</button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero */}
      <main className="relative z-10 container mx-auto px-6 h-screen flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="max-w-4xl flex flex-col items-center"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal leading-[1.05] tracking-tight mb-6 text-white drop-shadow-xl">
            Detect <span className="text-red-500 font-bold">Threats.</span> <br />
            Coordinate <span className="text-red-500 font-bold">Faster.</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-gray-200 max-w-2xl leading-relaxed mb-10 drop-shadow-md">
            The platform to put AI agents to work in complex emergency environments
          </p>
          <button
            onClick={() => onNavigateTo("/login")}
            className="px-6 py-3 rounded-md bg-white text-black font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-xl group"
          >
            <div className="size-5 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-600">
              <ShieldAlert className="size-3" />
            </div>
            Talk to a ResQ Agent
          </button>
        </motion.div>
      </main>

      <div className="absolute bottom-6 w-full z-20 pointer-events-none">
        <div className="container mx-auto px-6 flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
          {["CCTV", "Sensors", "Mobile Distress Alerts", "Staff Response"].map((label) => (
            <span key={label} className="font-bold text-xl md:text-2xl tracking-tighter uppercase text-gray-300">{label}</span>
          ))}
        </div>
      </div>

      {/* Chatbot */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-[#111827] border border-gray-700 rounded-2xl shadow-2xl w-80 sm:w-96 mb-4 overflow-hidden flex flex-col"
            >
              <div className="bg-[#1f2937] px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500/20 p-1.5 rounded-md"><Bot className="size-4 text-emerald-400" /></div>
                  <span className="font-bold text-sm text-white">ResQ Agent</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X className="size-4" /></button>
              </div>
              <div className="p-4 flex-1 h-64 overflow-y-auto flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === "user" ? "bg-emerald-600 text-white rounded-br-none" : "bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-[#1f2937] border-t border-gray-700 flex gap-2">
                <input
                  type="text" value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && chatInput.trim()) {
                      setMessages([...messages, { role: "user", text: chatInput }]);
                      setChatInput("");
                      setTimeout(() => setMessages((prev) => [...prev, { role: "agent", text: "That's a great question! I'm currently a demo agent, but a full implementation would connect to the ResQ Knowledge Base." }]), 1000);
                    }
                  }}
                  placeholder="Ask about the platform..."
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => {
                    if (chatInput.trim()) {
                      setMessages([...messages, { role: "user", text: chatInput }]);
                      setChatInput("");
                      setTimeout(() => setMessages((prev) => [...prev, { role: "agent", text: "I'm a demo agent, but I'd normally answer that using our Knowledge Base!" }]), 1000);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
        >
          {isChatOpen ? <X className="size-6" /> : <MessageSquare className="size-6" />}
        </button>
      </div>
    </div>
  );
}
