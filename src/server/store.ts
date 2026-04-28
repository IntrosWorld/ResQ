import type { AppState, Edge, FloorMap, Hazard, Node, PersonLocation } from "../shared/types";
import { createSampleState } from "../shared/sampleData";

export class MemoryStore {
  private state: AppState = createSampleState();

  getState(): AppState {
    return structuredClone(this.state);
  }

  setFloorMap(floorMap: FloorMap): AppState {
    this.state.floorMap = floorMap;
    return this.getState();
  }

  resetToSample(): AppState {
    this.state = createSampleState();
    return this.getState();
  }

  applyFloorMapImport(floorMap: FloorMap, inferredNodes: Array<Omit<Node, "id">>): AppState {
    this.state.floorMap = floorMap;
    if (floorMap.importStatus !== "unsupported") {
      this.state.nodes = inferredNodes.map((node) => ({ ...node, id: `node-${crypto.randomUUID()}` }));
      this.state.edges = [];
      this.state.hazards = [];
      this.state.people = [];
    }
    return this.getState();
  }

  addNode(node: Omit<Node, "id">): Node {
    const saved = { ...node, id: `node-${crypto.randomUUID()}` };
    this.state.nodes.push(saved);
    return saved;
  }

  addNodes(nodes: Array<Omit<Node, "id">>): Node[] {
    const saved = nodes.map((node) => ({ ...node, id: `node-${crypto.randomUUID()}` }));
    this.state.nodes.push(...saved);
    return saved;
  }

  updateNode(id: string, patch: Partial<Omit<Node, "id">>): Node | undefined {
    const index = this.state.nodes.findIndex((node) => node.id === id);
    if (index === -1) {
      return undefined;
    }
    this.state.nodes[index] = { ...this.state.nodes[index], ...patch, id };
    return this.state.nodes[index];
  }

  deleteNode(id: string): boolean {
    const before = this.state.nodes.length;
    this.state.nodes = this.state.nodes.filter((node) => node.id !== id);
    this.state.edges = this.state.edges.filter((edge) => edge.from !== id && edge.to !== id);
    this.state.people = this.state.people.map((person) => ({
      ...person,
      bleNodeId: person.bleNodeId === id ? undefined : person.bleNodeId,
      qrNodeId: person.qrNodeId === id ? undefined : person.qrNodeId
    }));
    this.state.hazards = this.state.hazards.filter((hazard) => hazard.nodeId !== id);
    return this.state.nodes.length !== before;
  }

  addEdge(edge: Omit<Edge, "id">): Edge {
    const saved = { ...edge, id: `edge-${crypto.randomUUID()}` };
    this.state.edges.push(saved);
    return saved;
  }

  addEdges(edges: Array<Omit<Edge, "id">>): Edge[] {
    const saved = edges.map((edge) => ({ ...edge, id: `edge-${crypto.randomUUID()}` }));
    this.state.edges.push(...saved);
    return saved;
  }

  updateEdge(id: string, patch: Partial<Omit<Edge, "id">>): Edge | undefined {
    const index = this.state.edges.findIndex((edge) => edge.id === id);
    if (index === -1) {
      return undefined;
    }
    this.state.edges[index] = { ...this.state.edges[index], ...patch, id };
    return this.state.edges[index];
  }

  deleteEdge(id: string): boolean {
    const before = this.state.edges.length;
    this.state.edges = this.state.edges.filter((edge) => edge.id !== id);
    return this.state.edges.length !== before;
  }

  addHazard(hazard: Omit<Hazard, "id" | "createdAt">): Hazard {
    const saved = { ...hazard, id: `hazard-${crypto.randomUUID()}`, createdAt: new Date().toISOString() };
    this.state.hazards.push(saved);
    return saved;
  }

  clearHazard(id: string): boolean {
    const hazard = this.state.hazards.find((item) => item.id === id);
    if (!hazard) {
      return false;
    }
    hazard.active = false;
    return true;
  }

  clearAllHazards(): void {
    this.state.hazards = this.state.hazards.map((hazard) => ({ ...hazard, active: false }));
  }

  addPerson(person: Omit<PersonLocation, "id" | "updatedAt">): PersonLocation {
    const saved = { ...person, id: `person-${crypto.randomUUID()}`, updatedAt: new Date().toISOString() };
    this.state.people.push(saved);
    return saved;
  }

  updatePerson(id: string, patch: Partial<Omit<PersonLocation, "id" | "updatedAt">>): PersonLocation | undefined {
    const index = this.state.people.findIndex((person) => person.id === id);
    if (index === -1) {
      return undefined;
    }
    this.state.people[index] = { ...this.state.people[index], ...patch, id, updatedAt: new Date().toISOString() };
    return this.state.people[index];
  }
}

export const store = new MemoryStore();
