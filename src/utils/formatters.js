export function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); } catch { return '—'; }
}
export function formatRelativeTime(iso) {
  if (!iso) return '—';
  try {
    const diff = Date.now()-new Date(iso).getTime(), mins=Math.floor(diff/60000);
    if (mins<1) return 'Just now'; if (mins<60) return mins+'m ago';
    const hours=Math.floor(mins/60); if (hours<24) return hours+'h ago';
    const days=Math.floor(hours/24); if (days<30) return days+'d ago';
    return formatDate(iso);
  } catch { return '—'; }
}
export function truncateText(str, max=80) { if (!str) return ''; if (str.length<=max) return str; return str.slice(0,max)+'…'; }
export function statusToClass(status) { return 'badge-'+(status||'').toLowerCase().replace(/\s+/g,'-'); }
export function priorityToClass(priority) { return 'badge-priority-'+(priority||'').toLowerCase(); }
export function safeUrl(url) {
  if (!url) return '#';
  try { const u=new URL(url); if (['http:','https:'].includes(u.protocol)) return url; return '#'; } catch { return '#'; }
}
