function parseDate(date: string | Date): Date {
  if (date instanceof Date) { return date; }
  if (date.length === 10) { return new Date(`${date}T12:00:00Z`); }
  return new Date(date.endsWith('Z') ? date : `${date}Z`);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) { return '—'; }
  const d = parseDate(date);
  if (isNaN(d.getTime())) { return '—'; }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) { return '—'; }
  const d = parseDate(date);
  if (isNaN(d.getTime())) { return '—'; }
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
