export function renderStatCard({ value, label, color = 'var(--accent)' }) {
  return `<div class="stat-card" style="--stat-color:${color}"><div class="stat-card-value">${value}</div><div class="stat-card-label">${label}</div></div>`;
}
