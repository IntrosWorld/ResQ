import { Check, MapPin, QrCode, Route } from "lucide-react";
import type { AppState, Node, PersonLocation, RouteResult } from "../../shared/types";
import { resolvePersonStartNode } from "../../shared/routing";
import { MapCanvas } from "./MapCanvas";

interface UserDashboardProps {
  state: AppState;
  route?: RouteResult;
  selectedPersonId: string;
  onSelectedPersonChange: (personId: string) => void;
  onUpdatePerson: (personId: string, patch: Partial<Omit<PersonLocation, "id" | "updatedAt">>) => void;
  onCalculateRoute: (payload: { personId?: string; startNodeId?: string }) => void;
}

export function UserDashboard({ state, route, selectedPersonId, onSelectedPersonChange, onUpdatePerson, onCalculateRoute }: UserDashboardProps) {
  const person = state.people.find((item) => item.id === selectedPersonId) ?? state.people[0];
  const startNodeId = person ? resolvePersonStartNode(person) : undefined;
  const startNode = state.nodes.find((node) => node.id === startNodeId);

  return (
    <div className="dashboard-grid">
      <section className="workspace">
        <MapCanvas state={state} route={route} />
      </section>
      <aside className="control-stack">
        <section className="panel">
          <h3>
            <MapPin size={18} />
            My location
          </h3>
          {person ? (
            <div className="form-grid">
              <label>
                User
                <select value={person.id} onChange={(event) => onSelectedPersonChange(event.target.value)}>
                  {state.people.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="location-card">
                <strong>{startNode?.label ?? "Unknown"}</strong>
                <span>{person.qrNodeId ? "QR confirmed exact location" : "BLE estimated zone"}</span>
                <small>Confidence: {Math.round(person.confidence * 100)}%</small>
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel">
          <h3>
            <QrCode size={18} />
            QR checkpoint simulation
          </h3>
          {person ? <QrForm nodes={state.nodes} person={person} onUpdatePerson={onUpdatePerson} /> : null}
        </section>

        <section className="panel">
          <h3>
            <Route size={18} />
            Guidance
          </h3>
          {person ? (
            <button className="primary-action primary-action--wide" onClick={() => onCalculateRoute({ personId: person.id })}>
              Calculate my safest path
            </button>
          ) : null}
          {route?.steps.length ? (
            <ol className="steps">
              {route.steps.map((step) => (
                <li key={step.nodeId}>
                  <Check size={16} />
                  <span>{step.instruction}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Run a route to show step-by-step evacuation guidance.</p>
          )}
        </section>
      </aside>
    </div>
  );
}

function QrForm({
  nodes,
  person,
  onUpdatePerson
}: {
  nodes: Node[];
  person: PersonLocation;
  onUpdatePerson: UserDashboardProps["onUpdatePerson"];
}) {
  return (
    <label>
      Scan checkpoint
      <select value={person.qrNodeId ?? ""} onChange={(event) => onUpdatePerson(person.id, { qrNodeId: event.target.value || undefined })}>
        <option value="">No QR scanned</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.label}
          </option>
        ))}
      </select>
    </label>
  );
}
