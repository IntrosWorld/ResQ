import type { AppState, Edge, Hazard, Node, PersonLocation, RouteResult } from "../shared/types";

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

export async function uploadFloorMap(file: File): Promise<{ state: AppState }> {
  const form = new FormData();
  form.append("floorMap", file);
  return fetchJson("/api/cad/upload", { method: "POST", body: form });
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

export async function createEdge(edge: Omit<Edge, "id">): Promise<{ edge: Edge; state: AppState }> {
  return fetchJson("/api/edges", jsonRequest("POST", edge));
}

export async function deleteEdge(id: string): Promise<{ deleted: boolean; state: AppState }> {
  return fetchJson(`/api/edges/${id}`, { method: "DELETE" });
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
