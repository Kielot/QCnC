import { useNavigate } from 'react-router-dom';
import type { TestRecord } from '../../types';
import { Empty, StatusBadge } from './ui';
import { fmtDate, fmtDur } from '../../utils/format';
export default function TestTable({ rows, outcome }: { rows: TestRecord[]; outcome?: boolean }) {
  const nav = useNavigate();
  if (!rows.length) return <Empty text="No tests yet. Start one from New Test." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[720px]"><thead className="border-b border-slate-100"><tr>
    {['Test ID', 'Instruction', 'Target element', 'Date and time', 'Status', 'Duration', ...(outcome ? ['Interaction outcome'] : []), ''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
    <tbody className="divide-y divide-slate-100">{rows.map(t => <tr key={t.id} className="hover:bg-slate-50">
      <td className="td font-mono text-xs">{t.id}</td><td className="td max-w-[220px] truncate">{t.instruction}</td><td className="td">{t.target}</td><td className="td whitespace-nowrap">{fmtDate(t.createdAt)}</td>
      <td className="td"><StatusBadge status={t.status} /></td><td className="td">{fmtDur(t.durationMs)}</td>{outcome && <td className="td">{t.outcome ?? '—'}</td>}
      <td className="td"><button className="text-blue-600 hover:underline" onClick={() => nav('/monitor/' + t.id)}>View details</button></td></tr>)}</tbody></table></div>;
}
