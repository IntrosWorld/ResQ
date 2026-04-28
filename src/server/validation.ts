import { z } from "zod";

const nodeTypes = [
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
] as const;

const hazardTypes = ["fire", "smoke", "gas", "structural", "security", "other"] as const;
const hazardSeverities = ["low", "medium", "high", "critical"] as const;
const personRoles = ["guest", "staff", "contractor", "unknown"] as const;

export const nodeSchema = z.object({
  label: z.string().trim().min(1),
  type: z.enum(nodeTypes),
  x: z.coerce.number().finite(),
  y: z.coerce.number().finite(),
  floorId: z.string().trim().min(1).default("floor-1"),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

export const nodePatchSchema = nodeSchema.partial();

export const edgeSchema = z.object({
  from: z.string().trim().min(1),
  to: z.string().trim().min(1),
  distance: z.coerce.number().positive(),
  status: z.enum(["open", "blocked"]).default("open")
});

export const edgePatchSchema = edgeSchema.partial();

export const hazardSchema = z.object({
  type: z.enum(hazardTypes),
  label: z.string().trim().min(1),
  nodeId: z.string().trim().min(1).optional(),
  x: z.coerce.number().finite(),
  y: z.coerce.number().finite(),
  radius: z.coerce.number().positive().default(90),
  severity: z.enum(hazardSeverities).default("high"),
  active: z.boolean().default(true)
});

export const personSchema = z.object({
  label: z.string().trim().min(1),
  role: z.enum(personRoles).default("guest"),
  bleNodeId: z.string().trim().min(1).optional(),
  qrNodeId: z.string().trim().min(1).optional(),
  confidence: z.coerce.number().min(0).max(1).default(0.7)
});

export const personPatchSchema = personSchema.partial();

export const routeSchema = z.object({
  personId: z.string().trim().min(1).optional(),
  startNodeId: z.string().trim().min(1).optional()
});
