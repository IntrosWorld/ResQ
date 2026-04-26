import { useEffect, useMemo, useState } from "react";
import type { AppState, Edge, Hazard, Node, PersonLocation, Point, RouteResult } from "./shared/types";
import { createSampleState } from "./shared/sampleData";
import {
  bootstrap,
  calculateRoute,
  clearAllHazards,
  createEdge,
  createHazard,
  createNode,
  deleteEdge,
  deleteNode,
  updateNode,
  updatePerson,
  uploadFloorMap
} from "./client/api";
import { AdminDashboard } from "./client/components/AdminDashboard";
import { ClerkDashboard } from "./client/components/ClerkDashboard";
import { HomePage } from "./client/components/HomePage";
import { Layout } from "./client/components/Layout";
import { UserDashboard } from "./client/components/UserDashboard";

const defaultNodeTypes: Node["type"][] = [
  "room",
  "corridor",
  "junction",
  "staircase",
  "exit",
  "extinguisher",
  "camera",
  "sensor",
  "actuator",
  "ble_beacon",
  "qr_checkpoint"
];

export default function App() {
  const [state, setState] = useState<AppState>(() => createSampleState());
  const [nodeTypes, setNodeTypes] = useState<Node["type"][]>(defaultNodeTypes);
  const [role, setRole] = useState<"admin" | "clerk" | "user">("admin");
  const [theme, setTheme] = useState<"light" | "dark">(() => (localStorage.getItem("safepath-theme") as "light" | "dark") || "dark");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("junction-main");
  const [selectedPersonId, setSelectedPersonId] = useState<string>("guest-a");
  const [placingNodeType, setPlacingNodeType] = useState<Node["type"] | null>(null);
  const [route, setRoute] = useState<RouteResult | undefined>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("safepath-theme", theme);
  }, [theme]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    safeScrollToTop();
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    run("Loaded SafePath demo state.", async () => {
      const response = await bootstrap();
      setState(response.state);
      setNodeTypes(response.nodeTypes);
      setSelectedPersonId(response.state.people[0]?.id ?? "");
      setSelectedNodeId(response.state.nodes.find((node) => node.type === "junction")?.id ?? response.state.nodes[0]?.id ?? "");
    });
  }, []);

  const selectedNode = useMemo(() => state.nodes.find((node) => node.id === selectedNodeId), [state.nodes, selectedNodeId]);

  async function run(successMessage: string, action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  function setServerState(nextState: AppState) {
    setState(nextState);
  }

  function handleUpload(file: File) {
    run(`Uploaded ${file.name}.`, async () => {
      const response = await uploadFloorMap(file);
      setServerState(response.state);
      setRoute(undefined);
    });
  }

  function handleMapClick(point: Point) {
    if (!placingNodeType) {
      return;
    }

    const label = `${placingNodeType.replace("_", " ")} ${state.nodes.length + 1}`;
    run(`Placed ${label}.`, async () => {
      const response = await createNode({ label, type: placingNodeType, x: point.x, y: point.y, floorId: "floor-1" });
      setServerState(response.state);
      setSelectedNodeId(response.node.id);
    });
  }

  function handleUpdateNode(nodeId: string, patch: Partial<Omit<Node, "id">>) {
    run("Node updated.", async () => {
      const response = await updateNode(nodeId, patch);
      setServerState(response.state);
    });
  }

  function handleDeleteNode(nodeId: string) {
    run("Node deleted.", async () => {
      const response = await deleteNode(nodeId);
      setServerState(response.state);
      setRoute(undefined);
      setSelectedNodeId(response.state.nodes[0]?.id ?? "");
    });
  }

  function handleCreateEdge(edge: Omit<Edge, "id">) {
    run("Connection added.", async () => {
      const response = await createEdge(edge);
      setServerState(response.state);
    });
  }

  function handleDeleteEdge(edgeId: string) {
    run("Connection removed.", async () => {
      const response = await deleteEdge(edgeId);
      setServerState(response.state);
      setRoute(undefined);
    });
  }

  function handleSimulateHazard(hazard: Omit<Hazard, "id" | "createdAt">) {
    run("Hazard simulated.", async () => {
      const response = await createHazard(hazard);
      setServerState(response.state);
      setRoute(undefined);
    });
  }

  function handleClearHazards() {
    run("Hazards cleared.", async () => {
      const response = await clearAllHazards();
      setServerState(response.state);
      setRoute(undefined);
    });
  }

  function handleUpdatePerson(personId: string, patch: Partial<Omit<PersonLocation, "id" | "updatedAt">>) {
    run("Person location updated.", async () => {
      const response = await updatePerson(personId, patch);
      setServerState(response.state);
    });
  }

  function handleCalculateRoute(payload: { personId?: string; startNodeId?: string }) {
    run("Route calculation complete.", async () => {
      const response = await calculateRoute(payload);
      setRoute(response.route);
    });
  }

  function navigate(to: string) {
    window.history.pushState({}, "", to);
    setPath(to);
    safeScrollToTop();
  }

  if (!path.startsWith("/dashboard")) {
    return <HomePage theme={theme} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} onDashboard={() => navigate("/dashboard")} />;
  }

  return (
    <div className="dashboard-page">
      <Layout
        role={role}
        theme={theme}
        onRoleChange={setRole}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        onHome={() => navigate("/")}
      >
        {role === "admin" ? (
          <AdminDashboard
            state={state}
            nodeTypes={nodeTypes}
            selectedNodeId={selectedNode?.id}
            route={route}
            busy={busy}
            message={message}
            placingNodeType={placingNodeType}
            onSelectNode={setSelectedNodeId}
            onPlaceNodeType={setPlacingNodeType}
            onMapClick={handleMapClick}
            onUpload={handleUpload}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onCreateEdge={handleCreateEdge}
            onDeleteEdge={handleDeleteEdge}
            onSimulateHazard={handleSimulateHazard}
            onClearHazards={handleClearHazards}
            onUpdatePerson={handleUpdatePerson}
            onCalculateRoute={handleCalculateRoute}
          />
        ) : null}

        {role === "clerk" ? <ClerkDashboard state={state} route={route} /> : null}

        {role === "user" ? (
          <UserDashboard
            state={state}
            route={route}
            selectedPersonId={selectedPersonId}
            onSelectedPersonChange={setSelectedPersonId}
            onUpdatePerson={handleUpdatePerson}
            onCalculateRoute={handleCalculateRoute}
          />
        ) : null}
      </Layout>
    </div>
  );
}

function safeScrollToTop() {
  if (typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("jsdom")) {
    return;
  }

  try {
    window.scrollTo({ top: 0, left: 0 });
  } catch {
    // Test environments may not implement scrolling.
  }
}
