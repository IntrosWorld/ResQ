import { House, Moon, ScanEye, Sun } from "lucide-react";
import type { ReactNode } from "react";

interface LayoutProps {
  role: "admin" | "clerk" | "user";
  theme: "light" | "dark";
  onRoleChange: (role: "admin" | "clerk" | "user") => void;
  onThemeToggle: () => void;
  onHome?: () => void;
  onCctv?: () => void;
  activeView?: "dashboard" | "cctv";
  children: ReactNode;
}

const roles: Array<LayoutProps["role"]> = ["admin", "clerk", "user"];

export function Layout({ role, theme, onRoleChange, onThemeToggle, onHome, onCctv, activeView = "dashboard", children }: LayoutProps) {
  return (
    <main className="shell" id="dashboard">
      <header className="topbar">
        <div>
          <p className="topbar__kicker">SafePath AI</p>
          <h2>Building Response Console</h2>
        </div>
        <div className="topbar-actions">
          {onHome ? (
            <button className="home-button" onClick={onHome}>
              <House size={17} />
              Home
            </button>
          ) : null}
          {onCctv ? (
            <button className={activeView === "cctv" ? "home-button active" : "home-button"} onClick={onCctv}>
              <ScanEye size={17} />
              CCTV
            </button>
          ) : null}
        </div>
        <nav className="role-tabs" aria-label="Dashboard role">
          {roles.map((item) => (
            <button key={item} className={role === item ? "active" : ""} onClick={() => onRoleChange(item)}>
              {item}
            </button>
          ))}
        </nav>
        <button className="icon-button" onClick={onThemeToggle} aria-label="Toggle color theme" title="Toggle color theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>
      {children}
    </main>
  );
}
