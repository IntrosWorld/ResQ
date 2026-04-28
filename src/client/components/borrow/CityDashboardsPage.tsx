import React from "react";
import UseCasesSection from "./UseCasesSection";

interface CityDashboardsPageProps {
  onNavigate: (path: string) => void;
  onBackToModes?: () => void;
}

export function CityDashboardsPage({ onNavigate, onBackToModes }: CityDashboardsPageProps) {
  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-black/80 px-6 py-4 backdrop-blur-md">
        <button onClick={() => onNavigate("/")} className="text-xl font-bold tracking-tight text-white">
          ResQ
        </button>
        <div className="flex items-center gap-3">
          {onBackToModes ? (
            <button
              onClick={onBackToModes}
              className="rounded-sm border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10"
            >
              Switch Mode
            </button>
          ) : null}
          <button
            onClick={() => onNavigate("/dashboard")}
            className="rounded-sm bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-black hover:bg-gray-200"
          >
            Local Dashboard
          </button>
        </div>
      </header>
      <div className="pt-16">
        <UseCasesSection onNavigate={onNavigate} />
      </div>
    </main>
  );
}
