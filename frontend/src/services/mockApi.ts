// MOCK PROVIDER: everything here is simulated. No AI, ADB, CNC or Flask backend is involved.
import type { QCnCApi } from './apiTypes';
import type { Evaluation, Scenario, Severity, TestRecord } from '../types';

const KEY = 'qcnc.mock.tests.v1';
const STAGES: [string, string][] = [['submitted', 'Test submitted'], ['screenshot', 'Screenshot captured'], ['grounding', 'Agent 1 · Visual grounding'], ['calibration', 'Agent 2 · Coordinate calibration'], ['gcode', 'Agent 3 · G-code generation'], ['validation', 'G-code validation'], ['cnc', 'CNC execution'], ['interaction', 'Physical GUI interaction recorded'], ['completed', 'Test completed']];
const DELAY = [300, 900, 2200, 1100, 1500, 900, 1800, 1200, 300];
export const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: 'success', label: 'Successful test' }, { value: 'not_found', label: 'GUI element not found' }, { value: 'calibration_failure', label: 'Coordinate calibration failure' },
  { value: 'gcode_validation_failure', label: 'G-code validation failure' }, { value: 'cnc_connection_failure', label: 'CNC connection failure' }, { value: 'cnc_execution_failure', label: 'CNC execution failure' }];
const FAILS: Partial<Record<Scenario, { stage: string; category: string; description: string; severity: Severity }>> = {
  not_found: { stage: 'grounding', category: 'GUI element not found', description: 'Simulated: the requested element was not located in the screenshot.', severity: 'error' },
  calibration_failure: { stage: 'calibration', category: 'Coordinate calibration failure', description: 'Simulated: normalized coordinates could not be converted to CNC coordinates.', severity: 'error' },
  gcode_validation_failure: { stage: 'validation', category: 'G-code validation failure', description: 'Simulated: generated G-code failed validation and was not sent to the machine.', severity: 'error' },
  cnc_connection_failure: { stage: 'cnc', category: 'GRBL connection failure', description: 'Simulated: no response from the GRBL controller on the serial port.', severity: 'critical' },
  cnc_execution_failure: { stage: 'cnc', category: 'CNC execution failure', description: 'Simulated: the CNC reported an error while executing the approved G-code.', severity: 'critical' },
};
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const stopped = new Set<string>();

function newRecord(instruction: string, scenario: Scenario, at = new Date()): TestRecord {
  const m = instruction.match(/(?:click|tap|press|select)\s+(?:on\s+)?(?:the\s+)?(.+?)(?:\.|$)/i);
  return { id: 'T-' + (at.getTime() + Math.floor(Math.random() * 999)).toString(36).toUpperCase(), instruction, target: m ? m[1] : instruction, scenario, status: 'queued', createdAt: at.toISOString(),
    stages: STAGES.map(([id, label]) => ({ id, label, status: 'pending' as const })), logs: [], screenshot: { width: 1080, height: 2400 }, simulated: true, source: 'local-demo' };
}
const stamp = (r: TestRecord, off?: number) => off === undefined ? new Date().toISOString() : new Date(Date.parse(r.createdAt) + off).toISOString();
const log = (r: TestRecord, level: Severity, message: string, off?: number) => r.logs.push({ timestamp: stamp(r, off), level, message });
function hash(s: string) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 100003; return h; }
function makeEval(r: TestRecord): Evaluation { // SIMULATED numbers, deterministic per test id
  const h = hash(r.id), q = (k: number) => ((h * (k + 7)) % 1000) / 1000;
  return { locErrPx: +(4 + q(1) * 14).toFixed(1), calErrMm: +(0.2 + q(2) * 0.9).toFixed(2), posErrMm: +(0.1 + q(3) * 0.6).toFixed(2), timeS: +((r.durationMs ?? 0) / 1000).toFixed(1), interactionSuccess: true };
}
function finish(r: TestRecord, off?: number) {
  r.finishedAt = stamp(r, off); r.durationMs = Date.parse(r.finishedAt) - Date.parse(r.createdAt);
  if (r.status === 'successful') r.evaluation = makeEval(r);
}
/** Applies the outcome of stage i. Returns false when the workflow ended (failure or completion). */
function completeStage(r: TestRecord, i: number, off?: number): boolean {
  const s = r.stages[i], f = r.scenario ? FAILS[r.scenario] : undefined, now = stamp(r, off);
  s.endedAt = now;
  if (f && f.stage === s.id) {
    s.status = 'failed'; r.stages.slice(i + 1).forEach(x => (x.status = 'skipped')); r.status = 'failed';
    if (s.id === 'validation') r.gcodeValid = false;
    r.error = { id: 'ERR-' + r.id.slice(-4), testId: r.id, stage: s.label, category: f.category, description: f.description, timestamp: now, severity: f.severity, details: { origin: 'simulated scenario' } };
    r.outcome = 'No physical interaction'; log(r, f.severity, `${f.category}: ${f.description}`, off); finish(r, off); return false;
  }
  s.status = 'completed'; log(r, 'info', 'Completed: ' + s.label, off);
  if (s.id === 'grounding') r.grounding = { model: 'Qwen3-VL (simulated output)', target: r.target, bbox: [0.185, 0.6, 0.815, 0.68], centroid: [0.5, 0.64] };
  if (s.id === 'calibration') r.calibration = { xMm: 34.0, yMm: 99.2, workspaceValid: true, info: 'Illustrative values only. Not produced by a real calibration.' };
  if (s.id === 'gcode') r.gcode = ['; ILLUSTRATIVE G-CODE (SIMULATED, NOT FOR EXECUTION)', 'G21', 'G90', 'G0 X34.00 Y99.20', 'G4 P0.2', 'M2'];
  if (s.id === 'validation') r.gcodeValid = true;
  if (s.id === 'cnc') r.cnc = { connection: 'Simulated (no hardware connected)', state: 'Simulated execution finished', position: 'Not available', stylus: 'Not available' };
  if (i === STAGES.length - 1) { r.status = 'successful'; r.outcome = 'Interaction recorded (simulated)'; finish(r, off); return false; }
  return true;
}
function seed(): TestRecord[] {
  const plan: [string, Scenario][] = [['Click the Submit button.', 'success'], ['Tap the Login button.', 'success'], ['Click the Settings icon.', 'not_found'], ['Press the Next button.', 'success'], ['Click the Save button.', 'gcode_validation_failure'], ['Tap the Search icon.', 'success'], ['Click the Confirm button.', 'cnc_execution_failure']];
  return plan.map(([text, sc], i) => {
    const r = newRecord(text, sc, new Date(Date.now() - (i + 1) * 5 * 3600e3)); r.status = 'running'; let off = 0;
    for (let k = 0; k < STAGES.length; k++) { off += DELAY[k]; log(r, 'info', 'Started: ' + STAGES[k][1], off - DELAY[k]); if (!completeStage(r, k, off)) break; }
    return r;
  });
}
function load(): TestRecord[] {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(d)) { d.forEach((t: TestRecord) => { if (t.status === 'running' || t.status === 'queued') { t.status = 'stopped'; t.stages.forEach(s => { if (s.status === 'running' || s.status === 'pending') s.status = 'skipped'; }); log(t, 'warning', 'Simulation interrupted by page reload'); } }); return d; }
  } catch { /* ignore corrupt data */ }
  return seed();
}
let db: TestRecord[] = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } };
save();
const find = (id: string) => { const r = db.find(t => t.id === id); if (!r) throw new Error('Test not found: ' + id); return r; };
const copy = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

async function run(id: string) {
  const r = find(id); r.status = 'running'; save();
  for (let i = 0; i < STAGES.length; i++) {
    r.stages[i].status = 'running'; r.stages[i].startedAt = new Date().toISOString(); log(r, 'info', 'Started: ' + r.stages[i].label); save();
    await sleep(DELAY[i]);
    if (stopped.has(id)) { r.stages.slice(i).forEach(s => (s.status = 'skipped')); r.status = 'stopped'; r.outcome = 'Stopped before completion'; log(r, 'warning', 'Stopped by operator (simulated workflow halted)'); finish(r); save(); return; }
    const more = completeStage(r, i); save(); if (!more) return;
  }
}
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const avg = (a: number[]) => (a.length ? +(sum(a) / a.length).toFixed(2) : null);

export const mockApi: QCnCApi = {
  async getSystemStatus() {
    await sleep(80);
    return { mode: 'mock', components: [
      { id: 'frontend', label: 'Frontend', state: 'connected', detail: 'Running' },
      { id: 'backend', label: 'Backend (Flask)', state: 'simulated', detail: 'Mock API in browser' },
      { id: 'android', label: 'Android / ADB', state: 'simulated', detail: 'No device connected' },
      { id: 'lmstudio', label: 'LM Studio / Qwen3-VL', state: 'simulated', detail: 'No model running' },
      { id: 'cnc', label: 'CNC / GRBL', state: 'simulated', detail: 'No hardware connected' }],
      device: { id: 'SIMULATED-DEVICE', model: 'Simulated Android device', resolution: '1080 × 2400 (simulated)' } };
  },
  async startTest(req) {
    await sleep(150);
    if (db.some(t => t.status === 'running' || t.status === 'queued')) throw new Error('A test is already running. Wait for it to finish or stop it first.');
    const r = newRecord(req.instruction, req.scenario ?? 'success'); log(r, 'info', 'Test submitted (simulated)'); db.unshift(r); save(); void run(r.id);
    return { id: r.id, status: r.status };
  },
  async getTestStatus(id) { return copy(find(id)); },
  async getTestLogs(id) { return copy(find(id).logs); },
  async getTestHistory() { return copy(db); },
  async getTestDetails(id) { return copy(find(id)); },
  async stopTest(id) {
    const r = find(id);
    if (r.status !== 'running' && r.status !== 'queued') return { id, accepted: false, message: 'Test is not running.' };
    stopped.add(id); return { id, accepted: true, message: 'Stop requested. The simulated workflow will halt shortly.' };
  },
  async getEvaluationResults() {
    const ev = db.filter(t => t.evaluation), fin = db.filter(t => t.status === 'successful' || t.status === 'failed');
    const E = (k: keyof Evaluation) => ev.map(t => t.evaluation![k] as number);
    return { simulated: true, summary: { locErrPx: avg(E('locErrPx')), calErrMm: avg(E('calErrMm')), posErrMm: avg(E('posErrMm')), timeS: avg(E('timeS')),
      successRate: fin.length ? +((fin.filter(t => t.status === 'successful').length / fin.length) * 100).toFixed(1) : null, trials: fin.length },
      trials: fin.map(t => ({ testId: t.id, instruction: t.instruction, date: t.createdAt, locErrPx: t.evaluation?.locErrPx ?? null, calErrMm: t.evaluation?.calErrMm ?? null, posErrMm: t.evaluation?.posErrMm ?? null, timeS: t.evaluation?.timeS ?? null, success: t.status === 'successful' })) };
  },
  async getSystemConfiguration() {
    const NA = null;
    return { simulated: true, sections: [
      { title: 'AI configuration', items: [{ label: 'LM Studio API endpoint', value: NA }, { label: 'Qwen3-VL model name', value: NA }, { label: 'Model availability', value: 'Not connected (mock mode)' }] },
      { title: 'Android device', items: [{ label: 'ADB status', value: 'Not connected (mock mode)' }, { label: 'Device identifier', value: 'SIMULATED-DEVICE' }, { label: 'Screenshot resolution', value: '1080 × 2400 (simulated sample)' }] },
      { title: 'CNC configuration', items: [{ label: 'GRBL status', value: 'Not connected (mock mode)' }, { label: 'Serial port', value: NA }, { label: 'Baud rate', value: NA }, { label: 'Workspace dimensions', value: NA }, { label: 'Axis configuration', value: NA }] },
      { title: 'Calibration', items: [{ label: 'Display dimensions', value: NA }, { label: 'CNC origin', value: NA }, { label: 'Calibration parameters', value: NA }, { label: 'Coordinate mapping', value: NA }] }] };
  },
};
