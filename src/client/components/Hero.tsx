import { ArrowRight, Bot, Building2, Route, ShieldAlert } from "lucide-react";

interface HeroProps {
  onStart: () => void;
}

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero__visual" aria-hidden="true">
        <div className="hero-map">
          <span className="hero-map__room room-a" />
          <span className="hero-map__room room-b" />
          <span className="hero-map__room room-c" />
          <span className="hero-map__corridor" />
          <span className="hero-map__route" />
          <span className="hero-map__hazard" />
          <span className="hero-map__exit exit-a" />
          <span className="hero-map__exit exit-b" />
        </div>
      </div>
      <div className="hero__content">
        <div className="eyebrow">
          <ShieldAlert size={16} />
          Indoor crisis routing
        </div>
        <h1>SafePath AI</h1>
        <p>
          Upload a floor plan, mark critical nodes, simulate BLE/QR locations, trigger hazards, and calculate safer evacuation routes from one command surface.
        </p>
        <div className="hero__actions">
          <button className="primary-action" onClick={onStart}>
            Open dashboard
            <ArrowRight size={18} />
          </button>
          <div className="hero__stats">
            <span>
              <Building2 size={16} />
              DWG/DXF-ready
            </span>
            <span>
              <Route size={16} />
              Graph routing
            </span>
            <span>
              <Bot size={16} />
              Edge AI events
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
