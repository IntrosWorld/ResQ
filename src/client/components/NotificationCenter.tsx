import { Bell, Check, Flame, PhoneCall, ShieldAlert, UserSearch, X } from "lucide-react";
import type { SystemNotification } from "../../shared/types";
import type { AlertConfig } from "./TwilioAlertSetup";

interface NotificationCenterProps {
  notifications: SystemNotification[];
  open: boolean;
  onClose: () => void;
  onDismiss: (id: string) => void;
  onClear: () => void;
  alertConfig: AlertConfig | null;
  onAlertSetup: () => void;
}

export function NotificationCenter({ notifications, open, onClose, onDismiss, onClear, alertConfig, onAlertSetup }: NotificationCenterProps) {
  const latestToast = notifications.find((notification) => !notification.read);

  return (
    <>
      {latestToast ? (
        <div className={`notification-toast notification-toast--${latestToast.kind}`}>
          {iconFor(latestToast.kind)}
          <div>
            <strong>{latestToast.title}</strong>
            <span>{latestToast.message}</span>
          </div>
          <button type="button" onClick={() => onDismiss(latestToast.id)} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      ) : null}

      {open ? (
        <aside className="notification-drawer" aria-label="Notifications">
          <div className="notification-drawer__header">
            <h3>
              <Bell size={18} />
              Notifications
            </h3>
            <button type="button" onClick={onClose} aria-label="Close notifications">
              <X size={16} />
            </button>
          </div>
          {/* Twilio alert setup strip */}
          <button type="button" className="alert-setup-strip" onClick={onAlertSetup}>
            <PhoneCall size={15} />
            <span>
              {alertConfig?.enabled
                ? `SMS/WhatsApp alerts on · ${alertConfig.channel.toUpperCase()} → ${alertConfig.phone}`
                : "Set up SMS / WhatsApp hazard alerts"}
            </span>
            <span className={`alert-setup-strip__badge ${alertConfig?.enabled ? "alert-setup-strip__badge--on" : ""}`}>
              {alertConfig?.enabled ? "ON" : "OFF"}
            </span>
          </button>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <article key={notification.id} className={`notification-item notification-item--${notification.kind}`}>
                  {iconFor(notification.kind)}
                  <div>
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <small>{new Date(notification.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                  </div>
                  <button type="button" onClick={() => onDismiss(notification.id)} aria-label="Mark notification as read">
                    <Check size={15} />
                  </button>
                </article>
              ))
            ) : (
              <p className="muted">No notifications yet.</p>
            )}
          </div>
          {notifications.length > 0 ? (
            <button type="button" className="secondary-action" onClick={onClear}>
              Clear notifications
            </button>
          ) : null}
        </aside>
      ) : null}
    </>
  );
}

function iconFor(kind: SystemNotification["kind"]) {
  if (kind === "fire") return <Flame size={18} />;
  if (kind === "collapse") return <ShieldAlert size={18} />;
  if (kind === "intrusion") return <UserSearch size={18} />;
  return <Bell size={18} />;
}
