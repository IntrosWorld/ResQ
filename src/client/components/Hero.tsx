import { ArrowRight, Bot, Building2, Map, Radio, Route, ShieldAlert } from "lucide-react";

interface HeroProps {
  onStart: () => void;
}

export function Hero({ onStart }: HeroProps) {
  return (
    <header className="hero" role="banner">
      <div className="hero__scene" aria-hidden="true">
        <div className="hero-floor">
          <span className="hero-wall hero-wall--outer" />
          <span className="hero-room hero-room--101" />
          <span className="hero-room hero-room--102" />
          <span className="hero-room hero-room--201" />
          <span className="hero-room hero-room--202" />
          <span className="hero-corridor hero-corridor--main" />
          <span className="hero-corridor hero-corridor--cross" />
          <span className="hero-route hero-route--a" />
          <span className="hero-route hero-route--b" />
          <span className="hero-node hero-node--start" />
          <span className="hero-node hero-node--junction" />
          <span className="hero-node hero-node--exit" />
          <span className="hero-hazard" />
          <span className="hero-exit hero-exit--west" />
          <span className="hero-exit hero-exit--east" />
          <span className="hero-sensor hero-sensor--camera" />
          <span className="hero-sensor hero-sensor--ble" />
        </div>
      </div>

      <nav className="hero-nav" aria-label="Homepage">
        <div className="hero-brand">
          <ShieldAlert size={19} />
          <span>SafePath AI</span>
        </div>
        <div className="hero-nav__links">
          <span>Map setup</span>
          <span>Live routing</span>
          <span>Edge AI</span>
        </div>
        <button className="hero-nav__button" onClick={onStart}>
          Console
        </button>
      </nav>

      <div className="hero__content">
        <div className="eyebrow">
          <Radio size={16} />
          AI evacuation routing for hotels and large buildings
        </div>
        <h1>SafePath AI</h1>
        <p>
          Convert a building floor plan into an emergency graph, locate people with BLE and QR checkpoints, simulate hazards, and guide every role toward safer exits.
        </p>
        <div className="hero__actions">
          <button className="primary-action" onClick={onStart}>
            Open command center
            <ArrowRight size={18} />
          </button>
          <div className="hero__stats">
            <span>
              <Map size={16} />
              DWG/DXF map intake
            </span>
            <span>
              <Route size={16} />
              Safer path calculation
            </span>
            <span>
              <Bot size={16} />
              Camera and sensor events
            </span>
          </div>
        </div>
      </div>

      <div className="hero__operations" aria-hidden="true">
        <span>
          <Building2 size={15} />
          Floor 1 graph online
        </span>
        <span>3 occupants tracked</span>
        <span>2 exits available</span>
        <span>1 hazard isolated</span>
      </div>

      <div className="hero__handoff">Dashboard preview below</div>
    </header>
  );
}
