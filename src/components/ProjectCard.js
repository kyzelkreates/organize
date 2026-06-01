import { renderStatusBadge, renderPriorityBadge } from './StatusBadge.js';
import { formatRelativeTime, truncateText } from '../utils/formatters.js';
export function renderProjectCard(project) {
  const pc = { Low:'#10b981',Medium:'#3b82f6',High:'#f59e0b',Critical:'#ef4444' };
  const color = pc[project.priority]||'var(--border)';
  const tags = (project.tags||[]).slice(0,3).map(t=>`<span class="badge badge-tag">${t}</span>`).join('');
  return `<div class="project-card" style="--priority-color:${color}" data-project-id="${project.id}">
    <div class="project-card-header">
      <div style="flex:1;min-width:0;"><div class="project-card-title">${truncateText(project.name,50)}</div><div class="project-card-type">${project.type||'Other'}</div></div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">${renderStatusBadge(project.status)}${renderPriorityBadge(project.priority)}</div>
    </div>
    ${project.description?`<div class="card-desc">${truncateText(project.description,120)}</div>`:''}
    ${tags?`<div class="project-card-badges mt-8">${tags}</div>`:''}
    <div class="project-card-meta">
      ${project.techStack?`<span>🛠 ${truncateText(project.techStack,30)}</span>`:''}
      ${project.buildTool?`<span>⚙ ${project.buildTool}</span>`:''}
      <span style="margin-left:auto;">${formatRelativeTime(project.updatedAt)}</span>
    </div>
  </div>`;
}
