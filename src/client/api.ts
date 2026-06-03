import type { AppState, Edge, Hazard, LocalModelStatus, Node, PersonLocation, RouteResult } from "../shared/types";

export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AssistantMapAction =
  | { kind: "directions"; destination: string }
  | { kind: "nearby"; placeType: "hospital" | "fire_station"; label: string }
  | { kind: "nearest_directions"; placeType: "hospital" | "fire_station"; label: string };

export interface BootstrapResponse {
  state: AppState;
  roles: string[];
  nodeTypes: Node["type"][];
  cadRequirements: {
    accepted: string[];
    recommendedLayers: string[];
    dwgConverterConfigured: boolean;
  };
  yoloRecommendation: {
    localEdgeOnly: boolean;
    eventContract: string[];
    models: string[];
  };
}

export async function bootstrap(): Promise<BootstrapResponse> {
  return fetchJson("/api/bootstrap");
}

export async function getLocalYoloModelStatus(): Promise<LocalModelStatus> {
  return fetchJson("/api/models/local-yolo/status");
}

export async function getLocalFallSafeModelStatus(): Promise<LocalModelStatus> {
  return fetchJson("/api/models/fallsafe/status");
}

export async function getLocalCocoPersonModelStatus(): Promise<LocalModelStatus> {
  return fetchJson("/api/models/person-coco/status");
}

export async function sendAlertNotification(payload: {
  to: string;
  channel: "sms" | "whatsapp";
  hazardType?: string;
  location?: string;
}): Promise<{ ok: boolean; channel: string; to: string }> {
  return fetchJson("/api/notify/send", jsonRequest("POST", payload));
}

export async function uploadFloorMap(file: File): Promise<{ state: AppState }> {
  const form = new FormData();
  form.append("floorMap", file);
  return fetchJson("/api/cad/upload", { method: "POST", body: form });
}

export async function resetFloorMap(): Promise<{ state: AppState }> {
  return fetchJson("/api/cad/reset", jsonRequest("POST", {}));
}

export async function createNode(node: Omit<Node, "id">): Promise<{ node: Node; state: AppState }> {
  return fetchJson("/api/nodes", jsonRequest("POST", node));
}

export async function updateNode(id: string, patch: Partial<Omit<Node, "id">>): Promise<{ node: Node; state: AppState }> {
  return fetchJson(`/api/nodes/${id}`, jsonRequest("PATCH", patch));
}

export async function deleteNode(id: string): Promise<{ deleted: boolean; state: AppState }> {
  return fetchJson(`/api/nodes/${id}`, { method: "DELETE" });
}

export async function autoGenerateCameras(): Promise<{ nodes: Node[]; skipped: number; message: string; state: AppState }> {
  return fetchJson("/api/nodes/auto-cameras", jsonRequest("POST", {}));
}

export async function createEdge(edge: Omit<Edge, "id">): Promise<{ edge: Edge; state: AppState }> {
  return fetchJson("/api/edges", jsonRequest("POST", edge));
}

export async function updateEdge(id: string, patch: Partial<Omit<Edge, "id">>): Promise<{ edge: Edge; state: AppState }> {
  return fetchJson(`/api/edges/${id}`, jsonRequest("PATCH", patch));
}

export async function deleteEdge(id: string): Promise<{ deleted: boolean; state: AppState }> {
  return fetchJson(`/api/edges/${id}`, { method: "DELETE" });
}

export async function autoGenerateEdges(): Promise<{ edges: Edge[]; skipped: number; message: string; state: AppState }> {
  return fetchJson("/api/edges/auto-generate", jsonRequest("POST", {}));
}

export async function updatePerson(id: string, patch: Partial<Omit<PersonLocation, "id" | "updatedAt">>): Promise<{ person: PersonLocation; state: AppState }> {
  return fetchJson(`/api/people/${id}`, jsonRequest("PATCH", patch));
}

export async function createHazard(hazard: Omit<Hazard, "id" | "createdAt">): Promise<{ hazard: Hazard; state: AppState }> {
  return fetchJson("/api/hazards", jsonRequest("POST", hazard));
}

export async function clearAllHazards(): Promise<{ state: AppState }> {
  return fetchJson("/api/hazards/clear", jsonRequest("POST", {}));
}

export async function calculateRoute(payload: { personId?: string; startNodeId?: string }): Promise<{ route: RouteResult; startNodeId: string }> {
  return fetchJson("/api/routes/calculate", jsonRequest("POST", payload));
}

export async function sendAssistantMessage(messages: AssistantChatMessage[]): Promise<{ reply: string; configured: boolean; mapAction?: AssistantMapAction }> {
  return fetchJson("/api/assistant/chat", jsonRequest("POST", { messages }));
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as T;
}
