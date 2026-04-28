// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { createSampleState } from "./shared/sampleData";

const bootstrapResponse = {
  state: createSampleState(),
  roles: ["admin", "clerk", "user"],
  nodeTypes: ["room", "pathway", "corridor", "junction", "staircase", "exit", "extinguisher", "camera", "sensor", "actuator", "ble_beacon", "qr_checkpoint"],
  cadRequirements: {
    accepted: ["dwg", "dxf", "svg", "png", "jpg", "jpeg"],
    recommendedLayers: ["WALLS", "ROOMS", "DOORS", "STAIRS", "EXITS", "CAMERAS", "SENSORS", "BEACONS", "QR_POINTS"],
    dwgConverterConfigured: false
  },
  yoloRecommendation: {
    localEdgeOnly: true,
    eventContract: ["cameraId", "hazardType", "confidence", "timestamp", "bbox", "nearestNodeId"],
    models: ["Ultralytics-compatible YOLO fire/smoke model"]
  }
};

describe("App routes", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(bootstrapResponse), { status: 200, headers: { "Content-Type": "application/json" } }))
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the public one-page homepage without the dashboard console", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "SafePath AI" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How SafePath Works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Designed For Custom Building Hardware" })).toBeInTheDocument();
    expect(screen.queryByText("Building Response Console")).not.toBeInTheDocument();
  });

  it("renders the dashboard route without homepage marketing sections", async () => {
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    await waitFor(() => expect(screen.getByText("Building Response Console")).toBeInTheDocument());
    expect(screen.queryByRole("heading", { name: "How SafePath Works" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Designed For Custom Building Hardware" })).not.toBeInTheDocument();
  });

  it("keeps add-node controls in the map toolbar instead of the node editor sidebar", async () => {
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    await waitFor(() => expect(screen.getByText("Building Response Console")).toBeInTheDocument());
    expect(screen.getByLabelText("Add node type")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset to default map/i })).toBeInTheDocument();
    expect(screen.queryByText("Add type")).not.toBeInTheDocument();
  });

  it("shows automatic path generation in the route connection controls", async () => {
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    await waitFor(() => expect(screen.getByRole("button", { name: /auto paths from map/i })).toBeInTheDocument());
  });

  it("shows automatic camera placement controls", async () => {
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    await waitFor(() => expect(screen.getByRole("button", { name: /auto cameras/i })).toBeInTheDocument());
  });

  it("renders the CCTV hazard simulation page", async () => {
    window.history.pushState({}, "", "/dashboard/cctv");

    render(<App />);

    await waitFor(() => expect(screen.getByText("Simulating Hazard Through CCTV")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /run sample detection/i })).toBeInTheDocument();
    expect(screen.getByText("Upload fire/smoke YOLO ONNX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset cctv simulation/i })).toBeInTheDocument();
  });

  it("renders the emergency collapse detection page", async () => {
    window.history.pushState({}, "", "/dashboard/collapse");

    render(<App />);

    await waitFor(() => expect(screen.getByText("Emergency Collapse Detection")).toBeInTheDocument());
    expect(screen.getByText("Upload FallSafe YOLO11 ONNX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start video and detect collapse/i })).toBeInTheDocument();
    expect(screen.getAllByText("Detected location").length).toBeGreaterThan(0);
    expect(screen.queryByText("Collapse node on map")).not.toBeInTheDocument();
    expect(screen.queryByText("Evacuation start")).not.toBeInTheDocument();
  });

  it("renders the restricted-area person detection page with notifications entry", async () => {
    window.history.pushState({}, "", "/dashboard/restricted");

    render(<App />);

    await waitFor(() => expect(screen.getByText("Restricted Area Person Detection")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /open notifications/i })).toBeInTheDocument();
    expect(screen.getByText("Upload YOLO COCO ONNX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start restricted-area detection/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove previous simulation data/i })).toBeInTheDocument();
  });
});
