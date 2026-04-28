import cors from "cors";
import express from "express";
import multer from "multer";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { calculateEvacuationRoute, resolvePersonStartNode } from "../shared/routing";
import { importFloorMap } from "./cad/importer";
import { store } from "./store";
import { edgePatchSchema, edgeSchema, hazardSchema, nodePatchSchema, nodeSchema, personPatchSchema, personSchema, routeSchema } from "./validation";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const uploadDir = path.join(rootDir, "uploads");
await mkdir(uploadDir, { recursive: true });

const app = express();
const port = Number.parseInt(process.env.PORT ?? "4000", 10);
const upload = multer({ dest: uploadDir, limits: { fileSize: 25 * 1024 * 1024 } });

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "safepath-ai", persistence: process.env.DATABASE_URL ? "postgres-ready" : "memory" });
});

app.get("/api/bootstrap", (_req, res) => {
  res.json({
    state: store.getState(),
    roles: ["admin", "clerk", "user"],
    nodeTypes: ["room", "pathway", "corridor", "junction", "staircase", "exit", "extinguisher", "camera", "sensor", "actuator", "ble_beacon", "qr_checkpoint"],
    cadRequirements: {
      accepted: ["dwg", "dxf", "svg", "png", "jpg", "jpeg"],
      recommendedLayers: ["WALLS", "ROOMS", "DOORS", "STAIRS", "EXITS", "FIRE_EQUIPMENT", "CAMERAS", "SENSORS", "BEACONS", "QR_POINTS"],
      dwgConverterConfigured: Boolean(process.env.DWG_CONVERTER_COMMAND)
    },
    yoloRecommendation: {
      localEdgeOnly: true,
      eventContract: ["cameraId", "hazardType", "confidence", "timestamp", "bbox", "nearestNodeId"],
      models: [
        "Ultralytics-compatible YOLO fire/smoke model",
        "Roboflow fire/smoke detector exported to ONNX or PyTorch",
        "site-specific custom model trained on building camera angles"
      ]
    }
  });
});

app.post("/api/cad/upload", upload.single("floorMap"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Upload a floorMap file." });
      return;
    }
    const imported = await importFloorMap(req.file.path, req.file.originalname);
    const state = store.applyFloorMapImport(imported.floorMap, imported.inferredNodes);
    res.json({ floorMap: imported.floorMap, inferredNodes: imported.inferredNodes, state });
  } catch (error) {
    next(error);
  }
});

app.post("/api/nodes", (req, res, next) => {
  try {
    const node = store.addNode(nodeSchema.parse(req.body));
    res.status(201).json({ node, state: store.getState() });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/nodes/:id", (req, res, next) => {
  try {
    const node = store.updateNode(req.params.id, nodePatchSchema.parse(req.body));
    if (!node) {
      res.status(404).json({ error: "Node not found." });
      return;
    }
    res.json({ node, state: store.getState() });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/nodes/:id", (req, res) => {
  res.json({ deleted: store.deleteNode(req.params.id), state: store.getState() });
});

app.post("/api/edges", (req, res, next) => {
  try {
    const edge = store.addEdge(edgeSchema.parse(req.body));
    res.status(201).json({ edge, state: store.getState() });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/edges/:id", (req, res, next) => {
  try {
    const edge = store.updateEdge(req.params.id, edgePatchSchema.parse(req.body));
    if (!edge) {
      res.status(404).json({ error: "Edge not found." });
      return;
    }
    res.json({ edge, state: store.getState() });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/edges/:id", (req, res) => {
  res.json({ deleted: store.deleteEdge(req.params.id), state: store.getState() });
});

app.post("/api/people", (req, res, next) => {
  try {
    const person = store.addPerson(personSchema.parse(req.body));
    res.status(201).json({ person, state: store.getState() });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/people/:id", (req, res, next) => {
  try {
    const person = store.updatePerson(req.params.id, personPatchSchema.parse(req.body));
    if (!person) {
      res.status(404).json({ error: "Person not found." });
      return;
    }
    res.json({ person, state: store.getState() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/hazards", (req, res, next) => {
  try {
    const hazard = store.addHazard(hazardSchema.parse(req.body));
    res.status(201).json({ hazard, state: store.getState() });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/hazards/:id", (req, res) => {
  res.json({ cleared: store.clearHazard(req.params.id), state: store.getState() });
});

app.post("/api/hazards/clear", (_req, res) => {
  store.clearAllHazards();
  res.json({ state: store.getState() });
});

app.post("/api/routes/calculate", (req, res, next) => {
  try {
    const body = routeSchema.parse(req.body);
    const state = store.getState();
    const person = body.personId ? state.people.find((item) => item.id === body.personId) : undefined;
    const startNodeId = body.startNodeId ?? (person ? resolvePersonStartNode(person) : undefined);

    if (!startNodeId) {
      res.status(400).json({ error: "Provide startNodeId or personId with a BLE/QR location." });
      return;
    }

    const route = calculateEvacuationRoute({
      nodes: state.nodes,
      edges: state.edges,
      hazards: state.hazards,
      startNodeId
    });
    res.json({ route, startNodeId });
  } catch (error) {
    next(error);
  }
});

const distDir = path.join(rootDir, "dist");
app.use(express.static(distDir));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Validation failed.", issues: error.issues });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  res.status(500).json({ error: message });
});

app.listen(port, () => {
  console.log(`SafePath AI backend listening on http://localhost:${port}`);
});
