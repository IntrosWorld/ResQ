import cors from "cors";
import express from "express";
import multer from "multer";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { generateAutoCameraNodes } from "../shared/autoDevices";
import { generateAutoPathEdges } from "../shared/autoPaths";
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

interface AssistantServerMessage {
  role: "user" | "assistant";
  content: string;
}

type AssistantMapAction =
  | { kind: "directions"; destination: string }
  | { kind: "nearby"; placeType: "hospital" | "fire_station"; label: string }
  | { kind: "nearest_directions"; placeType: "hospital" | "fire_station"; label: string };

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "resq-ai", persistence: process.env.DATABASE_URL ? "postgres-ready" : "memory" });
});

app.get("/api/bootstrap", (_req, res) => {
  res.json({
    state: store.getState(),
    roles: ["admin", "staff", "user"],
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
        "FallSafe/FallSafe-yolo11 collapse/fall detector exported to ONNX",
        "Ultralytics YOLOv8n/YOLO11n COCO person detector exported to ONNX",
        "Roboflow fire/smoke detector exported to ONNX or PyTorch",
        "site-specific custom model trained on building camera angles"
      ]
    }
  });
});

app.get("/api/models/local-yolo/status", async (_req, res) => {
  const modelDir = path.join(rootDir, "yolo_model_bin");
  const onnxPath = path.join(modelDir, "model.onnx");
  const bestPtPath = path.join(modelDir, "best.pt");
  const pytorchBinPath = path.join(modelDir, "pytorch_model.bin");
  const configPath = path.join(modelDir, "config.json");
  const safetensorsPath = path.join(modelDir, "model.safetensors");
  const [hasOnnx, hasBestPt, hasPytorchBin, hasConfig, hasSafetensors] = await Promise.all([
    fileExists(onnxPath),
    fileExists(bestPtPath),
    fileExists(pytorchBinPath),
    fileExists(configPath),
    fileExists(safetensorsPath)
  ]);

  res.json({
    hasOnnx,
    hasBestPt,
    hasPytorchBin,
    hasConfig,
    hasSafetensors,
    onnxPath: hasOnnx ? onnxPath : undefined,
    bestPtPath: hasBestPt ? bestPtPath : undefined,
    pytorchBinPath: hasPytorchBin ? pytorchBinPath : undefined,
    message: hasOnnx
      ? "Local ONNX model found. The CCTV page can use this model directly."
      : hasBestPt
        ? "best.pt found. Export it with Ultralytics to yolo_model_bin/model.onnx for browser inference."
        : hasPytorchBin || hasSafetensors || hasConfig
          ? "Hugging Face model files found, but browser inference needs model.onnx. For this repo, best.pt is the easiest file to export."
          : "No local YOLO model found in yolo_model_bin."
  });
});

app.get("/api/models/local-yolo/model.onnx", async (_req, res) => {
  const onnxPath = path.join(rootDir, "yolo_model_bin", "model.onnx");
  if (!(await fileExists(onnxPath))) {
    res.status(404).json({ error: "Local model.onnx not found. Export your PyTorch YOLO weights to yolo_model_bin/model.onnx first." });
    return;
  }

  res.sendFile(onnxPath);
});

app.get("/api/models/fallsafe/status", async (_req, res) => {
  const modelDir = path.join(rootDir, "fallsafe_model_bin");
  const onnxPath = path.join(modelDir, "model.onnx");
  const ptPath = path.join(modelDir, "model.pt");
  const [hasOnnx, hasBestPt] = await Promise.all([fileExists(onnxPath), fileExists(ptPath)]);

  res.json({
    hasOnnx,
    hasBestPt,
    hasPytorchBin: false,
    hasConfig: false,
    hasSafetensors: false,
    onnxPath: hasOnnx ? onnxPath : undefined,
    bestPtPath: hasBestPt ? ptPath : undefined,
    message: hasOnnx
      ? "Local FallSafe ONNX model found. The collapse page can use this model directly."
      : hasBestPt
        ? "FallSafe model.pt found. Export it to fallsafe_model_bin/model.onnx for browser inference."
        : "No local FallSafe model found in fallsafe_model_bin. Download FallSafe/FallSafe-yolo11 model/model.pt and export it to ONNX."
  });
});

app.get("/api/models/fallsafe/model.onnx", async (_req, res) => {
  const onnxPath = path.join(rootDir, "fallsafe_model_bin", "model.onnx");
  if (!(await fileExists(onnxPath))) {
    res.status(404).json({ error: "Local FallSafe model.onnx not found. Export FallSafe model.pt to fallsafe_model_bin/model.onnx first." });
    return;
  }

  res.sendFile(onnxPath);
});

app.get("/api/models/person-coco/status", async (_req, res) => {
  const modelDir = path.join(rootDir, "person_model_bin");
  const onnxPath = path.join(modelDir, "model.onnx");
  const ptPath = path.join(modelDir, "model.pt");
  const [hasOnnx, hasBestPt] = await Promise.all([fileExists(onnxPath), fileExists(ptPath)]);

  res.json({
    hasOnnx,
    hasBestPt,
    hasPytorchBin: false,
    hasConfig: false,
    hasSafetensors: false,
    onnxPath: hasOnnx ? onnxPath : undefined,
    bestPtPath: hasBestPt ? ptPath : undefined,
    message: hasOnnx
      ? "Local COCO person ONNX model found. The restricted-area page can use this model directly."
      : hasBestPt
        ? "COCO person model.pt found. Export it to person_model_bin/model.onnx for browser inference."
        : "No local COCO person model found in person_model_bin. Export YOLO11n or YOLOv8n pretrained COCO weights to ONNX."
  });
});

app.get("/api/models/person-coco/model.onnx", async (_req, res) => {
  const onnxPath = path.join(rootDir, "person_model_bin", "model.onnx");
  if (!(await fileExists(onnxPath))) {
    res.status(404).json({ error: "Local COCO person model.onnx not found. Export YOLO11n or YOLOv8n to person_model_bin/model.onnx first." });
    return;
  }

  res.sendFile(onnxPath);
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

app.post("/api/cad/reset", (_req, res) => {
  res.json({ state: store.resetToSample() });
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

app.post("/api/nodes/auto-cameras", (_req, res) => {
  const result = generateAutoCameraNodes(store.getState());
  const nodes = store.addNodes(result.nodes);
  res.json({ nodes, skipped: result.skipped, message: result.message, state: store.getState() });
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

app.post("/api/edges/auto-generate", (_req, res) => {
  const result = generateAutoPathEdges(store.getState());
  const edges = store.addEdges(result.edges);
  res.json({ edges, skipped: result.skipped, message: result.message, state: store.getState() });
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

app.post("/api/assistant/chat", async (req, res, next) => {
  try {
    const messages: unknown[] = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const normalizedMessages = messages
      .filter((message): message is AssistantServerMessage => isAssistantServerMessage(message))
      .slice(-12);
    const lastUserMessage = [...normalizedMessages].reverse().find((message) => message.role === "user")?.content ?? "";
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const mapAction = parseFallbackMapAction(lastUserMessage);
      res.json({ reply: fallbackAssistantReply(lastUserMessage, mapAction), configured: false, mapAction });
      return;
    }

    const model = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are ResQ's operations assistant for emergency response teams. Be concise, practical, and calm. You can answer normal chat questions, explain evacuation decisions, and help with external map requests. When the user asks for directions, hospitals, fire stations, or other nearby places, acknowledge that the browser map is handling the visual route or place search."
            }
          ]
        },
        contents: normalizedMessages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }]
        })),
        tools: [
          {
            functionDeclarations: [
              {
                name: "show_directions",
                description: "Show driving directions on the embedded Google Map for a requested destination.",
                parameters: {
                  type: "object",
                  properties: {
                    destination: {
                      type: "string",
                      description: "The destination name or address, for example 'Apollo Hospital Delhi' or 'nearest exit gate'."
                    }
                  },
                  required: ["destination"]
                }
              },
              {
                name: "show_nearby_place",
                description: "Show nearby emergency services on the embedded Google Map.",
                parameters: {
                  type: "object",
                  properties: {
                    place_type: {
                      type: "string",
                      enum: ["hospital", "fire_station"],
                      description: "The emergency service category to search for."
                    }
                  },
                  required: ["place_type"]
                }
              },
              {
                name: "show_directions_to_nearest",
                description: "Find the nearest emergency service of the requested type and show driving directions to it on the embedded Google Map. Use this when the user asks for directions or a route to the nearest or nearby hospital or fire station.",
                parameters: {
                  type: "object",
                  properties: {
                    place_type: {
                      type: "string",
                      enum: ["hospital", "fire_station"],
                      description: "The emergency service category to route to."
                    }
                  },
                  required: ["place_type"]
                }
              }
            ]
          }
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: "AUTO"
          }
        }
      })
    });

    const data = (await response.json().catch(() => ({}))) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string; functionCall?: { name?: string; args?: Record<string, unknown> } }> } }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message ?? "Gemini request failed." });
      return;
    }

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const functionCall = parts.find((part) => part.functionCall)?.functionCall;
    const mapAction = functionCall ? mapActionFromFunctionCall(functionCall.name, functionCall.args ?? {}) : undefined;
    const reply = parts.map((part) => part.text ?? "").join("").trim();
    res.json({ reply: reply || fallbackAssistantReply(lastUserMessage, mapAction), configured: true, mapAction });
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
  console.log(`ResQ backend listening on http://localhost:${port}`);
});

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function fallbackAssistantReply(message: string, mapAction?: AssistantMapAction): string {
  if (mapAction?.kind === "nearby") {
    return `I will show nearby ${mapAction.label} on the map.`;
  }

  if (mapAction?.kind === "nearest_directions") {
    return `I will find the nearest ${mapAction.label.replace(/s$/, "")} and show directions on the map.`;
  }

  if (mapAction?.kind === "directions") {
    return `I will show directions to ${mapAction.destination} on the map.`;
  }

  const normalized = message.toLowerCase();
  if (normalized.includes("hospital")) {
    return "I can help locate nearby hospitals. The map panel will show the closest hospital results when Google Maps is configured.";
  }

  if (normalized.includes("fire station") || normalized.includes("firestation")) {
    return "I can help locate nearby fire stations. The map panel will show nearby fire station results when Google Maps is configured.";
  }

  if (normalized.includes("direction") || normalized.includes("route") || normalized.includes("navigate")) {
    return "I can help with directions. Enter a destination in your message and the map panel will draw the route when Google Maps is configured.";
  }

  return "I can help with building response questions, evacuation communication, directions, nearby hospitals, and nearby fire stations. Configure GEMINI_API_KEY for full Gemini chat responses.";
}

function mapActionFromFunctionCall(name: string | undefined, args: Record<string, unknown>): AssistantMapAction | undefined {
  if (name === "show_directions" && typeof args.destination === "string" && args.destination.trim()) {
    return { kind: "directions", destination: args.destination.trim() };
  }

  if (name === "show_nearby_place" && (args.place_type === "hospital" || args.place_type === "fire_station")) {
    return {
      kind: "nearby",
      placeType: args.place_type,
      label: args.place_type === "hospital" ? "hospitals" : "fire stations"
    };
  }

  if (name === "show_directions_to_nearest" && (args.place_type === "hospital" || args.place_type === "fire_station")) {
    return {
      kind: "nearest_directions",
      placeType: args.place_type,
      label: args.place_type === "hospital" ? "hospitals" : "fire stations"
    };
  }

  return undefined;
}

function parseFallbackMapAction(message: string): AssistantMapAction | undefined {
  const normalized = message.toLowerCase();
  if (
    (normalized.includes("direction") || normalized.includes("route") || normalized.includes("navigate") || normalized.includes("how to get")) &&
    (normalized.includes("nearest") || normalized.includes("nearby")) &&
    normalized.includes("hospital")
  ) {
    return { kind: "nearest_directions", placeType: "hospital", label: "hospitals" };
  }

  if (
    (normalized.includes("direction") || normalized.includes("route") || normalized.includes("navigate") || normalized.includes("how to get")) &&
    (normalized.includes("nearest") || normalized.includes("nearby")) &&
    (normalized.includes("fire station") || normalized.includes("firestation"))
  ) {
    return { kind: "nearest_directions", placeType: "fire_station", label: "fire stations" };
  }

  if ((normalized.includes("nearest") || normalized.includes("nearby")) && normalized.includes("hospital")) {
    return { kind: "nearby", placeType: "hospital", label: "hospitals" };
  }

  if ((normalized.includes("nearest") || normalized.includes("nearby")) && (normalized.includes("fire station") || normalized.includes("firestation"))) {
    return { kind: "nearby", placeType: "fire_station", label: "fire stations" };
  }

  if (normalized.includes("direction") || normalized.includes("route") || normalized.includes("navigate") || normalized.includes("how to get")) {
    const destination = extractDestination(message);
    if (destination) {
      return { kind: "directions", destination };
    }
  }

  return undefined;
}

function extractDestination(message: string): string {
  const toMatch = message.match(/\bto\s+(.+)$/i);
  if (toMatch?.[1]) {
    return toMatch[1].trim().replace(/[?.!]$/, "");
  }

  return message.replace(/^(give me|show me)?\s*(directions|route|navigate)\s*/i, "").trim().replace(/[?.!]$/, "");
}

function isAssistantServerMessage(message: unknown): message is AssistantServerMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as Partial<AssistantServerMessage>;
  return (candidate.role === "user" || candidate.role === "assistant") && typeof candidate.content === "string";
}
