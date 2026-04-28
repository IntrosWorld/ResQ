import React from "react";
import { ExternalLink, BarChart3, TrendingUp, AlertTriangle, Activity } from "lucide-react";

interface AnalyticsPageProps {
  onOpenBorrowAdmin: () => void;
}

export function AnalyticsPage({ onOpenBorrowAdmin }: AnalyticsPageProps) {
  const borrowAdminUrl = "http://localhost:3000/dashboards/admin";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Analytics</h1>
          <p className="text-[var(--muted)] mt-1">Overview of platform activity and insights</p>
        </div>
        <a
          href={borrowAdminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow"
        >
          <ExternalLink size={16} />
          Open Full Analytics Dashboard
        </a>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Incidents", value: "1,284", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Response Rate", value: "98.4%", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Active Cameras", value: "342", icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Avg. Response Time", value: "2m 14s", icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 flex items-center gap-4">
            <div className={`size-12 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <stat.icon className={`size-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">{stat.label}</p>
              <p className="text-2xl font-bold text-[var(--text)]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Link to borrow admin */}
      <div className="card p-8 text-center border-dashed">
        <BarChart3 size={48} className="mx-auto mb-4 text-[var(--muted)]" />
        <h2 className="text-xl font-bold text-[var(--text)] mb-2">Full Analytics Dashboard</h2>
        <p className="text-[var(--muted)] mb-6 max-w-md mx-auto">
          The complete analytics dashboard with incident timelines, heatmaps, responder metrics, and drill-down reports is available in the ResQ Admin portal.
        </p>
        <a
          href={borrowAdminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg font-semibold transition-opacity"
        >
          <ExternalLink size={18} />
          Launch Analytics Portal
        </a>
        <p className="text-xs text-[var(--muted)] mt-4">Opens at {borrowAdminUrl}</p>
      </div>
    </div>
  );
}
