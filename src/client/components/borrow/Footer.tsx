import React from "react";

export function Footer() {
  return (
    <footer className="relative z-50 bg-[#09090b] text-zinc-400 py-16 border-t border-white/5 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <span className="text-zinc-100 font-bold text-3xl tracking-tight">ResQ</span>
            </div>
            <p className="text-sm leading-relaxed mb-4 max-w-sm text-zinc-300">
              AI-powered Emergency Response & Crisis Coordination Platform
            </p>
            <div className="text-xs text-zinc-400 flex flex-wrap gap-2 items-center mb-8">
              {["Real-time detection", "Instant alerts", "Smart coordination"].map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 cursor-default">{tag}</span>
              ))}
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-zinc-100 mb-4 uppercase tracking-wider text-xs">Contact & Support</h4>
            <a href="mailto:support@resq.ai" className="flex items-center gap-3 hover:text-emerald-400 transition-colors">support@resq.ai</a>
            <p className="text-emerald-500/90 font-medium">Emergency Ready (112 Local)</p>
          </div>
        </div>

        <div className="md:pl-4">
          <h4 className="font-semibold text-zinc-100 mb-6 tracking-wide text-sm">Quick Links</h4>
          <ul className="space-y-4 text-sm font-medium">
            {["Dashboard", "Incidents", "Live Map", "Analytics", "Reports", "Settings"].map((link) => (
              <li key={link}>
                <a href="#" className="text-zinc-400 hover:text-emerald-400 transition-colors">{link}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-zinc-100 mb-6 tracking-wide text-sm">Solutions</h4>
          <ul className="space-y-4 text-sm font-medium text-zinc-400">
            {["AI Incident Detection", "Real-time Monitoring", "Emergency Alerts", "Smart Routing", "Risk Analytics", "Mobile Response App"].map((s) => (
              <li key={s} className="hover:text-zinc-200 transition-colors cursor-default">{s}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-zinc-100 mb-6 tracking-wide text-sm">Use Cases</h4>
          <ul className="space-y-4 text-sm font-medium text-zinc-400">
            {["Hotels & Hospitality", "Smart Cities", "Healthcare & Hospitals", "University Campuses", "Industrial Facilities"].map((s) => (
              <li key={s} className="hover:text-zinc-200 transition-colors cursor-default">{s}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-zinc-100 mb-6 tracking-wide text-sm">Trust & Security</h4>
          <ul className="space-y-4 text-sm font-medium text-zinc-400">
            {["RBAC Access Control", "Multi-Factor Auth", "Encrypted Data", "99.9% System Uptime", "Privacy Compliance"].map((s) => (
              <li key={s} className="hover:text-zinc-200 transition-colors cursor-default">{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 mt-16 pt-8 max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-xs font-medium text-zinc-500">
        <p>© {new Date().getFullYear()} ResQ Platform. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          {["Privacy Policy", "Terms of Service", "Data Protection"].map((l) => (
            <a key={l} href="#" className="hover:text-zinc-300 transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
