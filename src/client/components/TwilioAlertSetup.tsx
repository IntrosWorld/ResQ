import { MessageSquare, Phone, PhoneCall, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface AlertConfig {
  phone: string;
  channel: "sms" | "whatsapp";
  enabled: boolean;
}

const STORAGE_KEY = "resq-alert-config";

export function loadAlertConfig(): AlertConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AlertConfig) : null;
  } catch {
    return null;
  }
}

export function saveAlertConfig(config: AlertConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

interface TwilioAlertSetupProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: AlertConfig) => void;
  current: AlertConfig | null;
}

export function TwilioAlertSetup({ open, onClose, onSave, current }: TwilioAlertSetupProps) {
  const [step, setStep] = useState<"channel" | "phone" | "done">("channel");
  const [channel, setChannel] = useState<"sms" | "whatsapp">(current?.channel ?? "sms");
  const [phone, setPhone] = useState(current?.phone ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStep(current ? "phone" : "channel");
      setChannel(current?.channel ?? "sms");
      setPhone(current?.phone ?? "");
      setError("");
    }
  }, [open, current]);

  if (!open) return null;

  function handleSave() {
    const cleaned = phone.trim().replace(/\s+/g, "");
    if (!cleaned) {
      setError("Please enter a phone number.");
      return;
    }
    // Basic E.164 check — must start with + and digits
    if (!/^\+\d{7,15}$/.test(cleaned)) {
      setError("Enter number in international format, e.g. +911234567890");
      return;
    }
    const config: AlertConfig = { phone: cleaned, channel, enabled: true };
    saveAlertConfig(config);
    onSave(config);
    setStep("done");
  }

  function handleDisable() {
    const config: AlertConfig = { phone: current?.phone ?? "", channel: current?.channel ?? "sms", enabled: false };
    saveAlertConfig(config);
    onSave(config);
    onClose();
  }

  return (
    <div className="twilio-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="twilio-modal__dialog">
        <div className="twilio-modal__header">
          <PhoneCall size={18} />
          <span>Alert Notifications</span>
          <button className="twilio-modal__close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Step 1 — choose channel */}
        {step === "channel" ? (
          <div className="twilio-modal__body">
            <p className="twilio-modal__desc">Choose how you want to receive hazard alerts when fire or danger is detected.</p>
            <div className="twilio-channel-options">
              <button
                className={`twilio-channel-btn ${channel === "sms" ? "twilio-channel-btn--active" : ""}`}
                onClick={() => setChannel("sms")}
              >
                <Phone size={20} />
                <strong>SMS</strong>
                <small>Text message to any number</small>
              </button>
              <button
                className={`twilio-channel-btn ${channel === "whatsapp" ? "twilio-channel-btn--active" : ""}`}
                onClick={() => setChannel("whatsapp")}
              >
                <MessageSquare size={20} />
                <strong>WhatsApp</strong>
                <small>Via Twilio WhatsApp sandbox</small>
              </button>
            </div>
            <button className="twilio-modal__next" onClick={() => setStep("phone")}>
              Continue
            </button>
          </div>
        ) : null}

        {/* Step 2 — enter phone */}
        {step === "phone" ? (
          <div className="twilio-modal__body">
            <p className="twilio-modal__desc">
              Enter the phone number to receive <strong>{channel === "whatsapp" ? "WhatsApp" : "SMS"}</strong> alerts.
            </p>
            <label className="twilio-modal__label">
              Phone number (international format)
              <input
                className="twilio-modal__input"
                type="tel"
                placeholder="+911234567890"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                autoFocus
              />
            </label>
            {error ? <p className="twilio-modal__error">{error}</p> : null}
            <div className="twilio-modal__actions">
              <button className="twilio-modal__back" onClick={() => setStep("channel")}>Back</button>
              <button className="twilio-modal__next" onClick={handleSave}>Save &amp; Enable</button>
            </div>
            {current?.enabled ? (
              <button className="twilio-modal__disable" onClick={handleDisable}>Disable alerts</button>
            ) : null}
          </div>
        ) : null}

        {/* Step 3 — done */}
        {step === "done" ? (
          <div className="twilio-modal__body twilio-modal__done">
            <span className="twilio-modal__done-icon">✓</span>
            <strong>Alerts enabled</strong>
            <p className="twilio-modal__desc">
              You will receive a <strong>{channel === "whatsapp" ? "WhatsApp" : "SMS"}</strong> message at <code>{phone}</code> when a hazard is detected.
            </p>
            <button className="twilio-modal__next" onClick={onClose}>Done</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
