// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppState } from "../../shared/types";
import { MapCanvas } from "./MapCanvas";

describe("MapCanvas", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps node markers proportional when imported DXF bounds are small", () => {
    const state: AppState = {
      floorMap: {
        id: "building001-0_floor1",
        buildingId: "building001",
        floorId: "0_floor1",
        name: "uploaded.dxf",
        sourceType: "dxf",
        importStatus: "ready",
        message: "Imported DXF",
        segments: [],
        labels: [],
        circles: [],
        arcs: [],
        bounds: {
          minX: -28656.4,
          minY: 6618.7,
          maxX: -28618.78,
          maxY: 6635.27
        }
      },
      nodes: [
        {
          id: "node-room-1",
          label: "BED ROOM",
          type: "room",
          x: -28638,
          y: 6626,
          floorId: "0_floor1"
        }
      ],
      edges: [],
      hazards: [],
      people: []
    };

    const { container } = render(<MapCanvas state={state} />);
    const nodeMarker = container.querySelector("circle.node-dot");

    expect(nodeMarker).toBeInTheDocument();
    expect(Number(nodeMarker?.getAttribute("r"))).toBeLessThan(0.4);
  });

  it("does not inflate DXF label text on small imported maps", () => {
    const state: AppState = {
      floorMap: {
        id: "building001-0_floor1",
        buildingId: "building001",
        floorId: "0_floor1",
        name: "uploaded.dxf",
        sourceType: "dxf",
        importStatus: "ready",
        message: "Imported DXF",
        segments: [],
        labels: [
          {
            id: "label-1",
            layer: "freecads.com",
            text: "BED ROOM",
            x: -28631.75,
            y: 6632.57,
            height: 0.2,
            rotation: 0
          }
        ],
        circles: [],
        arcs: [],
        bounds: {
          minX: -28656.4,
          minY: 6618.7,
          maxX: -28618.78,
          maxY: 6635.27
        }
      },
      nodes: [],
      edges: [],
      hazards: [],
      people: []
    };

    const { container } = render(<MapCanvas state={state} />);
    const cadLabel = container.querySelector("text.cad-label");

    expect(cadLabel).toBeInTheDocument();
    expect(Number(cadLabel?.getAttribute("font-size"))).toBeLessThan(0.5);
  });

  it("zooms and resets the map view from toolbar controls", () => {
    const { container } = render(<MapCanvas state={createMapState()} />);
    const svg = container.querySelector("svg.floor-map");
    const initialViewBox = svg?.getAttribute("viewBox");

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    const zoomedViewBox = svg?.getAttribute("viewBox");

    expect(zoomedViewBox).not.toBe(initialViewBox);

    fireEvent.click(screen.getByRole("button", { name: "Fit map" }));

    expect(svg?.getAttribute("viewBox")).toBe(initialViewBox);
  });

  it("contains wheel scrolling inside the map panel", () => {
    const { container } = render(<MapCanvas state={createMapState()} />);
    const header = container.querySelector(".map-panel__header") as HTMLElement;
    const wheelEvent = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 120 });

    header.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);
  });

  it("shows an add-node type selector in the map controls", () => {
    const onPlaceNodeType = vi.fn();
    render(
      <MapCanvas
        state={createMapState()}
        nodeTypes={["room", "pathway", "exit"]}
        placingNodeType={null}
        onPlaceNodeType={onPlaceNodeType}
      />
    );

    fireEvent.change(screen.getByLabelText("Add node type"), { target: { value: "exit" } });

    expect(onPlaceNodeType).toHaveBeenCalledWith("exit");
  });

  it("batches dense DXF segment geometry into layer paths", () => {
    const denseState = createMapState();
    denseState.floorMap.segments = Array.from({ length: 120 }, (_, index) => ({
      id: `seg-${index}`,
      layer: index % 2 === 0 ? "WALLS" : "ROOMS",
      points: [
        { x: index, y: 0 },
        { x: index, y: 100 }
      ],
      closed: false
    }));

    const { container } = render(<MapCanvas state={denseState} />);

    expect(container.querySelectorAll("polyline.cad-line")).toHaveLength(0);
    expect(container.querySelectorAll("path.cad-line-batch")).toHaveLength(2);
  });

  it("clicks nodes for path drawing when connection mode is active", () => {
    const onConnectionNodeClick = vi.fn();
    const { container } = render(<MapCanvas state={createMapState()} connectionToolActive onConnectionNodeClick={onConnectionNodeClick} />);
    const nodeHit = container.querySelector(".node-hit") as SVGGElement;

    fireEvent.pointerDown(nodeHit, { pointerId: 1, clientX: 500, clientY: 500, buttons: 1 });

    expect(onConnectionNodeClick).toHaveBeenCalledWith("node-room-1");
  });

  it("previews the next connection line from the active path node", () => {
    const { container } = render(<MapCanvas state={createMapState()} connectionToolActive connectionStartNodeId="node-room-1" />);
    const svg = container.querySelector("svg.floor-map") as SVGSVGElement;

    Object.defineProperty(svg, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 1000, height: 1000, right: 1000, bottom: 1000, x: 0, y: 0, toJSON: () => ({}) })
    });

    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 700, clientY: 520, buttons: 0 });

    expect(container.querySelector(".connection-preview-line")).toBeInTheDocument();
  });

  it("pans the map while route drawing is active when dragging empty space", () => {
    const { container } = render(<MapCanvas state={createMapState()} connectionToolActive connectionStartNodeId="node-room-1" />);
    const svg = container.querySelector("svg.floor-map") as SVGSVGElement;

    Object.defineProperty(svg, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 1000, height: 1000, right: 1000, bottom: 1000, x: 0, y: 0, toJSON: () => ({}) })
    });

    const initialViewBox = svg.getAttribute("viewBox");

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 500, clientY: 500, button: 0, buttons: 1 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 620, clientY: 500, buttons: 1 });
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 620, clientY: 500 });

    expect(svg.getAttribute("viewBox")).not.toBe(initialViewBox);
  });

  it("opens edge settings from a right-click on a connection", () => {
    const onEdgeContext = vi.fn();
    const state = createMapState();
    state.edges = [{ id: "edge-1", from: "node-room-1", to: "node-exit-1", distance: 10, status: "open" }];

    const { container } = render(<MapCanvas state={state} onEdgeContext={onEdgeContext} />);
    const edgeHit = container.querySelector(".graph-edge-hit") as SVGLineElement;

    fireEvent.contextMenu(edgeHit);

    expect(onEdgeContext).toHaveBeenCalledWith("edge-1");
  });

  it("moves nodes by dragging them on the map", () => {
    const onNodeMove = vi.fn();
    const { container } = render(<MapCanvas state={createMapState()} onNodeMove={onNodeMove} />);
    const svg = container.querySelector("svg.floor-map") as SVGSVGElement;
    const nodeHit = container.querySelector(".node-hit") as SVGGElement;

    Object.defineProperty(svg, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 1000, height: 1000, right: 1000, bottom: 1000, x: 0, y: 0, toJSON: () => ({}) })
    });

    fireEvent.pointerDown(nodeHit, { pointerId: 1, clientX: 500, clientY: 500, buttons: 1 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 600, clientY: 520, buttons: 1 });
    fireEvent.pointerUp(svg, { pointerId: 1, clientX: 600, clientY: 520 });

    expect(onNodeMove).toHaveBeenCalledWith(
      "node-room-1",
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number)
      })
    );
    expect(onNodeMove.mock.calls[0][1].x).toBeGreaterThan(50);
  });

  it("previews node movement with a transform before saving", () => {
    const onNodeMove = vi.fn();
    const { container } = render(<MapCanvas state={createMapState()} onNodeMove={onNodeMove} />);
    const svg = container.querySelector("svg.floor-map") as SVGSVGElement;
    const nodeHit = container.querySelector(".node-hit") as SVGGElement;

    Object.defineProperty(svg, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 1000, height: 1000, right: 1000, bottom: 1000, x: 0, y: 0, toJSON: () => ({}) })
    });

    fireEvent.pointerDown(nodeHit, { pointerId: 1, clientX: 500, clientY: 500, buttons: 1 });
    fireEvent.pointerMove(svg, { pointerId: 1, clientX: 650, clientY: 520, buttons: 1 });

    expect(onNodeMove).not.toHaveBeenCalled();
    expect(nodeHit.getAttribute("transform")).toContain("translate(");
  });
});

function createMapState(): AppState {
  return {
    floorMap: {
      id: "building001-0_floor1",
      buildingId: "building001",
      floorId: "0_floor1",
      name: "sample.dxf",
      sourceType: "dxf",
      importStatus: "ready",
      message: "Imported DXF",
      segments: [],
      labels: [],
      circles: [],
      arcs: [],
      bounds: {
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100
      }
    },
    nodes: [
      {
        id: "node-room-1",
        label: "Room 1",
        type: "room",
        x: 50,
        y: 50,
        floorId: "0_floor1"
      },
      {
        id: "node-exit-1",
        label: "Exit 1",
        type: "exit",
        x: 85,
        y: 50,
        floorId: "0_floor1"
      }
    ],
    edges: [],
    hazards: [],
    people: []
  };
}
