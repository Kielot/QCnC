import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services';
import { SCENARIOS } from '../services/mockApi';
import { usePoll, useOnline } from '../hooks/usePoll';
import { Badge, Card, ErrorNote, Row } from '../components/common/ui';
import type { Scenario } from '../types';
export default function NewTest() {
  const [text, setText] = useState(''); const [scenario, setScenario] = useState<Scenario>('success'); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const nav = useNavigate(); const online = useOnline();
  const { data: st } = usePoll(api.getSystemStatus, 5000, []); const { data: hist } = usePoll(api.getTestHistory, 2000, []);
  const mock = st?.mode === 'mock'; const running = hist?.find(t => t.status === 'running' || t.status === 'queued');
  const backendDown = st?.mode === 'real' && st.components.find(c => c.id === 'backend')?.state !== 'connected';
  async function submit() {
    if (!text.trim()) { setErr('Enter an instruction before starting a test.'); return; }
    setBusy(true); setErr('');
    try { const r = await api.startTest({ instruction: text.trim(), scenario: mock ? scenario : undefined }); nav('/monitor/' + r.id); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  return <div className="grid gap-4 lg:grid-cols-3">
    <Card title="Test instruction" className="lg:col-span-2">
      <label htmlFor="ins" className="mb-1 block text-sm text-slate-600">What should the CNC system interact with?</label>
      <textarea id="ins" rows={5} className="input" value={text} onChange={e => setText(e.target.value)} placeholder="Describe the GUI element you want the CNC system to interact with..." />
      <p className="mt-1 text-xs text-slate-500">Example: “Click the Submit button.”</p>
      {err && <div className="mt-3"><ErrorNote text={err} /></div>}
      {running && <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Test {running.id} is still running. <button className="underline" onClick={() => nav('/monitor/' + running.id)}>View progress</button></div>}
      {backendDown && <div className="mt-3"><ErrorNote text="Backend unavailable. Tests cannot be started." /></div>}
      <div className="mt-4 flex gap-2">
        <button className="btn-primary" disabled={busy || !!running || !!backendDown || !online} onClick={submit}>{busy ? 'Submitting…' : 'Start test'}</button>
        <button className="btn-ghost" disabled={busy} onClick={() => { setText(''); setErr(''); }}>Clear</button>
      </div>
    </Card>
    <div className="space-y-4">
      <Card title="Android device" right={mock ? <Badge tone="amber">SIMULATED</Badge> : undefined}>
        <dl><Row k="Status" v={st?.components.find(c => c.id === 'android')?.state ?? '—'} /><Row k="Device" v={st?.device?.id ?? 'Not reported'} /><Row k="Model" v={st?.device?.model ?? 'Not reported'} /><Row k="Screen" v={st?.device?.resolution ?? 'Not reported'} /></dl></Card>
      {mock && <Card title="Demo control: simulated outcome" right={<Badge tone="amber">DEMO ONLY</Badge>}>
        <select className="input" value={scenario} onChange={e => setScenario(e.target.value as Scenario)} aria-label="Simulated scenario">{SCENARIOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        <p className="mt-2 text-xs text-slate-500">For frontend testing only. This is not a system setting.</p></Card>}
    </div></div>;
}
