import React from "react";
import { Building2, Globe, ShieldAlert, Flame, Ambulance, Users, LayoutDashboard, ScanEye, Bot, ArrowRight, MapPin, Activity, Command } from "lucide-react";

interface ModeSelectorPageProps {
  role: "admin" | "staff" | "user";
  onLocalBuilding: () => void;
  onCityWide: () => void;
}

export function ModeSelectorPage({ role, onLocalBuilding, onCityWide }: ModeSelectorPageProps) {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center px-6 py-16">
      {/* Header */}
      <div className="text-center mb-16 max-w-2xl">
        <span className="text-emerald-400 text-sm font-bold tracking-[0.2em] uppercase block mb-4">
          Welcome, {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
          Select Monitoring Mode
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          Choose the scope of your emergency response operations.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">

        {/* Local Building */}
        <button
          onClick={onLocalBuilding}
          className="group relative bg-[#0f0f15] border border-white/10 rounded-3xl p-10 text-left hover:bg-[#1a1a28] hover:border-emerald-500/40 transition-all duration-300 cursor-pointer"
          style={{ border: "none", cursor: "pointer" }}
        >
          <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-emerald-500/40 transition-all duration-300 pointer-events-none" />

          <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8">
            <Building2 className="size-8 text-emerald-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Local Building Monitoring</h2>
          <p className="text-zinc-400 leading-relaxed mb-8">
            Floor-plan based operations for a single facility. Manage nodes, cameras, evacuation routes, collapse detection, restricted zones, and on-site personnel in real time.
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { icon: LayoutDashboard, label: "Floor Plan Editor" },
              { icon: ScanEye, label: "CCTV / Fire" },
              { icon: ShieldAlert, label: "Collapse Detection" },
              { icon: MapPin, label: "Restricted Areas" },
              { icon: Bot, label: "AI Assistant" },
              { icon: Activity, label: "Analytics" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300">
                <Icon className="size-3" />
                {label}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-emerald-400 font-semibold group-hover:gap-4 transition-all">
            Enter Local Dashboard
            <ArrowRight className="size-5" />
          </div>
        </button>

        {/* City-Wide */}
        <button
          onClick={onCityWide}
          className="group relative bg-[#0f0f15] border border-white/10 rounded-3xl p-10 text-left hover:bg-[#1a1a28] hover:border-red-500/40 transition-all duration-300 cursor-pointer"
          style={{ border: "none", cursor: "pointer" }}
        >
          <div className="absolute inset-0 rounded-3xl border border-white/10 group-hover:border-red-500/40 transition-all duration-300 pointer-events-none" />

          <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8">
            <Globe className="size-8 text-red-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">City-Wide Operations</h2>
          <p className="text-zinc-400 leading-relaxed mb-8">
            Large-scale, multi-domain emergency coordination across the entire city. Unified command for fire, medical, disaster, women safety, and smart CCTV monitoring.
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { icon: Flame, label: "Fire Detection" },
              { icon: ShieldAlert, label: "Women Safety" },
              { icon: Ambulance, label: "Medical Emergency" },
              { icon: Globe, label: "Disaster Mgmt" },
              { icon: ScanEye, label: "Smart CCTV City" },
              { icon: Command, label: "Unified Command" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300">
                <Icon className="size-3" />
                {label}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-red-400 font-semibold group-hover:gap-4 transition-all">
            Enter City Dashboard
            <ArrowRight className="size-5" />
          </div>
        </button>
      </div>

      <p className="mt-10 text-zinc-600 text-sm">
        Logged in as <span className="text-zinc-400 font-semibold">{role}</span> · You can switch modes anytime from the dashboard
      </p>
    </div>
  );
}
