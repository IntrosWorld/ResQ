import { ArrowRight, BellRing, Building2, Camera, CheckCircle2, Database, DoorOpen, Flame, Map, Menu, Moon, Radio, Route, ShieldAlert, Sun, Upload } from "lucide-react";

interface HomePageProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onDashboard: () => void;
}

const workflow = [
  {
    icon: <Upload size={20} />,
    title: "Upload the floor plan",
    body: "Start from DWG, DXF, SVG, or image plans. Admins can keep editing nodes after import."
  },
  {
    icon: <Map size={20} />,
    title: "Mark building nodes",
    body: "Rooms, junctions, stairs, exits, cameras, sensors, BLE beacons, QR checkpoints, and actuators become one editable graph."
  },
  {
    icon: <Flame size={20} />,
    title: "Detect or simulate danger",
    body: "Camera and sensor events map hazards to the nearest node and block unsafe paths."
  },
  {
    icon: <Route size={20} />,
    title: "Guide people out",
    body: "BLE estimates and QR confirmations feed safest-route guidance for guests, staff, and responders."
  }
];

const modules = [
  "Admin map onboarding",
  "Staff incident monitoring",
  "Guest evacuation guidance",
  "Sensor and camera event API",
  "BLE and QR checkpoint support",
  "Neon-ready data model"
];

export function HomePage({ theme, onThemeToggle, onDashboard }: HomePageProps) {
  return (
    <main className="site">
      <nav className="site-nav" aria-label="Homepage">
        <button className="site-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ShieldAlert size={19} />
          <span>ResQ</span>
        </button>
        <div className="site-nav__links">
          <a href="#how">How it works</a>
          <a href="#platform">Platform</a>
          <a href="#hardware">Hardware</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="site-nav__actions">
          <button className="site-icon-button" onClick={onThemeToggle} aria-label="Toggle color theme" title="Toggle color theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="site-nav__button" onClick={onDashboard}>
            Dashboard
          </button>
        </div>
      </nav>

      <section className="site-hero">
        <div className="site-hero__visual" aria-hidden="true">
          <div className="building-scene">
            <div className="scene-room scene-room--a" />
            <div className="scene-room scene-room--b" />
            <div className="scene-room scene-room--c" />
            <div className="scene-room scene-room--d" />
            <div className="scene-corridor scene-corridor--main" />
            <div className="scene-corridor scene-corridor--cross" />
            <div className="scene-route scene-route--one" />
            <div className="scene-route scene-route--two" />
            <div className="scene-person" />
            <div className="scene-node scene-node--junction" />
            <div className="scene-exit" />
            <div className="scene-hazard" />
            <div className="scene-device scene-device--camera" />
            <div className="scene-device scene-device--beacon" />
          </div>
        </div>
        <div className="site-hero__content">
          <p className="site-eyebrow">
            <Radio size={16} />
            Indoor crisis-response platform
          </p>
          <h1>ResQ</h1>
          <p className="site-hero__lead">
            Turn building maps, sensors, cameras, BLE beacons, and QR checkpoints into live evacuation guidance for hotels and large facilities.
          </p>
          <div className="site-hero__actions">
            <button className="site-primary" onClick={onDashboard}>
              Open Dashboard
              <ArrowRight size={18} />
            </button>
            <a className="site-secondary" href="#how">
              See how it works
            </a>
          </div>
        </div>
        <div className="site-hero__status" aria-label="ResQ system status preview">
          <span>
            <Building2 size={15} />
            Floor graph online
          </span>
          <span>
            <DoorOpen size={15} />2 exits clear
          </span>
          <span>
            <BellRing size={15} />1 hazard isolated
          </span>
        </div>
      </section>

      <section className="site-section site-section--light" id="how">
        <div className="site-section__header">
          <p className="site-kicker">Operating flow</p>
          <h2>How ResQ Works</h2>
          <p>One setup workflow becomes a live emergency graph that every role can use during drills or incidents.</p>
        </div>
        <div className="workflow-grid">
          {workflow.map((item, index) => (
            <article className="workflow-card" key={item.title}>
              <div className="workflow-card__top">
                <span>{index + 1}</span>
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section" id="platform">
        <div className="platform-layout">
          <div>
            <p className="site-kicker">Platform modules</p>
            <h2>Built As A Customizable Building Safety Layer</h2>
            <p>
              Companies can adapt nodes, devices, roles, response actions, branding, and floor plans without changing the core route engine.
            </p>
          </div>
          <div className="module-list">
            {modules.map((module) => (
              <div className="module-row" key={module}>
                <CheckCircle2 size={18} />
                <span>{module}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-section--hardware" id="hardware">
        <div className="hardware-copy">
          <p className="site-kicker">Edge and IoT ready</p>
          <h2>Designed For Custom Building Hardware</h2>
          <p>
            Run hazard detection locally on a Raspberry Pi, mini PC, laptop, NVR server, ESP32-CAM, IP camera, or CCTV feed. Send only event data to the backend.
          </p>
        </div>
        <div className="hardware-grid">
          <span>
            <Camera size={18} />
            Camera / CCTV
          </span>
          <span>
            <Flame size={18} />
            Fire / smoke / gas
          </span>
          <span>
            <Database size={18} />
            Neon database
          </span>
          <span>
            <Menu size={18} />
            Manual node editing
          </span>
        </div>
      </section>

      <section className="site-section site-contact" id="contact">
        <div>
          <p className="site-kicker">Ready for demo</p>
          <h2>Open The Dashboard And Run A Simulation</h2>
          <p>Upload a map, move people, trigger a hazard, and calculate the safest path to an exit.</p>
        </div>
        <button className="site-primary" onClick={onDashboard}>
          Launch Dashboard
          <ArrowRight size={18} />
        </button>
      </section>
    </main>
  );
}
