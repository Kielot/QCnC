import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Square } from 'lucide-react';
import { api } from '../services';
import { usePoll } from '../hooks/usePoll';
import { Badge, Card, Empty, ErrorNote, Row, SimBadge, Spinner, StatusBadge } from '../components/common/ui';
import { AgentCard, ErrorPanel, Screenshot, Timeline } from '../components/monitoring/parts';
import { fmtDate, fmtDur } from '../utils/format';

export default function TestMonitoring() {
  const { id } = useParams(); const nav = useNavigate();
  const { data: hist, loading: hl } = usePoll(api.getTestHistory, null, [id]);
  const tid = id ?? hist?.[0]?.id;
  if (!id && hl) return <Spinner />;
  if (!tid) return <Card><Empty text="No test selected. Start a test from New Test." /></Card>;
  return <TestView id={tid} onNew={() => nav('/new')} />;
}
function TestView({ id, onNew }: { id: string; onNew: () => void }) {
  const { data: t, error } = usePoll(() => api.getTestStatus(id), 800, [id], d => d.status !== 'running' && d.status !== 'queued');
  const [now, setNow] = useState(Date.now()); const [msg, setMsg] = useState('');
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(i); }, []);
  if (error && !t) return <ErrorNote text={error} />;
  if (!t) return <Spinner />;
  const live = t.status === 'running' || t.status === 'queued';
  const done = t.stages.filter(s => s.status === 'completed').length, pct = Math.round((done / t.stages.length) * 100);
  const st = (sid: string) => t.stages.find(s => s.id === sid)!.status;
  const errFor = (sid: string) => (t.error && t.stages.find(s => s.id === sid)?.status === 'failed' ? t.error.description : undefined);
  const elapsed = t.durationMs ?? now - Date.parse(t.createdAt);
  async function stop() { if (!window.confirm('Request this test to stop? The backend decides how to stop safely.')) return; try { setMsg((await api.stopTest(id)).message); } catch (e) { setMsg((e as Error).message); } }
  return <div className="space-y-4">
    <Card title={`Test ${t.id}`} right={<div className="flex items-center gap-2">{t.simulated && <SimBadge />}<StatusBadge status={t.status} /></div>}>
      <p className="text-sm font-medium">{t.instruction}</p>
      <div className="mt-3 grid gap-x-8 sm:grid-cols-3"><Row k="Started" v={fmtDate(t.createdAt)} /><Row k="Elapsed" v={fmtDur(elapsed)} /><Row k="Interaction outcome" v={t.outcome ?? '—'} /></div>
      <div className="mt-3 h-2 overflow-hidden rounded bg-slate-100" role="progressbar" aria-valuenow={pct}><div className={`h-full transition-all ${t.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: pct + '%' }} /></div>
      <div className="mt-3 flex items-center gap-2"><span className="text-xs text-slate-500">{pct}% · {done}/{t.stages.length} stages</span><span className="ml-auto text-xs text-slate-500">{msg}</span>
        {live ? <button className="btn-danger !py-1" onClick={stop}><Square size={14} />Stop test</button> : <button className="btn-ghost !py-1" onClick={onNew}>New test</button>}</div>
    </Card>
    {t.error && <ErrorPanel e={t.error} />}
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Screenshot preview"><Screenshot t={t} />
        <dl className="mt-3"><Row k="Detected target" v={t.grounding?.target ?? 'None'} /><Row k="Bounding box" v={t.grounding ? t.grounding.bbox.map(v => v.toFixed(3)).join(', ') : '—'} /><Row k="Centroid (normalized)" v={t.grounding ? t.grounding.centroid.join(', ') : '—'} /><Row k="Resolution" v={`${t.screenshot.width} × ${t.screenshot.height}`} /></dl></Card>
      <div className="space-y-4 lg:col-span-2">
        <AgentCard title="Agent 1 · Visual grounding" status={st('grounding')} error={errFor('grounding')}><dl><Row k="Model" v={t.grounding?.model ?? '—'} /><Row k="Target" v={t.grounding?.target ?? '—'} /><Row k="Bounding box" v={t.grounding ? t.grounding.bbox.join(', ') : '—'} /><Row k="Centroid" v={t.grounding ? t.grounding.centroid.join(', ') : '—'} /></dl></AgentCard>
        <AgentCard title="Agent 2 · Coordinate calibration" status={st('calibration')} error={errFor('calibration')}><dl><Row k="Physical X" v={t.calibration ? t.calibration.xMm + ' mm' : '—'} /><Row k="Physical Y" v={t.calibration ? t.calibration.yMm + ' mm' : '—'} /><Row k="Workspace validation" v={t.calibration ? (t.calibration.workspaceValid ? 'Within workspace' : 'Outside workspace') : '—'} /><Row k="Calibration" v={t.calibration?.info ?? '—'} /></dl></AgentCard>
        <AgentCard title="Agent 3 · G-code generation" status={st('gcode')} error={errFor('gcode') ?? errFor('validation')}>
          {t.gcode ? <><pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{t.gcode.join('\n')}</pre><p className="mt-2 text-xs">Validation: {t.gcodeValid === undefined ? 'pending' : t.gcodeValid ? <Badge tone="green">passed</Badge> : <Badge tone="red">failed</Badge>}</p></> : <p className="text-sm text-slate-500">No G-code generated.</p>}</AgentCard>
      </div></div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="CNC execution" right={t.simulated ? <Badge tone="amber">NO REAL MOVEMENT</Badge> : undefined}><dl>
        <Row k="Connection" v={t.cnc?.connection ?? (t.simulated ? 'Simulated (no hardware)' : 'Not reported')} /><Row k="Current position" v={t.cnc?.position ?? 'Not available'} />
        <Row k="Target position" v={t.calibration ? `X ${t.calibration.xMm}, Y ${t.calibration.yMm} mm` : '—'} /><Row k="Execution state" v={t.cnc?.state ?? st('cnc')} /><Row k="Stylus actuation" v={t.cnc?.stylus ?? 'Not available'} /></dl></Card>
      <Card title="Execution timeline">{t.logs.length ? <Timeline t={t} /> : <Empty text="No events yet." />}</Card>
    </div>
    {t.evaluation && <Card title="Evaluation measurements" right={<SimBadge />}><div className="grid gap-x-8 sm:grid-cols-4"><Row k="Localization error" v={t.evaluation.locErrPx + ' px'} /><Row k="Calibration error" v={t.evaluation.calErrMm + ' mm'} /><Row k="Positioning error" v={t.evaluation.posErrMm + ' mm'} /><Row k="Execution time" v={t.evaluation.timeS + ' s'} /></div></Card>}
  </div>;
}
