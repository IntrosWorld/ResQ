import { AlertOctagon, CheckCircle2, Radio, UsersRound } from "lucide-react";
import type { AppState, RouteResult } from "../../shared/types";
import { resolvePersonStartNode } from "../../shared/routing";
import { MapCanvas } from "./MapCanvas";

interface StaffDashboardProps {
  state: AppState;
  route?: RouteResult;
}

export function StaffDashboard({ state, route }: StaffDashboardProps) {
  const activeHazards = state.hazards.filter((hazard) => hazard.active);
  const exitCount = state.nodes.filter((node) => node.type === "exit").length;

  return (
    <div className="dashboard-grid">
      <section className="workspace">
        <MapCanvas state={state} route={route} />
      </section>
      <aside className="control-stack">
        <section className="panel">
          <h3>
            <AlertOctagon size={18} />
            Incident status
          </h3>
          <div className="summary-grid">
            <span>{activeHazards.length} hazards</span>
            <span>{state.people.length} tracked people</span>
            <span>{exitCount} exits</span>
            <span>{route?.status ?? "no route run"}</span>
          </div>
        </section>

        <section className="panel">
          <h3>
            <UsersRound size={18} />
            Occupants
          </h3>
          <div className="node-table">
            {state.people.map((person) => {
              const nodeId = resolvePersonStartNode(person);
              const node = state.nodes.find((item) => item.id === nodeId);
              return (
                <button key={person.id}>
                  <span>{person.label}</span>
                  <small>{node ? `${node.label} (${person.qrNodeId ? "QR" : "BLE"})` : "unknown location"}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <h3>
            <Radio size={18} />
            Active hazards
          </h3>
          {activeHazards.length === 0 ? <p className="muted">No active hazards in the simulation.</p> : null}
          {activeHazards.map((hazard) => (
            <div key={hazard.id} className="incident-row">
              <strong>{hazard.label}</strong>
              <span>
                {hazard.type} / {hazard.severity} / radius {hazard.radius}
              </span>
            </div>
          ))}
        </section>

        <section className="panel">
          <h3>
            <CheckCircle2 size={18} />
            Response actions
          </h3>
          <div className="action-list">
            <span>Alarms armed for local actuator integration</span>
            <span>Emergency services event payload ready</span>
            <span>Camera/sensor event contract configured</span>
            <span>Route overlay visible to staff and guests</span>
          </div>
        </section>
      </aside>
    </div>
  );
}
