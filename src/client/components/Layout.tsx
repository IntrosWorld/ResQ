import { Bell, House, Moon, ScanEye, ShieldAlert, Sun, UserSearch } from "lucide-react";
import type { ReactNode } from "react";
import type { SystemNotification } from "../../shared/types";

interface LayoutProps {
  role: "admin" | "clerk" | "user";
  theme: "light" | "dark";
  onRoleChange: (role: "admin" | "clerk" | "user") => void;
  onThemeToggle: () => void;
  onHome?: () => void;
  onCctv?: () => void;
  onCollapse?: () => void;
  onRestricted?: () => void;
  activeView?: "dashboard" | "cctv" | "collapse" | "restricted";
  notifications?: SystemNotification[];
  onNotificationClick?: () => void;
  children: ReactNode;
}

const roles: Array<LayoutProps["role"]> = ["admin", "clerk", "user"];

export function Layout({
  role,
  theme,
  onRoleChange,
  onThemeToggle,
  onHome,
  onCctv,
  onCollapse,
  onRestricted,
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
