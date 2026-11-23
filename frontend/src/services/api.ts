// Future real Flask provider. These routes are PROPOSED (see API_CONTRACT.md); they do not exist yet.
import type { QCnCApi } from './apiTypes';
import type { SystemStatus } from '../types';
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (!navigator.onLine) throw new Error('Browser is offline. Requests are not queued.');
  const r = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!r.ok) throw new Error(`Backend error ${r.status} ${r.statusText}`);
  return r.json();
}
export const realApi: QCnCApi = {
  async getSystemStatus() {
    try { return await http<SystemStatus>('/system/status'); } catch (e) {
      return { mode: 'real', components: [
        { id: 'frontend', label: 'Frontend', state: 'connected' },
        { id: 'backend', label: 'Backend (Flask)', state: 'disconnected', detail: (e as Error).message },
        { id: 'android', label: 'Android / ADB', state: 'unknown' }, { id: 'lmstudio', label: 'LM Studio / Qwen3-VL', state: 'unknown' }, { id: 'cnc', label: 'CNC / GRBL', state: 'unknown' }] };
    }
  },
  startTest: r => http('/tests', { method: 'POST', body: JSON.stringify({ instruction: r.instruction }) }),
  getTestStatus: id => http(`/tests/${id}`),
  getTestLogs: id => http(`/tests/${id}/logs`),
  getTestHistory: () => http('/tests'),
  getTestDetails: id => http(`/tests/${id}`),
  getEvaluationResults: () => http('/results'),
  getSystemConfiguration: () => http('/configuration'),
  stopTest: id => http(`/tests/${id}/stop`, { method: 'POST' }),
};
