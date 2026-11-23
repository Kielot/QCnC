# QCnC Frontend (Physical GUI Testing System)

React + Vite + TypeScript + Tailwind PWA. Runs entirely on a **mock API** today. The Flask backend, CrewAI agents, Qwen3-VL, ADB and CNC/GRBL control are not part of this project.

## Run
```bash
npm install
npm run dev        # http://localhost:5173 (mock mode)
npm run build      # type-check + production build + service worker
npm run preview    # serve the production build (needed to test PWA install)
```

## Mock vs real API
Set in `.env` (see `.env.example`):
```
VITE_API_MODE=mock                     # default
VITE_API_BASE_URL=http://localhost:5000/api
```
Set `VITE_API_MODE=real` to use `src/services/api.ts` against Flask. Both providers implement `QCnCApi` (`src/services/apiTypes.ts`). Endpoints are documented in `API_CONTRACT.md`. They are proposals; none exist yet.

## Mock behavior
- Pick a simulated outcome (success or one of five failures) under "Demo control" on New Test. It is not a system setting.
- Records are stored in browser localStorage (`qcnc.mock.tests.v1`) and labeled SIMULATED. Clear that key to reset.
- All evaluation numbers, coordinates and G-code are illustrative, not measurements.

## Layout
`src/services` (api, mockApi, apiTypes) · `src/pages` · `src/components/{layout,common,monitoring}` · `src/hooks` · `src/types` · `src/utils`

## PWA
Manifest and service worker via `vite-plugin-pwa`. Only static assets are cached; `/api` is never cached, and tests are not queued offline.
