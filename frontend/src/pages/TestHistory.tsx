import { useMemo, useState } from 'react';
import { api } from '../services';
import { usePoll } from '../hooks/usePoll';
import { Badge, Card, Spinner } from '../components/common/ui';
import TestTable from '../components/common/TestTable';
const PAGE = 8;
export default function TestHistory() {
  const { data, loading } = usePoll(api.getTestHistory, 4000, []);
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [page, setPage] = useState(0);
  const rows = useMemo(() => (data ?? []).filter(t => (!status || t.status === status) && (!q || (t.id + t.instruction + t.target).toLowerCase().includes(q.toLowerCase()))
    && (!from || t.createdAt.slice(0, 10) >= from) && (!to || t.createdAt.slice(0, 10) <= to)), [data, q, status, from, to]);
  if (loading) return <Spinner />;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE)), p = Math.min(page, pages - 1);
  const reset = <T,>(f: (v: T) => void) => (v: T) => { f(v); setPage(0); };
  return <Card title="Test history" right={<Badge tone="amber">LOCAL DEMO RECORDS (this browser)</Badge>}>
    <div className="mb-4 grid gap-2 sm:grid-cols-4">
      <input className="input" placeholder="Search ID, instruction, target" aria-label="Search" value={q} onChange={e => reset(setQ)(e.target.value)} />
      <select className="input" aria-label="Status" value={status} onChange={e => reset(setStatus)(e.target.value)}><option value="">All statuses</option>{['successful', 'failed', 'running', 'stopped'].map(s => <option key={s}>{s}</option>)}</select>
      <input type="date" className="input" aria-label="From date" value={from} onChange={e => reset(setFrom)(e.target.value)} /><input type="date" className="input" aria-label="To date" value={to} onChange={e => reset(setTo)(e.target.value)} />
    </div>
    <TestTable rows={rows.slice(p * PAGE, (p + 1) * PAGE)} outcome />
    <div className="mt-3 flex items-center justify-end gap-2 text-sm"><span className="text-slate-500">{rows.length} records · page {p + 1} of {pages}</span>
      <button className="btn-ghost !py-1" disabled={p === 0} onClick={() => setPage(p - 1)}>Previous</button><button className="btn-ghost !py-1" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Next</button></div>
  </Card>;
}
