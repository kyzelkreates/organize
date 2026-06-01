import { renderStatusBadge, renderSeverityBadge } from './StatusBadge.js';
import { truncateText, formatRelativeTime } from '../utils/formatters.js';
export function renderErrorCard(error, projectName) {
  return `<div class="error-card" id="error-${error.id}">
    <div class="card-header">
      <div style="flex:1;min-width:0;"><div class="card-title">${truncateText(error.title,60)}</div>
        <div class="card-meta">${renderSeverityBadge(error.severity)}${renderStatusBadge(error.status)}<span class="badge">${error.source||'Unknown'}</span>${projectName?`<span>→ ${projectName}</span>`:''}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;"><button class="btn btn-xs btn-secondary" data-edit-error="${error.id}">✎ Edit</button><button class="btn btn-xs btn-danger" data-delete-error="${error.id}">✕</button></div>
    </div>
    ${error.rawError?`<div class="code-block mt-8" style="max-height:80px;overflow:hidden;">${truncateText(error.rawError,200)}</div>`:''}
    ${error.diagnosis?`<div class="card-desc mt-8"><strong>Diagnosis:</strong> ${truncateText(error.diagnosis,120)}</div>`:''}
    ${error.suggestedFix?`<div class="card-desc"><strong>Fix:</strong> ${truncateText(error.suggestedFix,120)}</div>`:''}
    <div class="card-meta mt-8">${formatRelativeTime(error.updatedAt)}</div>
  </div>`;
}
