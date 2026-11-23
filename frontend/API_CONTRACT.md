# QCnC API Contract (PROPOSED — these endpoints do not exist yet)

Base URL: `VITE_API_BASE_URL` (default `http://localhost:5000/api`). JSON only. Timestamps are ISO 8601 UTC.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/system/status` | Connection statuses |
| POST | `/api/tests` | Submit a test |
| GET | `/api/tests/:id` | Test details and current status |
| GET | `/api/tests/:id/logs` | Execution logs |
| POST | `/api/tests/:id/stop` | Request cancellation or safe stop |
| GET | `/api/tests` | Test history |
| GET | `/api/results` | Evaluation results |
| GET | `/api/configuration` | System configuration |

## Bodies
- `POST /tests` request `{ "instruction": string }` → `{ "id": string, "status": "queued" }`. Return HTTP 409 if a test is already running.
- `POST /tests/:id/stop` → `{ "id", "accepted": boolean, "message": string }`. The backend alone decides how to stop hardware safely.
- `GET /system/status` → `SystemStatus`: `{ mode: "real", components: [{ id: "frontend|backend|android|lmstudio|cnc", label, state: "connected|disconnected|unknown", detail? }], device?: { id, model?, resolution? } }`
- `GET /tests/:id` and items of `GET /tests` → `TestRecord`:
  `id, instruction, target, status (queued|running|successful|failed|stopped), createdAt, finishedAt?, durationMs?, stages[{id,label,status(pending|running|completed|failed|skipped),startedAt?,endedAt?}]` (stage ids: submitted, screenshot, grounding, calibration, gcode, validation, cnc, interaction, completed), `screenshot{width,height,ref?}`, `grounding?{model,target,bbox[x1,y1,x2,y2] normalized 0..1,centroid[x,y]}`, `calibration?{xMm,yMm,workspaceValid,info}`, `gcode?: string[]`, `gcodeValid?`, `cnc?{connection,position?,state,stylus?}`, `outcome?`, `error?{id,testId,stage,category,description,timestamp,severity(info|warning|error|critical),details?}`, `logs[{timestamp,level,message}]`, `evaluation?{locErrPx,calErrMm,posErrMm,timeS,interactionSuccess}`, `simulated: false`, `source: "backend"`.
- `GET /results` → `{ simulated: false, summary{locErrPx,calErrMm,posErrMm,successRate,timeS,trials}, trials[{testId,instruction,date,locErrPx,calErrMm,posErrMm,timeS,success}] }`. Use `null` where source data (e.g. ground truth) is missing. The frontend shows "—" and never computes metrics itself.
- `GET /configuration` → `{ simulated: false, sections[{title, items[{label, value: string|null}]}] }` (`null` = not configured).

## Error categories (`error.category`)
Screenshot capture failure · GUI element not found · Invalid visual grounding output · Coordinate calibration failure · Target outside CNC workspace · G-code generation failure · G-code validation failure · GRBL connection failure · CNC execution failure · Physical interaction unsuccessful.

## Live updates
Phase 1: the frontend polls `GET /tests/:id` every 800 ms while status is `queued` or `running`, and `/system/status` every 5 s. The test record already includes `logs`. Phase 2 (optional): WebSocket `/ws/tests/:id` pushing `TestRecord` snapshots.
