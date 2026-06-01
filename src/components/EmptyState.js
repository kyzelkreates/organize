export function renderEmptyState({ icon='📭', title='Nothing here yet', desc='', action='' }) {
  return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><div class="empty-state-title">${title}</div>${desc?`<div class="empty-state-desc">${desc}</div>`:''} ${action}</div>`;
}
