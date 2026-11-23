import type { ReactNode } from 'react';
const TONES = { green: 'bg-emerald-50 text-emerald-700 ring-emerald-200', red: 'bg-red-50 text-red-700 ring-red-200', blue: 'bg-blue-50 text-blue-700 ring-blue-200', amber: 'bg-amber-50 text-amber-800 ring-amber-200', slate: 'bg-slate-100 text-slate-600 ring-slate-200' };
export type Tone = keyof typeof TONES;
const STATUS_TONE: Record<string, Tone> = { successful: 'green', completed: 'green', failed: 'red', running: 'blue', queued: 'slate', pending: 'slate', stopped: 'amber', skipped: 'slate' };
export const Badge = ({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) => <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>{children}</span>;
export const StatusBadge = ({ status }: { status: string }) => <Badge tone={STATUS_TONE[status] ?? 'slate'}>{status}</Badge>;
export const SimBadge = ({ text = 'SIMULATED DATA' }: { text?: string }) => <Badge tone="amber">{text}</Badge>;
export function Card({ title, right, children, className = '' }: { title?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{title && <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-semibold text-slate-800">{title}</h2>{right}</header>}<div className="p-4">{children}</div></section>;
}
export const Empty = ({ text }: { text: string }) => <div className="py-10 text-center text-sm text-slate-500">{text}</div>;
export const Row = ({ k, v }: { k: string; v: ReactNode }) => <div className="flex justify-between gap-3 py-1 text-sm"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-slate-800">{v}</dd></div>;
export const Spinner = () => <div className="py-10 text-center text-sm text-slate-400">Loading…</div>;
export const ErrorNote = ({ text }: { text: string }) => <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{text}</div>;
