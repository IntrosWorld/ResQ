import { BarChart3, Bell, Bot, House, LayoutDashboard, Moon, ScanEye, ShieldAlert, Sun, UserSearch } from "lucide-react";
import type { ReactNode } from "react";
import type { SystemNotification } from "../../shared/types";

interface LayoutProps {
  role: "admin" | "staff" | "user";
  theme: "light" | "dark";
  onRoleChange: (role: "admin" | "staff" | "user") => void;
  onThemeToggle: () => void;
  onHome?: () => void;
  onCctv?: () => void;
  onCollapse?: () => void;
  onRestricted?: () => void;
  onAssistant?: () => void;
  onAnalytics?: () => void;
  onSwitchMode?: () => void;
  onDashboard?: () => void;
  activeView?: "dashboard" | "cctv" | "collapse" | "restricted" | "assistant" | "analytics";
  notifications?: SystemNotification[];
  onNotificationClick?: () => void;
  children: ReactNode;
}

const roles: Array<LayoutProps["role"]> = ["admin", "staff", "user"];

export function Layout({
  role,
  theme,
  onRoleChange,
  onThemeToggle,
  onHome,
  onCctv,
  onCollapse,
  onRestricted,
  onAssistant,
  onAnalytics,
  onSwitchMode,
  onDashboard,
  activeView = "dashboard",
  notifications = [],
  onNotificationClick,
  children
}: LayoutProps) {
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <main className="shell" id="dashboard">
      <header className="topbar">
        <div>
          <p className="topbar__kicker">{theme === "dark" ? "ResQFacility" : "ResQ"}</p>
          <h2>{theme === "dark" ? "Local Building Command" : "Building Response Console"}</h2>
        </div>
        <div className="topbar-actions">
          {onHome ? (
            <button className="home-button" onClick={onHome}>
              <House size={17} />
              Home
            </button>
          ) : null}
          {onDashboard ? (
            <button className={activeView === "dashboard" ? "home-button active" : "home-button"} onClick={onDashboard}>
              <LayoutDashboard size={17} />
              Dashboard
            </button>
          ) : null}
          {onCctv ? (
            <button className={activeView === "cctv" ? "home-button active" : "home-button"} onClick={onCctv}>
              <ScanEye size={17} />
              Fire/Fog
            </button>
          ) : null}
          {onCollapse ? (
            <button className={activeView === "collapse" ? "home-button active" : "home-button"} onClick={onCollapse}>
              <ShieldAlert size={17} />
              Collapse
            </button>
          ) : null}
          {onRestricted ? (
            <button className={activeView === "restricted" ? "home-button active" : "home-button"} onClick={onRestricted}>
              <UserSearch size={17} />
              Restricted
            </button>
          ) : null}
          {onAssistant ? (
            <button className={activeView === "assistant" ? "home-button active" : "home-button"} onClick={onAssistant}>
              <Bot size={17} />
              Assistant
            </button>
          ) : null}
          {onAnalytics ? (
            <button className={activeView === "analytics" ? "home-button active" : "home-button"} onClick={onAnalytics}>
              <BarChart3 size={17} />
              Analytics
            </button>
          ) : null}
          {onSwitchMode ? (
            <button className="home-button" onClick={onSwitchMode}>
              <LayoutDashboard size={17} />
              Modes
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
        <button className="icon-button notification-button" onClick={onNotificationClick} aria-label="Open notifications" title="Open notifications">
          <Bell size={18} />
          {unreadCount > 0 ? <span>{unreadCount}</span> : null}
        </button>
        <button className="icon-button" onClick={onThemeToggle} aria-label="Toggle color theme" title="Toggle color theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>
      {children}
    </main>
  );
}
