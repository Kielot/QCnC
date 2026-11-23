import { api } from '../services';
import { usePoll } from '../hooks/usePoll';
import { Badge, Card, Row, Spinner, ErrorNote } from '../components/common/ui';
import TestTable from '../components/common/TestTable';
import { fmtDur } from '../utils/format';
export default function Dashboard() {
  const { data: hist, loading, error } = usePoll(api.getTestHistory, 3000, []);
  const { data: st } = usePoll(api.getSystemStatus, 5000, []);
  if (loading) return <Spinner />;
  const h = hist ?? [], done = h.filter(t => t.durationMs != null);
  const stats: [string, string | number][] = [['Total tests', h.length], ['Successful', h.filter(t => t.status === 'successful').length], ['Failed', h.filter(t => t.status === 'failed').length],
    ['Average execution time', done.length ? fmtDur(done.reduce((a, t) => a + (t.durationMs ?? 0), 0) / done.length) : '—']];
  return <div className="space-y-4">
    {error && <ErrorNote text={error} />}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([k, v]) => <div key={k} className="card p-4"><div className="text-xs text-slate-500">{k}</div><div className="mt-1 text-2xl font-semibold">{v}</div></div>)}</div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Recent test activity" className="lg:col-span-2"><TestTable rows={h.slice(0, 6)} /></Card>
      <Card title="System status" right={st?.mode === 'mock' ? <Badge tone="amber">SIMULATED</Badge> : undefined}>
        <dl>{(st?.components ?? []).map(c => <Row key={c.id} k={c.label} v={<span title={c.detail}>{c.state}{c.detail ? ` · ${c.detail}` : ''}</span>} />)}</dl></Card>
    </div></div>;
}
