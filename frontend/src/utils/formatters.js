export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function formatTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

export function formatDateTime(value) {
  if (!value) return '-';
  return `${formatDate(value)} ${formatTime(value)}`;
}

export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function liveDuration(inTime) {
  if (!inTime) return '-';
  const minutes = Math.max(0, Math.round((Date.now() - new Date(inTime).getTime()) / 60000));
  return formatDuration(minutes);
}
