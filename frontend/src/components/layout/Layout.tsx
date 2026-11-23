import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, BarChart3, Download, History as HistoryIcon, LayoutDashboard, Menu, PlayCircle, Settings, WifiOff, X } from 'lucide-react';
import { api } from '../../services';
import { usePoll, useOnline } from '../../hooks/usePoll';

const NAV = [['/', 'Dashboard', LayoutDashboard], ['/new', 'New Test', PlayCircle], ['/monitor', 'Test Monitoring', Activity], ['/history', 'Test History', HistoryIcon], ['/results', 'Evaluation Results', BarChart3], ['/config', 'System Configuration', Settings]] as const;
const DOT = { connected: 'bg-emerald-500', simulated: 'bg-amber-400', disconnected: 'bg-red-500', unknown: 'bg-slate-300' };

export default function Layout() {
  const [open, setOpen] = useState(false); const loc = useLocation(); const online = useOnline();
  const { data: st } = usePoll(api.getSystemStatus, 5000, []);
  const [prompt, setPrompt] = useState<any>(null);
  useEffect(() => { const h = (e: Event) => { e.preventDefault(); setPrompt(e); }; window.addEventListener('beforeinstallprompt', h); return () => window.removeEventListener('beforeinstallprompt', h); }, []);
  useEffect(() => setOpen(false), [loc.pathname]);
  const title = NAV.find(([p]) => (p === '/' ? loc.pathname === '/' : loc.pathname.startsWith(p)))?.[1] ?? 'QCnC';
  const chips = (st?.components ?? []).filter(c => ['backend', 'android', 'cnc'].includes(c.id));
  return (
    <div className="flex min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink text-slate-300 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-5"><div><div className="text-xl font-bold tracking-tight text-white">QCnC</div><div className="text-xs text-slate-400">Physical GUI Testing System</div></div>
          <button className="lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}><X size={20} /></button></div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-ink2 hover:text-white'}`}><Icon size={18} />{label}</NavLink>)}
        </nav>
        <div className="px-5 py-4 text-xs text-slate-500">{st?.mode === 'mock' ? 'Mock API mode' : 'Flask API mode'}</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <h1 className="mr-auto text-lg font-semibold">{title}</h1>
          {chips.map(c => <span key={c.id} title={c.detail} className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 sm:inline-flex"><i className={`h-2 w-2 rounded-full ${DOT[c.state]}`} />{c.label.split(' ')[0]} · {c.state}</span>)}
          {prompt && <button className="btn-ghost !py-1" onClick={async () => { prompt.prompt(); await prompt.userChoice; setPrompt(null); }}><Download size={14} />Install</button>}
        </header>
        {st?.mode === 'mock' && <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">DEMO MODE — all data is simulated. No backend, AI agents, Android device or CNC hardware is connected.</div>}
        {!online && <div className="flex items-center justify-center gap-2 bg-red-600 px-4 py-1.5 text-xs font-medium text-white"><WifiOff size={14} />You are offline. Live statuses are unavailable{st?.mode === 'real' ? ' and tests cannot be started.' : '.'}</div>}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
