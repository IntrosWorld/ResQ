import { useEffect, useMemo, useState } from "react";
import type { AppState, Edge, Hazard, LocalModelStatus, Node, PersonLocation, Point, RouteResult, SystemNotification } from "./shared/types";
import { createSampleState } from "./shared/sampleData";
import {
  autoGenerateCameras,
  autoGenerateEdges,
  bootstrap,
  calculateRoute,
  clearAllHazards,
  createEdge,
  createHazard,
  createNode,
  deleteEdge,
  deleteNode,
  getLocalYoloModelStatus,
  getLocalFallSafeModelStatus,
  getLocalCocoPersonModelStatus,
  resetFloorMap,
  sendAlertNotification,
  updateEdge,
  updateNode,
  updatePerson,
  uploadFloorMap
} from "./client/api";
import { AdminDashboard } from "./client/components/AdminDashboard";
import { AssistantMapPage } from "./client/components/AssistantMapPage";
import { StaffDashboard } from "./client/components/StaffDashboard";
import { CctvSimulationPage } from "./client/components/CctvSimulationPage";
import { CollapseDetectionPage } from "./client/components/CollapseDetectionPage";
import { Layout } from "./client/components/Layout";
import { NotificationCenter } from "./client/components/NotificationCenter";
import { TwilioAlertSetup, loadAlertConfig, type AlertConfig } from "./client/components/TwilioAlertSetup";
import { RestrictedAreaPage } from "./client/components/RestrictedAreaPage";
import { UserDashboard } from "./client/components/UserDashboard";
import { BorrowHomePage } from "./client/components/BorrowHomePage";
import { LoginPage } from "./client/components/LoginPage";
import { AnalyticsPage } from "./client/components/AnalyticsPage";
import { ModeSelectorPage } from "./client/components/ModeSelectorPage";
import { CityDashboardsPage } from "./client/components/borrow/CityDashboardsPage";
import FireEmergencyDashboard from "./client/components/borrow/dashboards/FireEmergencyDashboard";
import SecurityDashboard from "./client/components/borrow/dashboards/SecurityDashboard";
import MedicalDashboard from "./client/components/borrow/dashboards/MedicalDashboard";
import DisasterManagementDashboard from "./client/components/borrow/dashboards/DisasterManagementDashboard";
import OperationalCenterDashboard from "./client/components/borrow/dashboards/OperationalCenterDashboard";
import UnifiedCommandDashboard from "./client/components/borrow/dashboards/UnifiedCommandDashboard";

const defaultNodeTypes: Node["type"][] = [
  "room",
  "pathway",
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
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<"admin" | "staff" | "user">("admin");
  const [theme, setTheme] = useState<"light" | "dark">(() => (localStorage.getItem("resq-theme") as "light" | "dark") || "dark");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("junction-main");
  const [selectedPersonId, setSelectedPersonId] = useState<string>("guest-a");
  const [placingNodeType, setPlacingNodeType] = useState<Node["type"] | null>(null);
  const [route, setRoute] = useState<RouteResult | undefined>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [autoPathSummary, setAutoPathSummary] = useState<string>("");
  const [autoCameraSummary, setAutoCameraSummary] = useState<string>("");
  const [localModelStatus, setLocalModelStatus] = useState<LocalModelStatus | undefined>();
  const [fallSafeModelStatus, setFallSafeModelStatus] = useState<LocalModelStatus | undefined>();
  const [cocoPersonModelStatus, setCocoPersonModelStatus] = useState<LocalModelStatus | undefined>();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(() => loadAlertConfig());
  const [alertSetupOpen, setAlertSetupOpen] = useState(false);
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("resq-theme", theme);
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
    run("Loaded ResQ demo state.", async () => {
      const response = await bootstrap();
      setState(response.state);
      setNodeTypes(response.nodeTypes);
      setSelectedPersonId(response.state.people[0]?.id ?? "");
      setSelectedNodeId(response.state.nodes.find((node) => node.type === "junction")?.id ?? response.state.nodes[0]?.id ?? "");
      setLocalModelStatus(await getLocalYoloModelStatus());
      setFallSafeModelStatus(await getLocalFallSafeModelStatus());
      setCocoPersonModelStatus(await getLocalCocoPersonModelStatus());
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
      setAutoPathSummary("");
      setAutoCameraSummary("");
    });
  }

  function handleResetFloorMap() {
    run("Default map restored.", async () => {
      const response = await resetFloorMap();
      setServerState(response.state);
      setRoute(undefined);
      setSelectedNodeId(response.state.nodes.find((node) => node.type === "junction")?.id ?? response.state.nodes[0]?.id ?? "");
      setSelectedPersonId(response.state.people[0]?.id ?? "");
      setPlacingNodeType(null);
      setAutoPathSummary("");
      setAutoCameraSummary("");
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
      setRoute(undefined);
      setAutoPathSummary("");
    });
  }

  function handleAutoGenerateEdges() {
    run("Automatic paths generated.", async () => {
      const response = await autoGenerateEdges();
      setServerState(response.state);
      setRoute(undefined);
      setAutoPathSummary(`${response.message} ${response.skipped} existing paths skipped.`);
    });
  }

  function handleAutoGenerateCameras() {
    run("Automatic cameras generated.", async () => {
      const response = await autoGenerateCameras();
      setServerState(response.state);
      setAutoCameraSummary(`${response.message} ${response.skipped} covered areas skipped.`);
    });
  }

  function handleUpdateEdge(edgeId: string, patch: Partial<Omit<Edge, "id">>) {
    run("Connection updated.", async () => {
      const response = await updateEdge(edgeId, patch);
      setServerState(response.state);
      setRoute(undefined);
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

  function handleCctvDetectedHazard(hazard: Omit<Hazard, "id" | "createdAt">, routePayload: { personId?: string; startNodeId?: string }) {
    run("CCTV hazard detected and route recalculated.", async () => {
      const hazardResponse = await createHazard(hazard);
      setServerState(hazardResponse.state);
      const routeResponse = await calculateRoute(routePayload);
      setRoute(routeResponse.route);
      pushNotification({
        kind: hazard.type === "structural" ? "collapse" : "fire",
        title: hazard.type === "structural" ? "Collapse Emergency Detected" : "CCTV Hazard Detected",
        message: hazard.label
      });
      // Send Twilio SMS / WhatsApp alert if configured
      const cfg = loadAlertConfig();
      if (cfg?.enabled && cfg.phone) {
        try {
          await sendAlertNotification({
            to: cfg.phone,
            channel: cfg.channel,
            hazardType: hazard.type,
            location: hazard.label
          });
        } catch {
          // Silently ignore — alert still shows in-app
        }
      }
    });
  }

  function handleIntrusionDetected(payload: { cameraLabel: string; nodeLabel: string; count: number; confidence: number }) {
    pushNotification({
      kind: "intrusion",
      title: "Restricted Area Intrusion",
      message: `Person detected near ${payload.nodeLabel} by ${payload.cameraLabel} at ${Math.round(payload.confidence * 100)}% confidence.`
    });
  }

  function handleResetCctvSimulation() {
    run("CCTV simulation reset.", async () => {
      const response = await clearAllHazards();
      setServerState(response.state);
      setRoute(undefined);
    });
  }

  function navigate(to: string) {
    window.history.pushState({}, "", to);
    setPath(to);
    safeScrollToTop();
  }

  function pushNotification(notification: Omit<SystemNotification, "id" | "createdAt" | "read">) {
    setNotifications((current) => [
      {
        ...notification,
        id: crypto.randomUUID?.() ?? `notification-${Date.now()}`,
        createdAt: new Date().toISOString(),
        read: false
      },
      ...current
    ]);
  }

  function dismissNotification(id: string) {
    setNotifications((current) => current.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)));
  }

  const isCctvPage = path.startsWith("/dashboard/cctv");
  const isCollapsePage = path.startsWith("/dashboard/collapse");
  const isRestrictedPage = path.startsWith("/dashboard/restricted");
  const isAssistantPage = path.startsWith("/dashboard/assistant");
  const isAnalyticsPage = path.startsWith("/dashboard/analytics");
  const isToolPage = isCctvPage || isCollapsePage || isRestrictedPage || isAssistantPage || isAnalyticsPage;
  const isCityPage = path === "/city" || path.startsWith("/city/");

  function handleLogin(loginRole: "admin" | "staff" | "user") {
    setAuthenticated(true);
    setRole(loginRole);
    if (loginRole === "user") {
      navigate("/dashboard");
    } else {
      navigate("/select-mode");
    }
  }

  if (path === "/login") {
    return <LoginPage onLogin={handleLogin} onHome={() => navigate("/")} />;
  }

  if (authenticated && path === "/select-mode") {
    return (
      <ModeSelectorPage
        role={role}
        onLocalBuilding={() => navigate("/dashboard")}
        onCityWide={() => navigate("/city")}
      />
    );
  }

  if (isCityPage) {
    if (path === "/city/fire") {
      return <FireEmergencyDashboard />;
    }
    if (path === "/city/security") {
      return <SecurityDashboard />;
    }
    if (path === "/city/medical") {
      return <MedicalDashboard />;
    }
    if (path === "/city/disaster") {
      return <DisasterManagementDashboard />;
    }
    if (path === "/city/cctv") {
      return <OperationalCenterDashboard />;
    }
    if (path === "/city/unified") {
      return <UnifiedCommandDashboard />;
    }

    return <CityDashboardsPage onNavigate={navigate} onBackToModes={authenticated && role !== "user" ? () => navigate("/select-mode") : undefined} />;
  }

  if (!path.startsWith("/dashboard")) {
    return <BorrowHomePage onNavigate={navigate} />;
  }

  return (
    <div className="dashboard-page">
      <Layout
        role={role}
        theme={theme}
        onRoleChange={setRole}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        onHome={() => navigate("/")}
        onSwitchMode={role !== "user" ? () => navigate("/select-mode") : undefined}
        onDashboard={() => navigate("/dashboard")}
        onCctv={() => navigate("/dashboard/cctv")}
        onCollapse={() => navigate("/dashboard/collapse")}
        onRestricted={() => navigate("/dashboard/restricted")}
        onAssistant={() => navigate("/dashboard/assistant")}
        onAnalytics={() => navigate("/dashboard/analytics")}
        activeView={
          isCctvPage
            ? "cctv"
            : isCollapsePage
              ? "collapse"
              : isRestrictedPage
                ? "restricted"
                : isAssistantPage
                  ? "assistant"
                  : isAnalyticsPage
                    ? "analytics"
                    : "dashboard"
        }
        notifications={notifications}
        onNotificationClick={() => {
          setNotificationsOpen(true);
          setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
        }}
      >
        {isCctvPage ? (
          <CctvSimulationPage
            state={state}
            route={route}
            selectedNodeId={selectedNode?.id ?? state.nodes[0]?.id ?? ""}
            busy={busy}
            message={message}
            localModelStatus={localModelStatus}
            onSelectNode={setSelectedNodeId}
            onDetectedHazard={handleCctvDetectedHazard}
            onCalculateRoute={handleCalculateRoute}
            onResetSimulation={handleResetCctvSimulation}
          />
        ) : null}

        {isCollapsePage ? (
          <CollapseDetectionPage
            state={state}
            route={route}
            selectedNodeId={selectedNode?.id ?? state.nodes[0]?.id ?? ""}
            busy={busy}
            message={message}
            localModelStatus={fallSafeModelStatus}
            onSelectNode={setSelectedNodeId}
            onDetectedHazard={handleCctvDetectedHazard}
            onCalculateRoute={handleCalculateRoute}
            onResetSimulation={handleResetCctvSimulation}
            onResetFloorMap={handleResetFloorMap}
          />
        ) : null}

        {isRestrictedPage ? (
          <RestrictedAreaPage
            state={state}
            selectedNodeId={selectedNode?.id ?? state.nodes[0]?.id ?? ""}
            busy={busy}
            localModelStatus={cocoPersonModelStatus}
            onSelectNode={setSelectedNodeId}
            onIntrusionDetected={handleIntrusionDetected}
            onClearSimulationData={() => setNotifications([])}
            onResetFloorMap={handleResetFloorMap}
          />
        ) : null}

        {isAssistantPage ? <AssistantMapPage /> : null}

        {isAnalyticsPage ? <AnalyticsPage onOpenBorrowAdmin={() => window.open("http://localhost:3000/dashboards/admin", "_blank")} /> : null}

        {!isToolPage && role === "admin" ? (
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
            onResetFloorMap={handleResetFloorMap}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onCreateEdge={handleCreateEdge}
            onAutoGenerateCameras={handleAutoGenerateCameras}
            autoCameraSummary={autoCameraSummary}
            onAutoGenerateEdges={handleAutoGenerateEdges}
            autoPathSummary={autoPathSummary}
            onUpdateEdge={handleUpdateEdge}
            onDeleteEdge={handleDeleteEdge}
            onSimulateHazard={handleSimulateHazard}
            onClearHazards={handleClearHazards}
            onUpdatePerson={handleUpdatePerson}
            onCalculateRoute={handleCalculateRoute}
          />
        ) : null}

        {!isToolPage && role === "staff" ? <StaffDashboard state={state} route={route} /> : null}

        {!isToolPage && role === "user" ? (
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
      <NotificationCenter
        notifications={notifications}
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onDismiss={dismissNotification}
        onClear={() => setNotifications([])}
        alertConfig={alertConfig}
        onAlertSetup={() => { setNotificationsOpen(false); setAlertSetupOpen(true); }}
      />
      <TwilioAlertSetup
        open={alertSetupOpen}
        onClose={() => setAlertSetupOpen(false)}
        onSave={(cfg) => setAlertConfig(cfg)}
        current={alertConfig}
      />
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
