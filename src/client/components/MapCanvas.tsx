import { CircleAlert, DoorOpen, MapPin, Radio, Shield, UserRound } from "lucide-react";
import type { AppState, Node, Point, RouteResult } from "../../shared/types";
import { resolvePersonStartNode } from "../../shared/routing";

interface MapCanvasProps {
  state: AppState;
  selectedNodeId?: string;
  route?: RouteResult;
  placingNodeType?: Node["type"] | null;
  onNodeSelect?: (nodeId: string) => void;
  onMapClick?: (point: Point) => void;
}

const nodeColors: Record<Node["type"], string> = {
  room: "#4f46e5",
  corridor: "#0891b2",
  junction: "#0f766e",
  staircase: "#7c3aed",
  exit: "#16a34a",
  extinguisher: "#dc2626",
  camera: "#2563eb",
  sensor: "#ea580c",
  actuator: "#9333ea",
  ble_beacon: "#ca8a04",
  qr_checkpoint: "#111827"
};

export function MapCanvas({ state, selectedNodeId, route, placingNodeType, onNodeSelect, onMapClick }: MapCanvasProps) {
  const { floorMap, nodes, edges, hazards, people } = state;
  const width = Math.max(1, floorMap.bounds.maxX - floorMap.bounds.minX);
  const height = Math.max(1, floorMap.bounds.maxY - floorMap.bounds.minY);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const routePoints = route?.nodeIds.map((id) => nodeById.get(id)).filter(Boolean) as Node[] | undefined;

  return (
    <div className={`map-panel ${placingNodeType ? "is-placing" : ""}`}>
      <div className="map-panel__header">
        <div>
          <strong>{floorMap.name}</strong>
          <span>{floorMap.message}</span>
        </div>
        <div className={`status-pill status-pill--${floorMap.importStatus}`}>{floorMap.importStatus.replace("_", " ")}</div>
      </div>

      <svg
        className="floor-map"
        viewBox={`${floorMap.bounds.minX} ${floorMap.bounds.minY} ${width} ${height}`}
        role="img"
        aria-label="Editable building floor map"
        onClick={(event) => {
          if (!onMapClick || !placingNodeType) {
            return;
          }
          const svg = event.currentTarget;
          const rect = svg.getBoundingClientRect();
          const x = floorMap.bounds.minX + ((event.clientX - rect.left) / rect.width) * width;
          const y = floorMap.bounds.minY + ((event.clientY - rect.top) / rect.height) * height;
          onMapClick({ x: Math.round(x), y: Math.round(y) });
        }}
      >
        <rect x={floorMap.bounds.minX} y={floorMap.bounds.minY} width={width} height={height} className="map-bg" />
        {floorMap.segments.map((segment) => (
          <polyline key={segment.id} points={segment.points.map((point) => `${point.x},${point.y}`).join(" ")} className={`cad-line cad-line--${segment.layer.toLowerCase()}`} />
        ))}

        {edges.map((edge) => {
          const from = nodeById.get(edge.from);
          const to = nodeById.get(edge.to);
          if (!from || !to) {
            return null;
          }
          return <line key={edge.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={`graph-edge graph-edge--${edge.status}`} />;
        })}

        {routePoints && routePoints.length > 1 ? (
          <polyline className="route-line" points={routePoints.map((node) => `${node.x},${node.y}`).join(" ")} />
        ) : null}

        {hazards.filter((hazard) => hazard.active).map((hazard) => (
          <g key={hazard.id}>
            <circle cx={hazard.x} cy={hazard.y} r={hazard.radius} className="hazard-radius" />
            <circle cx={hazard.x} cy={hazard.y} r="13" className="hazard-core" />
          </g>
        ))}

        {nodes.map((node) => (
          <g key={node.id} className="node-hit" onClick={(event) => {
            event.stopPropagation();
            onNodeSelect?.(node.id);
          }}>
            <circle
              cx={node.x}
              cy={node.y}
              r={selectedNodeId === node.id ? 13 : 10}
              fill={nodeColors[node.type]}
              className={selectedNodeId === node.id ? "node-dot node-dot--selected" : "node-dot"}
            />
            <text x={node.x} y={node.y - 16} className="node-label">
              {node.label}
            </text>
          </g>
        ))}

        {people.map((person) => {
          const node = resolvePersonStartNode(person) ? nodeById.get(resolvePersonStartNode(person)!) : undefined;
          if (!node) {
            return null;
          }
          return (
            <g key={person.id} className="person-marker">
              <circle cx={node.x + 16} cy={node.y + 16} r="8" />
              <text x={node.x + 28} y={node.y + 20}>
                {person.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="map-legend">
        <span>
          <MapPin size={14} />
          Nodes
        </span>
        <span>
          <DoorOpen size={14} />
          Exits
        </span>
        <span>
          <Radio size={14} />
          BLE/QR people
        </span>
        <span>
          <CircleAlert size={14} />
          Hazards
        </span>
        <span>
          <Shield size={14} />
          Safe route
        </span>
        <span>
          <UserRound size={14} />
          Live occupants
        </span>
      </div>
    </div>
  );
}
