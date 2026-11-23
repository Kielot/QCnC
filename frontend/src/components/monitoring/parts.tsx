import type { ReactNode } from 'react';
import { AlertTriangle, Info, OctagonAlert, XCircle } from 'lucide-react';
import type { Severity, StageStatus, TestError, TestRecord } from '../../types';
import { Card, StatusBadge } from '../common/ui';
import { fmtDate } from '../../utils/format';

export function Screenshot({ t }: { t: TestRecord }) {
  const g = t.grounding, { width: w, height: h } = t.screenshot;
  return <div className="mx-auto w-full max-w-[240px]">
    <div className="relative overflow-hidden rounded-2xl border-4 border-slate-800 bg-white" style={{ aspectRatio: `${w}/${h}` }}>
      <svg viewBox="0 0 1080 2400" className="absolute inset-0 h-full w-full" aria-label="Sample Android screen">
        <rect width="1080" height="2400" fill="#f8fafc" /><rect width="1080" height="220" fill="#1e40af" /><text x="60" y="150" fontSize="64" fill="#fff">Sample App</text>
        <rect x="100" y="500" width="880" height="180" rx="30" fill="#fff" stroke="#cbd5e1" strokeWidth="4" /><text x="150" y="615" fontSize="52" fill="#94a3b8">Email</text>
        <rect x="100" y="800" width="880" height="180" rx="30" fill="#fff" stroke="#cbd5e1" strokeWidth="4" /><text x="150" y="915" fontSize="52" fill="#94a3b8">Password</text>
        <rect x="200" y="1440" width="680" height="192" rx="40" fill="#2563eb" /><text x="540" y="1565" fontSize="64" fill="#fff" textAnchor="middle">Submit</text>
        <text x="540" y="2200" fontSize="56" fill="#b45309" textAnchor="middle">SAMPLE SCREENSHOT</text><text x="540" y="2280" fontSize="56" fill="#b45309" textAnchor="middle">SIMULATED</text>
      </svg>
      {g && <><div className="absolute border-2 border-red-500 bg-red-500/10" style={{ left: `${g.bbox[0] * 100}%`, top: `${g.bbox[1] * 100}%`, width: `${(g.bbox[2] - g.bbox[0]) * 100}%`, height: `${(g.bbox[3] - g.bbox[1]) * 100}%` }} />
        <div className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 ring-2 ring-white" style={{ left: `${g.centroid[0] * 100}%`, top: `${g.centroid[1] * 100}%` }} /></>}
    </div>
    <p className="mt-2 text-center text-xs text-amber-700">Sample screenshot (simulated) · {w}×{h}</p>
  </div>;
}
export function AgentCard({ title, status, children, error }: { title: string; status: StageStatus; children: ReactNode; error?: string }) {
  return <Card title={title} right={<StatusBadge status={status} />}>{children}{error && <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">{error}</p>}</Card>;
}
const SEV: Record<Severity, [string, typeof Info]> = { info: ['border-blue-200 bg-blue-50 text-blue-800', Info], warning: ['border-amber-200 bg-amber-50 text-amber-900', AlertTriangle], error: ['border-red-200 bg-red-50 text-red-800', XCircle], critical: ['border-red-400 bg-red-100 text-red-900', OctagonAlert] };
export function ErrorPanel({ e }: { e: TestError }) {
  const [cls, Icon] = SEV[e.severity];
  return <div className={`rounded-xl border p-4 ${cls}`}><div className="flex items-center gap-2 font-semibold"><Icon size={18} />{e.category}<span className="ml-auto text-xs font-normal">{e.severity}</span></div>
    <p className="mt-1 text-sm">{e.description}</p>
    <dl className="mt-2 grid grid-cols-2 gap-x-4 text-xs sm:grid-cols-4"><div><dt className="opacity-70">Error ID</dt><dd>{e.id}</dd></div><div><dt className="opacity-70">Test ID</dt><dd>{e.testId}</dd></div><div><dt className="opacity-70">Stage</dt><dd>{e.stage}</dd></div><div><dt className="opacity-70">Time</dt><dd>{fmtDate(e.timestamp)}</dd></div></dl>
    {e.details && <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(e.details, null, 2)}</pre>}</div>;
}
export const Timeline = ({ t }: { t: TestRecord }) => <ol className="space-y-2 text-sm">{t.logs.map((l, i) => <li key={i} className="flex gap-3"><time className="w-20 shrink-0 font-mono text-xs text-slate-500">{new Date(l.timestamp).toLocaleTimeString()}</time><span className={l.level === 'error' || l.level === 'critical' ? 'text-red-700' : l.level === 'warning' ? 'text-amber-700' : ''}>{l.message}</span></li>)}</ol>;
