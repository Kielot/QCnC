export const fmtDur = (ms?: number | null) => (ms == null ? '—' : (ms / 1000).toFixed(1) + ' s');
export const fmtDate = (s?: string) => (s ? new Date(s).toLocaleString() : '—');
export function downloadCsv(name: string, rows: Record<string, string | number | boolean | null>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]); const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
