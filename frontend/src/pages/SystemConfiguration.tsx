import { api } from '../services';
import { usePoll } from '../hooks/usePoll';
import { Card, ErrorNote, Row, SimBadge, Spinner } from '../components/common/ui';
export default function SystemConfiguration() {
  const { data, loading, error } = usePoll(api.getSystemConfiguration, null, []);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorNote text={error ?? 'No configuration'} />;
  return <div className="space-y-4">
    <div className="flex items-center gap-2 text-sm text-slate-600">{data.simulated && <SimBadge text="MOCK MODE" />}Read-only. Settings become editable only when the backend supports it. “Not provided” means the backend has not reported a value.</div>
    <div className="grid gap-4 md:grid-cols-2">{data.sections.map(s => <Card key={s.title} title={s.title}><dl>{s.items.map(i => <Row key={i.label} k={i.label} v={i.value ?? <span className="font-normal text-slate-400">Not provided</span>} />)}</dl></Card>)}</div></div>;
}
