# ResQ

ResQ is a plug-and-play indoor crisis-response demo for hotels and large buildings. It includes a modern web UI, backend API, editable floor graph, sample map, BLE/QR people simulation, hazard simulation, and safest-route calculation.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:4000`.

## Neon Setup

1. Create a Neon PostgreSQL database.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to the Neon pooled or direct connection string.
4. Apply the schema:

```bash
npm run db:push
```

The demo API currently runs with in-memory state so it is easy to present anywhere. The Neon schema in `src/server/db/schema.sql` is ready for the production persistence layer.

## DWG/DXF Floor Map Requirements

Best results come from a clean 2D floor drawing:

- One floor per DWG/DXF file.
- Model-space geometry, not a paper layout screenshot.
- Real-world scale where possible.
- Separate layers preferred: `WALLS`, `ROOMS`, `DOORS`, `STAIRS`, `EXITS`, `FIRE_EQUIPMENT`, `CAMERAS`, `SENSORS`, `BEACONS`, `QR_POINTS`.
- Avoid exploded title blocks, unrelated furniture, heavy hatches, and many duplicate lines in the routing drawing.

DXF files are parsed directly for preview geometry, including lines, lightweight polylines, legacy polylines, circles, arcs, `TEXT`, and `MTEXT` labels. Closed room polygons on room-like layers are converted into editable room nodes at the room center; labels inside those polygons become the node names. Corridor, path, hallway, exit, stair, camera, sensor, BLE, QR, actuator, and extinguisher layers/text can also create editable node candidates. DWG files are accepted, stored, and marked `needs_converter` unless the deployment configures a converter such as LibreDWG or ODA File Converter. Admins can always place and edit nodes manually after upload.

## Phase 1 Features

- Admin dashboard: upload map, place/edit/delete nodes, connect graph edges, simulate hazards, simulate BLE/QR people locations, calculate route, and review final nodes.
- Staff dashboard: monitor active hazards, people locations, route state, exits, and response actions.
- User dashboard: pick a simulated user, confirm QR checkpoint, and view step-by-step evacuation guidance.
- Dark and light theme toggle.
- Sample hotel floor map with rooms, corridors, exits, devices, BLE beacon, QR checkpoint, and people.
- Route engine blocks unsafe nodes/edges and evaluates all exits.

## Edge AI Contract

Camera hazard detection should run locally on an edge server inside the building. The cloud/backend should receive only event data:

```json
{
  "cameraId": "cam-lobby",
  "hazardType": "fire",
  "confidence": 0.91,
  "timestamp": "2026-04-26T00:00:00.000Z",
  "bbox": [120, 80, 260, 220],
  "nearestNodeId": "junction-main"
}
```

Use an Ultralytics-compatible fire/smoke YOLO model as a starting point, then retrain and validate with the building's real camera angles before safety-critical use.
