import { CircleAlert, DoorOpen, MapPin, Maximize2, Plus, Radio, RotateCcw, Shield, UserRound, ZoomIn, ZoomOut } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import type { AppState, Bounds, DxfSegment, FloorMap, Node, Point, RouteResult } from "../../shared/types";
import { resolvePersonStartNode } from "../../shared/routing";

interface MapCanvasProps {
  state: AppState;
  selectedNodeId?: string;
  route?: RouteResult;
  placingNodeType?: Node["type"] | null;
  nodeTypes?: Node["type"][];
  connectionToolActive?: boolean;
  connectionStartNodeId?: string;
  selectedEdgeId?: string;
  onNodeSelect?: (nodeId: string) => void;
  onMapClick?: (point: Point) => void;
  onNodeMove?: (nodeId: string, point: Point) => void;
  onPlaceNodeType?: (type: Node["type"] | null) => void;
  onConnectionNodeClick?: (nodeId: string) => void;
  onConnectionCancel?: () => void;
  onEdgeContext?: (edgeId: string) => void;
  onResetFloorMap?: () => void;
}

interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

type Interaction =
  | { type: "pan"; pointerId: number; startClient: Point; startViewBox: ViewBox }
  | { type: "node"; pointerId: number; nodeId: string };

const nodeColors: Record<Node["type"], string> = {
  room: "#4f46e5",
  pathway: "#0891b2",
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

export function MapCanvas({
  state,
  selectedNodeId,
  route,
  placingNodeType,
  nodeTypes,
  connectionToolActive = false,
  connectionStartNodeId,
  selectedEdgeId,
  onNodeSelect,
  onMapClick,
  onNodeMove,
  onPlaceNodeType,
  onConnectionNodeClick,
  onConnectionCancel,
  onEdgeContext,
  onResetFloorMap
}: MapCanvasProps) {
  const { floorMap, nodes, edges, hazards, people } = state;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nodeGroupRefs = useRef(new Map<string, SVGGElement>());
  const dragPointRef = useRef<{ nodeId: string; point: Point } | null>(null);
  const baseViewBox = useMemo(
    () => boundsToViewBox(addViewPadding(floorMap.bounds)),
    [floorMap.bounds.maxX, floorMap.bounds.maxY, floorMap.bounds.minX, floorMap.bounds.minY]
  );
  const [viewBox, setViewBox] = useState<ViewBox>(baseViewBox);
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [nodeOverrides, setNodeOverrides] = useState<Record<string, Point>>({});
  const [connectionPreviewPoint, setConnectionPreviewPoint] = useState<Point | null>(null);
  const width = Math.max(1, viewBox.width);
  const height = Math.max(1, viewBox.height);
  const markerRadius = getMarkerRadius(width, height);
  const selectedMarkerRadius = markerRadius * 1.35;
  const labelOffset = markerRadius * 2.25;
  const nodeLabelSize = markerRadius * 1.35;
  const personOffset = markerRadius * 1.9;
  const personLabelOffset = markerRadius * 3.2;
  const cadLabelSpan = Math.max(baseViewBox.width, baseViewBox.height);
  const displayNodes = useMemo(() => nodes.map((node) => ({ ...node, ...(nodeOverrides[node.id] ?? {}) })), [nodeOverrides, nodes]);
  const nodeById = new Map(displayNodes.map((node) => [node.id, node]));
  const routePoints = route?.nodeIds.map((id) => nodeById.get(id)).filter(Boolean) as Node[] | undefined;
  const connectionStartNode = connectionStartNodeId ? nodeById.get(connectionStartNodeId) : undefined;

  useEffect(() => {
    setViewBox(baseViewBox);
    setInteraction(null);
    setNodeOverrides({});
    setConnectionPreviewPoint(null);
    dragPointRef.current = null;
  }, [baseViewBox]);

  useEffect(() => {
    setNodeOverrides((current) => {
      const ids = Object.keys(current);
      if (ids.length === 0) {
        return current;
      }

      const next = { ...current };
      for (const id of ids) {
        delete next[id];
      }
      return next;
    });
  }, [nodes]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return undefined;
    }

    const preventPageScroll = (event: globalThis.WheelEvent) => {
      event.preventDefault();
    };

    panel.addEventListener("wheel", preventPageScroll, { passive: false });
    return () => panel.removeEventListener("wheel", preventPageScroll);
  }, []);

  function mapPointFromEvent(event: { clientX: number; clientY: number }): Point | undefined {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return undefined;
    return {
      x: viewBox.minX + ((event.clientX - rect.left) / rect.width) * viewBox.width,
      y: viewBox.minY + ((event.clientY - rect.top) / rect.height) * viewBox.height
    };
  }

  function zoom(factor: number, center?: Point) {
    setViewBox((current) => zoomViewBox(current, baseViewBox, factor, center));
  }

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    const center = mapPointFromEvent(event) ?? viewBoxCenter(viewBox);
    zoom(event.deltaY < 0 ? 0.86 : 1.16, center);
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (placingNodeType || event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture?.(event.pointerId);
    setInteraction({
      type: "pan",
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startViewBox: viewBox
    });
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (connectionToolActive && connectionStartNodeId) {
      const point = mapPointFromEvent(event);
      if (point) {
        setConnectionPreviewPoint(roundPoint(point));
      }
    }

    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    if (interaction.type === "node") {
      const point = mapPointFromEvent(event);
      if (point) {
        const roundedPoint = roundPoint(point);
        dragPointRef.current = { nodeId: interaction.nodeId, point: roundedPoint };
        scheduleNodeDragRender(interaction.nodeId, roundedPoint);
      }
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    const deltaX = ((event.clientX - interaction.startClient.x) / rect.width) * interaction.startViewBox.width;
    const deltaY = ((event.clientY - interaction.startClient.y) / rect.height) * interaction.startViewBox.height;
    setViewBox({
      ...interaction.startViewBox,
      minX: interaction.startViewBox.minX - deltaX,
      minY: interaction.startViewBox.minY - deltaY
    });
  }

  function finishInteraction(event: PointerEvent<SVGSVGElement>) {
    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    const draggedPoint = dragPointRef.current;
    if (interaction.type === "node" && draggedPoint?.nodeId === interaction.nodeId) {
      setNodeOverrides((current) => ({ ...current, [interaction.nodeId]: draggedPoint.point }));
      onNodeMove?.(interaction.nodeId, draggedPoint.point);
    }

    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture can already be released by the browser when the drag ends outside the SVG.
    }
    setInteraction(null);
    dragPointRef.current = null;
  }

  function handleNodePointerDown(event: PointerEvent<SVGGElement>, node: Node) {
    event.preventDefault();
    event.stopPropagation();

    if (connectionToolActive) {
      onConnectionNodeClick?.(node.id);
      return;
    }

    onNodeSelect?.(node.id);

    if (!onNodeMove || placingNodeType || event.button !== 0) {
      return;
    }

    svgRef.current?.setPointerCapture?.(event.pointerId);
    dragPointRef.current = { nodeId: node.id, point: { x: node.x, y: node.y } };
    setInteraction({ type: "node", pointerId: event.pointerId, nodeId: node.id });
  }

  function scheduleNodeDragRender(nodeId: string, point: Point) {
    const nodeGroup = nodeGroupRefs.current.get(nodeId);
    nodeGroup?.setAttribute("transform", nodeTransform(point));
  }

  return (
    <div
      ref={panelRef}
      className={`map-panel ${placingNodeType ? "is-placing" : ""} ${connectionToolActive ? "is-connecting" : ""} ${
        interaction?.type === "pan" ? "is-panning" : ""
      }`}
    >
      <div className="map-panel__header">
        <div>
          <strong>{floorMap.name}</strong>
          <span>{floorMap.message}</span>
        </div>
        <div className="map-panel__actions">
          {nodeTypes && onPlaceNodeType ? (
            <label className="map-node-mode">
              <Plus size={15} />
              <span>Add node</span>
              <select
                aria-label="Add node type"
                value={placingNodeType ?? ""}
                onChange={(event) => onPlaceNodeType((event.target.value || null) as Node["type"] | null)}
              >
                <option value="">Move / pan</option>
                {nodeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="map-tools" aria-label="Map controls">
            {onResetFloorMap ? (
              <button type="button" aria-label="Reset to default map" title="Reset to default map" onClick={onResetFloorMap}>
                <RotateCcw size={16} />
              </button>
            ) : null}
            <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => zoom(0.76)}>
              <ZoomIn size={16} />
            </button>
            <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => zoom(1.24)}>
              <ZoomOut size={16} />
            </button>
            <button type="button" aria-label="Fit map" title="Fit map" onClick={() => setViewBox(baseViewBox)}>
              <Maximize2 size={16} />
            </button>
          </div>
          <div className={`status-pill status-pill--${floorMap.importStatus}`}>{floorMap.importStatus.replace("_", " ")}</div>
        </div>
      </div>

      <svg
        ref={svgRef}
        className={`floor-map ${interaction?.type === "node" ? "floor-map--dragging-node" : ""}`}
        viewBox={`${viewBox.minX} ${viewBox.minY} ${width} ${height}`}
        role="img"
        aria-label="Editable building floor map"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        onDoubleClick={(event) => {
          if (!connectionToolActive) {
            return;
          }
          event.preventDefault();
          onConnectionCancel?.();
          setConnectionPreviewPoint(null);
        }}
        onClick={(event) => {
          if (!onMapClick || !placingNodeType) {
            return;
          }
          const point = mapPointFromEvent(event);
          if (point) {
            onMapClick(roundPoint(point));
          }
        }}
      >
        <rect x={viewBox.minX} y={viewBox.minY} width={width} height={height} className="map-bg" />
        <CadGeometryLayer floorMap={floorMap} labelSpan={cadLabelSpan} />

        {edges.map((edge) => {
          const from = nodeById.get(edge.from);
          const to = nodeById.get(edge.to);
          if (!from || !to) {
            return null;
          }
          return (
            <g key={edge.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className="graph-edge-hit"
                onContextMenu={(event) => {
                  event.preventDefault();
                  onEdgeContext?.(edge.id);
                }}
              />
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={`graph-edge graph-edge--${edge.status} ${selectedEdgeId === edge.id ? "graph-edge--selected" : ""}`}
              />
            </g>
          );
        })}

        {connectionToolActive && connectionStartNode && connectionPreviewPoint ? (
          <line
            x1={connectionStartNode.x}
            y1={connectionStartNode.y}
            x2={connectionPreviewPoint.x}
            y2={connectionPreviewPoint.y}
            className="connection-preview-line"
          />
        ) : null}

        {routePoints && routePoints.length > 1 ? (
          <polyline className="route-line" points={routePoints.map((node) => `${node.x},${node.y}`).join(" ")} />
        ) : null}

        {hazards.filter((hazard) => hazard.active).map((hazard) => (
          <g key={hazard.id}>
            <circle cx={hazard.x} cy={hazard.y} r={hazard.radius} className="hazard-radius" />
            <circle cx={hazard.x} cy={hazard.y} r={markerRadius * 1.2} className="hazard-core" />
          </g>
        ))}

        {displayNodes.map((node) => (
          <g
            key={node.id}
            ref={(element) => {
              if (element) {
                nodeGroupRefs.current.set(node.id, element);
              } else {
                nodeGroupRefs.current.delete(node.id);
              }
            }}
            className="node-hit"
            transform={nodeTransform(node)}
            onPointerDown={(event) => handleNodePointerDown(event, node)}
            onClick={(event) => {
            event.stopPropagation();
            onNodeSelect?.(node.id);
          }}>
            <circle
              cx={0}
              cy={0}
              r={selectedNodeId === node.id ? selectedMarkerRadius : markerRadius}
              fill={nodeColors[node.type]}
              className={selectedNodeId === node.id ? "node-dot node-dot--selected" : "node-dot"}
            />
            <text x={0} y={-labelOffset} className="node-label" fontSize={nodeLabelSize}>
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
              <circle cx={node.x + personOffset} cy={node.y + personOffset} r={markerRadius * 0.82} />
              <text x={node.x + personLabelOffset} y={node.y + personOffset * 1.15} fontSize={nodeLabelSize * 0.94}>
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

const CadGeometryLayer = memo(function CadGeometryLayer({ floorMap, labelSpan }: { floorMap: FloorMap; labelSpan: number }) {
  const segmentPaths = useMemo(() => buildSegmentPathGroups(floorMap.segments), [floorMap.segments]);

  return (
    <>
      {segmentPaths.map((group) => (
        <path key={group.layer} d={group.d} className={`cad-line cad-line-batch ${layerClass("cad-line", group.layer)}`} data-layer={group.layer} />
      ))}
      {floorMap.circles.map((circle) => (
        <circle key={circle.id} cx={circle.x} cy={circle.y} r={circle.radius} className={`cad-circle ${layerClass("cad-circle", circle.layer)}`} />
      ))}
      {floorMap.arcs.map((arc) => (
        <path key={arc.id} d={arcPath(arc)} className={`cad-arc ${layerClass("cad-arc", arc.layer)}`} />
      ))}
      {floorMap.labels.map((label) => (
        <text
          key={label.id}
          x={label.x}
          y={label.y}
          className={`cad-label ${layerClass("cad-label", label.layer)}`}
          fontSize={getCadLabelSize(label.height, labelSpan)}
          transform={label.rotation ? `rotate(${label.rotation} ${label.x} ${label.y})` : undefined}
        >
          {label.text}
        </text>
      ))}
    </>
  );
});

function addViewPadding(bounds: Bounds): Bounds {
  const sourceWidth = Math.max(1, bounds.maxX - bounds.minX);
  const sourceHeight = Math.max(1, bounds.maxY - bounds.minY);
  const padding = Math.max(Math.max(sourceWidth, sourceHeight) * 0.04, 1);
  return {
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding
  };
}

function boundsToViewBox(bounds: Bounds): ViewBox {
  return {
    minX: bounds.minX,
    minY: bounds.minY,
    width: Math.max(1, bounds.maxX - bounds.minX),
    height: Math.max(1, bounds.maxY - bounds.minY)
  };
}

function zoomViewBox(current: ViewBox, base: ViewBox, factor: number, center = viewBoxCenter(current)): ViewBox {
  const minWidth = Math.max(base.width * 0.02, 0.001);
  const maxWidth = base.width * 12;
  const nextWidth = clamp(current.width * factor, minWidth, maxWidth);
  const appliedFactor = nextWidth / current.width;
  const nextHeight = current.height * appliedFactor;

  return {
    minX: center.x - (center.x - current.minX) * appliedFactor,
    minY: center.y - (center.y - current.minY) * appliedFactor,
    width: nextWidth,
    height: nextHeight
  };
}

function viewBoxCenter(viewBox: ViewBox): Point {
  return {
    x: viewBox.minX + viewBox.width / 2,
    y: viewBox.minY + viewBox.height / 2
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundPoint(point: Point): Point {
  return {
    x: Math.round(point.x * 100) / 100,
    y: Math.round(point.y * 100) / 100
  };
}

function getMarkerRadius(width: number, height: number): number {
  return Math.max(width, height) * 0.006;
}

function getCadLabelSize(rawHeight: number, mapSpan: number): number {
  const fallbackSize = mapSpan * 0.006;
  const minSize = mapSpan * 0.0025;
  const maxSize = mapSpan * 0.032;
  const preferredSize = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : fallbackSize;
  return Math.min(Math.max(preferredSize, minSize), maxSize);
}

function buildSegmentPathGroups(segments: DxfSegment[]): Array<{ layer: string; d: string }> {
  const layerCommands = new Map<string, string[]>();

  for (const segment of segments) {
    const command = segmentPathData(segment);
    if (!command) {
      continue;
    }

    const commands = layerCommands.get(segment.layer) ?? [];
    commands.push(command);
    layerCommands.set(segment.layer, commands);
  }

  return [...layerCommands.entries()].map(([layer, commands]) => ({ layer, d: commands.join(" ") }));
}

function segmentPathData(segment: DxfSegment): string {
  if (segment.points.length < 2) {
    return "";
  }

  const path = segment.points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  return segment.closed ? `${path} Z` : path;
}

function layerClass(prefix: string, layer: string): string {
  const safeLayer = layer.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return `${prefix}--${safeLayer || "0"}`;
}

function nodeTransform(point: Point): string {
  return `translate(${point.x} ${point.y})`;
}

function arcPath(arc: { x: number; y: number; radius: number; startAngle: number; endAngle: number }): string {
  const start = polarPoint(arc.x, arc.y, arc.radius, arc.startAngle);
  const end = polarPoint(arc.x, arc.y, arc.radius, arc.endAngle);
  const delta = Math.abs(arc.endAngle - arc.startAngle);
  const largeArc = delta > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${arc.radius} ${arc.radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function polarPoint(x: number, y: number, radius: number, angle: number): Point {
  const radians = (angle * Math.PI) / 180;
  return {
    x: Math.round((x + radius * Math.cos(radians)) * 100) / 100,
    y: Math.round((y + radius * Math.sin(radians)) * 100) / 100
  };
}
