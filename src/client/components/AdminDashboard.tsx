import { AlertTriangle, Camera, CheckCircle2, Link2, LocateFixed, MapPlus, RotateCcw, Route, Save, Sparkles, Trash2, Upload } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { AppState, Edge, Hazard, Node, PersonLocation, Point, RouteResult } from "../../shared/types";
import { MapCanvas } from "./MapCanvas";

interface AdminDashboardProps {
  state: AppState;
  nodeTypes: Node["type"][];
  selectedNodeId?: string;
  route?: RouteResult;
  busy: boolean;
  message: string;
  placingNodeType: Node["type"] | null;
  onSelectNode: (nodeId: string) => void;
  onPlaceNodeType: (type: Node["type"] | null) => void;
  onMapClick: (point: Point) => void;
  onUpload: (file: File) => void;
  onResetFloorMap: () => void;
  onUpdateNode: (nodeId: string, patch: Partial<Omit<Node, "id">>) => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateEdge: (edge: Omit<Edge, "id">) => void;
  onAutoGenerateCameras: () => void;
  autoCameraSummary: string;
  onAutoGenerateEdges: () => void;
  autoPathSummary: string;
  onUpdateEdge: (edgeId: string, patch: Partial<Omit<Edge, "id">>) => void;
  onDeleteEdge: (edgeId: string) => void;
  onSimulateHazard: (hazard: Omit<Hazard, "id" | "createdAt">) => void;
  onClearHazards: () => void;
  onUpdatePerson: (personId: string, patch: Partial<Omit<PersonLocation, "id" | "updatedAt">>) => void;
  onCalculateRoute: (payload: { personId?: string; startNodeId?: string }) => void;
}

export function AdminDashboard(props: AdminDashboardProps) {
  const selectedNode = props.state.nodes.find((node) => node.id === props.selectedNodeId);
  const activeHazards = props.state.hazards.filter((hazard) => hazard.active);
  const [connectionToolActive, setConnectionToolActive] = useState(false);
  const [connectionStartNodeId, setConnectionStartNodeId] = useState<string | undefined>();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>();
  const connectionStartNode = connectionStartNodeId ? props.state.nodes.find((node) => node.id === connectionStartNodeId) : undefined;
  const selectedEdge = selectedEdgeId ? props.state.edges.find((edge) => edge.id === selectedEdgeId) : undefined;

  function toggleConnectionTool() {
    setConnectionToolActive((active) => {
      const next = !active;
      setConnectionStartNodeId(undefined);
      if (next) {
        props.onPlaceNodeType(null);
      }
      return next;
    });
  }

  function handlePlaceNodeType(type: Node["type"] | null) {
    if (type) {
      setConnectionToolActive(false);
      setConnectionStartNodeId(undefined);
    }
    props.onPlaceNodeType(type);
  }

  function handleConnectionNodeClick(nodeId: string) {
    props.onSelectNode(nodeId);
    if (!connectionStartNodeId) {
      setConnectionStartNodeId(nodeId);
      return;
    }

    if (connectionStartNodeId === nodeId) {
      return;
    }

    const existingEdge = props.state.edges.find((edge) => connects(edge, connectionStartNodeId, nodeId));
    if (existingEdge) {
      setSelectedEdgeId(existingEdge.id);
      setConnectionStartNodeId(nodeId);
      return;
    }

    const from = props.state.nodes.find((node) => node.id === connectionStartNodeId);
    const to = props.state.nodes.find((node) => node.id === nodeId);
    if (!from || !to) {
      setConnectionStartNodeId(nodeId);
      return;
    }

    props.onCreateEdge({
      from: connectionStartNodeId,
      to: nodeId,
      distance: distanceBetween(from, to),
      status: "open"
    });
    setConnectionStartNodeId(nodeId);
  }

  function finishConnectionChain() {
    setConnectionStartNodeId(undefined);
  }

  return (
    <div className="dashboard-grid dashboard-grid--admin">
      <section className="workspace">
        <MapCanvas
          state={props.state}
          selectedNodeId={props.selectedNodeId}
          route={props.route}
          placingNodeType={props.placingNodeType}
          nodeTypes={props.nodeTypes}
          onNodeSelect={props.onSelectNode}
          onPlaceNodeType={handlePlaceNodeType}
          onMapClick={props.onMapClick}
          onNodeMove={(nodeId, point) => props.onUpdateNode(nodeId, point)}
          connectionToolActive={connectionToolActive}
          connectionStartNodeId={connectionStartNodeId}
          selectedEdgeId={selectedEdgeId}
          onConnectionNodeClick={handleConnectionNodeClick}
          onConnectionCancel={finishConnectionChain}
          onEdgeContext={setSelectedEdgeId}
        />
      </section>

      <aside className="control-stack">
        <Panel title="Floor map" icon={<Upload size={18} />}>
          <label className="file-drop">
            <input
              type="file"
              accept=".dwg,.dxf,.svg,.png,.jpg,.jpeg"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) props.onUpload(file);
              }}
            />
            <span>Upload DWG, DXF, SVG, PNG, JPG</span>
            <small>DWG is stored and marked for converter setup when no local converter exists.</small>
          </label>
          <div className="info-list">
            <span>Recommended DWG layers: WALLS, ROOMS, DOORS, STAIRS, EXITS, CAMERAS, SENSORS, BEACONS, QR_POINTS</span>
            <span>Manual node editing stays available after every upload.</span>
          </div>
          <button className="secondary-action" disabled={props.busy} onClick={props.onResetFloorMap}>
            <RotateCcw size={16} />
            Reset to default map
          </button>
        </Panel>

        <Panel title="Node editor" icon={<MapPlus size={18} />}>
          {selectedNode ? (
            <>
              <div className="node-editor__summary">
                <span>Selected</span>
                <strong>{selectedNode.label}</strong>
                <small>{selectedNode.type.replace("_", " ")}</small>
              </div>
              <NodeForm node={selectedNode} nodeTypes={props.nodeTypes} onUpdate={props.onUpdateNode} onDelete={props.onDeleteNode} />
            </>
          ) : (
            <p className="muted">Select a node on the map to edit label, type, and coordinates.</p>
          )}
        </Panel>

        <Panel title="Device placement" icon={<Camera size={18} />}>
          <button className="primary-action primary-action--wide" onClick={props.onAutoGenerateCameras} disabled={props.busy || props.state.nodes.length < 1}>
            <Camera size={16} />
            Auto cameras
          </button>
          {props.autoCameraSummary ? <p className="status-message">{props.autoCameraSummary}</p> : null}
          <div className="info-list">
            <span>Places cameras for halls, passages, exits, stairs, parking, lobby, veranda, kitchen, and entrances.</span>
            <span>Skips bathrooms, washrooms, toilets, bedrooms, and already covered areas.</span>
          </div>
        </Panel>

        <Panel title="Route connections" icon={<Link2 size={18} />}>
          <button className="primary-action primary-action--wide" onClick={props.onAutoGenerateEdges} disabled={props.busy || props.state.nodes.length < 2}>
            <Sparkles size={16} />
            Auto paths from map
          </button>
          {props.autoPathSummary ? <p className="status-message">{props.autoPathSummary}</p> : null}
          <div className="connection-tools">
            <button className={connectionToolActive ? "primary-action" : "secondary-action"} onClick={toggleConnectionTool}>
              {connectionToolActive ? "Stop drawing paths" : "Draw path on map"}
            </button>
            <p className="muted">
              {connectionToolActive
                ? connectionStartNode
                  ? `From ${connectionStartNode.label}: click the next node. Double-click the map to finish this chain.`
                  : "Click a node on the map to start a walkable path."
                : "Use this to define walkable routes between rooms, corridors, stairs, and exits."}
            </p>
          </div>
          {selectedEdge ? (
            <ConnectionSettings
              edge={selectedEdge}
              nodes={props.state.nodes}
              onUpdate={props.onUpdateEdge}
              onDelete={(edgeId) => {
                props.onDeleteEdge(edgeId);
                setSelectedEdgeId(undefined);
              }}
            />
          ) : null}
          <div className="edge-list">
            {props.state.edges.slice(0, 10).map((edge) => (
              <button key={edge.id} className={selectedEdgeId === edge.id ? "list-row list-row--selected" : "list-row"} onClick={() => setSelectedEdgeId(edge.id)}>
                <span>
                  {labelFor(props.state.nodes, edge.from)} {"->"} {labelFor(props.state.nodes, edge.to)}
                </span>
                <small>
                  {edge.distance.toFixed(2)} units | {edge.status}
                </small>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Hazard simulator" icon={<AlertTriangle size={18} />}>
          <HazardForm nodes={props.state.nodes} onSimulateHazard={props.onSimulateHazard} />
          <button className="secondary-action" onClick={props.onClearHazards}>
            Clear hazards
          </button>
          <div className="metric-strip">
            <span>{activeHazards.length} active</span>
            <span>{props.route?.blockedNodeIds.length ?? 0} blocked nodes</span>
          </div>
        </Panel>

        <Panel title="People and route" icon={<LocateFixed size={18} />}>
          <PeopleForm nodes={props.state.nodes} people={props.state.people} onUpdatePerson={props.onUpdatePerson} />
          <RouteForm nodes={props.state.nodes} people={props.state.people} onCalculateRoute={props.onCalculateRoute} />
          {props.route ? (
            <div className={`route-result route-result--${props.route.status}`}>
              <strong>{props.route.status === "ok" ? "Route calculated" : "Route unavailable"}</strong>
              <span>{props.route.message}</span>
            </div>
          ) : null}
        </Panel>

        <Panel title="Final graph summary" icon={<CheckCircle2 size={18} />}>
          <div className="summary-grid">
            <span>{props.state.nodes.length} nodes</span>
            <span>{props.state.edges.length} edges</span>
            <span>{props.state.nodes.filter((node) => node.type === "exit").length} exits</span>
            <span>{props.state.nodes.filter((node) => node.type === "sensor" || node.type === "camera").length} devices</span>
          </div>
          <div className="node-table">
            {props.state.nodes.map((node) => (
              <button key={node.id} onClick={() => props.onSelectNode(node.id)}>
                <span>{node.label}</span>
                <small>{node.type.replace("_", " ")}</small>
              </button>
            ))}
          </div>
          <button className="primary-action primary-action--wide" disabled={props.busy}>
            <Save size={16} />
            Graph ready for simulation
          </button>
          {props.message ? <p className="status-message">{props.message}</p> : null}
        </Panel>
      </aside>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <h3>
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function NodeForm({
  node,
  nodeTypes,
  onUpdate,
  onDelete
}: {
  node: Node;
  nodeTypes: Node["type"][];
  onUpdate: AdminDashboardProps["onUpdateNode"];
  onDelete: AdminDashboardProps["onDeleteNode"];
}) {
  return (
    <div className="form-grid">
      <label>
        Node label
        <input value={node.label} onChange={(event) => onUpdate(node.id, { label: event.target.value })} />
      </label>
      <label>
        Type
        <select value={node.type} onChange={(event) => onUpdate(node.id, { type: event.target.value as Node["type"] })}>
          {nodeTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <div className="coordinate-grid">
        <label>
          X
          <input type="number" value={node.x} onChange={(event) => onUpdate(node.id, { x: Number(event.target.value) })} />
        </label>
        <label>
          Y
          <input type="number" value={node.y} onChange={(event) => onUpdate(node.id, { y: Number(event.target.value) })} />
        </label>
      </div>
      <button className="danger-action" onClick={() => onDelete(node.id)}>
        <Trash2 size={16} />
        Delete node
      </button>
    </div>
  );
}

function ConnectionSettings({
  edge,
  nodes,
  onUpdate,
  onDelete
}: {
  edge: Edge;
  nodes: Node[];
  onUpdate: AdminDashboardProps["onUpdateEdge"];
  onDelete: AdminDashboardProps["onDeleteEdge"];
}) {
  return (
    <div className="connection-settings">
      <div>
        <span>Selected connection</span>
        <strong>
          {labelFor(nodes, edge.from)} {"->"} {labelFor(nodes, edge.to)}
        </strong>
      </div>
      <label>
        Status
        <select value={edge.status} onChange={(event) => onUpdate(edge.id, { status: event.target.value as Edge["status"] })}>
          <option value="open">open</option>
          <option value="blocked">blocked</option>
        </select>
      </label>
      <label>
        Distance
        <input type="number" min="0.01" step="0.01" value={edge.distance} onChange={(event) => onUpdate(edge.id, { distance: Number(event.target.value) })} />
      </label>
      <button className="danger-action" onClick={() => onDelete(edge.id)}>
        <Trash2 size={16} />
        Delete connection
      </button>
    </div>
  );
}

function EdgeForm({ nodes, onCreateEdge }: { nodes: Node[]; onCreateEdge: AdminDashboardProps["onCreateEdge"] }) {
  const first = nodes[0]?.id ?? "";
  const second = nodes[1]?.id ?? first;
  const [from, setFrom] = useLocal(first);
  const [to, setTo] = useLocal(second);
  const [distance, setDistance] = useLocal<string>("8");

  return (
    <div className="form-grid">
      <label>
        From
        <select value={from} onChange={(event) => setFrom(event.target.value)}>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        To
        <select value={to} onChange={(event) => setTo(event.target.value)}>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Distance
        <input type="number" min="1" value={distance} onChange={(event) => setDistance(event.target.value)} />
      </label>
      <button className="secondary-action" onClick={() => from !== to && onCreateEdge({ from, to, distance: Number(distance), status: "open" })}>
        Add connection
      </button>
    </div>
  );
}

function HazardForm({ nodes, onSimulateHazard }: { nodes: Node[]; onSimulateHazard: AdminDashboardProps["onSimulateHazard"] }) {
  const [nodeId, setNodeId] = useLocal(nodes[0]?.id ?? "");
  const [type, setType] = useLocal<Hazard["type"]>("fire");
  const [severity, setSeverity] = useLocal<Hazard["severity"]>("high");
  const [radius, setRadius] = useLocal<string>("95");
  const node = nodes.find((item) => item.id === nodeId) ?? nodes[0];

  return (
    <div className="form-grid">
      <label>
        Location
        <select value={nodeId} onChange={(event) => setNodeId(event.target.value)}>
          {nodes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Type
        <select value={type} onChange={(event) => setType(event.target.value as Hazard["type"])}>
          {["fire", "smoke", "gas", "structural", "security", "other"].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label>
        Severity
        <select value={severity} onChange={(event) => setSeverity(event.target.value as Hazard["severity"])}>
          {["low", "medium", "high", "critical"].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label>
        Radius
        <input value={radius} type="number" min="20" onChange={(event) => setRadius(event.target.value)} />
      </label>
      <button
        className="danger-action"
        onClick={() =>
          node &&
          onSimulateHazard({
            type,
            severity,
            radius: Number(radius),
            label: `${type} at ${node.label}`,
            nodeId: node.id,
            x: node.x,
            y: node.y,
            active: true
          })
        }
      >
        Simulate hazard
      </button>
    </div>
  );
}

function PeopleForm({
  nodes,
  people,
  onUpdatePerson
}: {
  nodes: Node[];
  people: PersonLocation[];
  onUpdatePerson: AdminDashboardProps["onUpdatePerson"];
}) {
  const [personId, setPersonId] = useLocal(people[0]?.id ?? "");
  const person = people.find((item) => item.id === personId) ?? people[0];

  if (!person) return null;

  return (
    <div className="form-grid">
      <label>
        Person
        <select value={person.id} onChange={(event) => setPersonId(event.target.value)}>
          {people.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        BLE estimate
        <select value={person.bleNodeId ?? ""} onChange={(event) => onUpdatePerson(person.id, { bleNodeId: event.target.value || undefined })}>
          <option value="">Unknown</option>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        QR confirmed
        <select value={person.qrNodeId ?? ""} onChange={(event) => onUpdatePerson(person.id, { qrNodeId: event.target.value || undefined })}>
          <option value="">Not scanned</option>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function RouteForm({
  nodes,
  people,
  onCalculateRoute
}: {
  nodes: Node[];
  people: PersonLocation[];
  onCalculateRoute: AdminDashboardProps["onCalculateRoute"];
}) {
  const [personId, setPersonId] = useLocal(people[0]?.id ?? "");
  const [startNodeId, setStartNodeId] = useLocal<string>("");

  return (
    <div className="form-grid">
      <label>
        Route person
        <select value={personId} onChange={(event) => setPersonId(event.target.value)}>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Or start node
        <select value={startNodeId} onChange={(event) => setStartNodeId(event.target.value)}>
          <option value="">Use person BLE/QR</option>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
      </label>
      <button className="primary-action primary-action--wide" onClick={() => onCalculateRoute(startNodeId ? { startNodeId } : { personId })}>
        <Route size={16} />
        Calculate safest path
      </button>
    </div>
  );
}

function labelFor(nodes: Node[], id: string): string {
  return nodes.find((node) => node.id === id)?.label ?? id;
}

function connects(edge: Edge, first: string, second: string): boolean {
  return (edge.from === first && edge.to === second) || (edge.from === second && edge.to === first);
}

function distanceBetween(from: Point, to: Point): number {
  return Math.max(0.01, Math.round(Math.hypot(from.x - to.x, from.y - to.y) * 100) / 100);
}

function useLocal<T extends string>(initial: T): [T, (value: T) => void] {
  return useState(initial);
}
