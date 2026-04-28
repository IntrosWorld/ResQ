// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@gsap/react", () => ({
  useGSAP: () => undefined
}));

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    to: vi.fn(),
    timeline: vi.fn(() => ({
      from: vi.fn(),
      to: vi.fn()
    }))
  }
}));

vi.mock("gsap/ScrollTrigger", () => ({
  default: {}
}));

import App from "./App";
import { createSampleState } from "./shared/sampleData";

const bootstrapResponse = {
  state: createSampleState(),
  roles: ["admin", "staff", "user"],
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
      "IntersectionObserver",
      class {
        disconnect = vi.fn();
        observe = vi.fn();
        takeRecords = vi.fn(() => []);
        unobserve = vi.fn();
      }
    );
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

    expect(screen.getByRole("heading", { level: 1, name: "Detect Threats. Coordinate Faster." })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Fire Detection" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "A real-time incident intelligence platform for immediate local response." })).toBeInTheDocument();
    expect(screen.queryByText("Local Building Command")).not.toBeInTheDocument();
  });

  it("renders the dashboard route without homepage marketing sections", async () => {
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    await waitFor(() => expect(screen.getByText("Local Building Command")).toBeInTheDocument());
    expect(screen.queryByRole("heading", { name: "How ResQ Works" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Designed For Custom Building Hardware" })).not.toBeInTheDocument();
  });

  it("keeps add-node controls in the map toolbar instead of the node editor sidebar", async () => {
    window.history.pushState({}, "", "/dashboard");

    render(<App />);

    await waitFor(() => expect(screen.getByText("Local Building Command")).toBeInTheDocument());
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

  it("renders the Gemini map assistant page", async () => {
    window.history.pushState({}, "", "/dashboard/assistant");

    render(<App />);

    await waitFor(() => expect(screen.getByText("ResQ Assistant")).toBeInTheDocument());
    expect(screen.getByText("Directions and Nearby Help")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask for directions/i)).toBeInTheDocument();
    expect(screen.getByText("Nearest hospital")).toBeInTheDocument();
  });

  it("opens city mode inside the app and shows city dashboard options", async () => {
    window.history.pushState({}, "", "/login");

    const { container } = render(<App />);

    fireEvent.change(screen.getByPlaceholderText("admin | staff | user"), { target: { value: "admin" } });
    fireEvent.change(container.querySelector('input[type="password"]') as HTMLInputElement, { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByRole("heading", { name: /select monitoring mode/i })).toBeInTheDocument(), { timeout: 2500 });
    fireEvent.click(screen.getByRole("button", { name: /enter city dashboard/i }));

    await waitFor(() => expect(window.location.pathname).toBe("/city"));
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fire detection/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unified command center/i })).toBeInTheDocument();
  });

  it("allows returning home and opening login again while still authenticated", async () => {
    window.history.pushState({}, "", "/login");

    const { container } = render(<App />);

    fireEvent.change(screen.getByPlaceholderText("admin | staff | user"), { target: { value: "admin" } });
    fireEvent.change(container.querySelector('input[type="password"]') as HTMLInputElement, { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByRole("heading", { name: /select monitoring mode/i })).toBeInTheDocument(), { timeout: 2500 });

    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    expect(screen.getByRole("heading", { name: /command access/i })).toBeInTheDocument();
  });

  it("renders separate in-app city dashboard pages", async () => {
    window.history.pushState({}, "", "/city/fire");

    render(<App />);

    await waitFor(() => expect(screen.getByText("Command Center")).toBeInTheDocument());
    expect(screen.getByText("Live Feed: Corridor C-12")).toBeInTheDocument();
    expect(screen.getAllByText("Hazard Detected").length).toBeGreaterThan(0);
    expect(screen.getByText("Action Center")).toBeInTheDocument();
    expect(window.location.href).not.toContain("localhost:3000/dashboards/fire");
  });
});
