import { useState } from 'react';
import type { ReactElement } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { api } from '../services';
import { usePoll } from '../hooks/usePoll';
import { Card, Empty, ErrorNote, SimBadge, Spinner } from '../components/common/ui';
import { downloadCsv, fmtDate } from '../utils/format';
const f = (v: number | null, u: string) => (v == null ? '—' : `${v} ${u}`);
const Chart = ({ title, children }: { title: string; children: ReactElement }) => <Card title={title}><ResponsiveContainer width="100%" height={220}>{children}</ResponsiveContainer></Card>;
export default function EvaluationResults() {
  const { data, loading, error } = usePoll(api.getEvaluationResults, null, []);
  const [q, setQ] = useState(''); const [from, setFrom] = useState('');
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote text={error ?? 'No data'} />;
  const rows = data.trials.filter(t => (!q || (t.testId + t.instruction).toLowerCase().includes(q.toLowerCase())) && (!from || t.date.slice(0, 10) >= from));
  const chart = rows.filter(t => t.locErrPx != null).reverse().map(t => ({ id: t.testId.slice(-5), loc: t.locErrPx, cal: t.calErrMm, pos: t.posErrMm, time: t.timeS }));
  const s = data.summary;
  const cards: [string, string][] = [['GUI localization error', f(s.locErrPx, 'px')], ['Coordinate calibration error', f(s.calErrMm, 'mm')], ['CNC positioning error', f(s.posErrMm, 'mm')], ['Interaction success rate', f(s.successRate, '%')], ['Execution time', f(s.timeS, 's')]];
  return <div className="space-y-4">
    {data.simulated && <div><SimBadge text="SIMULATED DATA — not research measurements" /></div>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{cards.map(([k, v]) => <div key={k} className="card p-4"><div className="text-xs text-slate-500">{k}</div><div className="mt-1 text-xl font-semibold">{v}</div></div>)}</div>
    {chart.length === 0 ? <Card><Empty text="No evaluation data available yet." /></Card> : <div className="grid gap-4 lg:grid-cols-3">
      <Chart title="Localization error per trial (px)"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="id" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="loc" name="px" fill="#2563eb" /></BarChart></Chart>
      <Chart title="Calibration and positioning error (mm)"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="id" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Legend /><Bar dataKey="cal" name="Calibration" fill="#f59e0b" /><Bar dataKey="pos" name="Positioning" fill="#10b981" /></BarChart></Chart>
      <Chart title="Execution time per trial (s)"><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="id" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Line dataKey="time" name="s" stroke="#2563eb" /></LineChart></Chart></div>}
    <Card title="Trial results" right={<button className="btn-ghost !py-1" disabled={!rows.length} onClick={() => downloadCsv('qcnc-results.csv', rows.map(r => ({ test_id: r.testId, instruction: r.instruction, date: r.date, loc_error_px: r.locErrPx, cal_error_mm: r.calErrMm, pos_error_mm: r.posErrMm, time_s: r.timeS, success: r.success, simulated: data.simulated })))}><Download size={14} />Export CSV</button>}>
      <div className="mb-3 grid gap-2 sm:grid-cols-3"><input className="input" placeholder="Filter by test" aria-label="Filter" value={q} onChange={e => setQ(e.target.value)} /><input type="date" className="input" aria-label="From date" value={from} onChange={e => setFrom(e.target.value)} /></div>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px]"><thead><tr>{['Test', 'Date', 'Localization', 'Calibration', 'Positioning', 'Time', 'Success'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map(r => <tr key={r.testId}><td className="td font-mono text-xs">{r.testId}</td><td className="td">{fmtDate(r.date)}</td><td className="td">{f(r.locErrPx, 'px')}</td><td className="td">{f(r.calErrMm, 'mm')}</td><td className="td">{f(r.posErrMm, 'mm')}</td><td className="td">{f(r.timeS, 's')}</td><td className="td">{r.success ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div> : <Empty text="No trials match the filters." />}
    </Card></div>;
}
