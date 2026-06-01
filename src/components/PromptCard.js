import { truncateText, formatRelativeTime } from '../utils/formatters.js';
export function renderPromptCard(prompt, projectName) {
  return `<div class="prompt-card" id="prompt-${prompt.id}">
    <div class="prompt-card-header">
      <div style="flex:1;min-width:0;"><div class="card-title">${truncateText(prompt.title,60)}</div>
        <div class="card-meta"><span class="badge badge-tag">${prompt.category}</span>${projectName?`<span style="margin-left:6px;">→ ${projectName}</span>`:''}${prompt.favourite?'<span style="margin-left:6px;color:#f59e0b;">★ Favourite</span>':''}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <button class="btn btn-xs btn-secondary" data-copy-prompt="${prompt.id}">⎘</button>
        <button class="btn btn-xs btn-secondary" data-edit-prompt="${prompt.id}">✎</button>
        <button class="btn btn-xs btn-secondary" data-toggle-fav="${prompt.id}">${prompt.favourite?'★':'☆'}</button>
        <button class="btn btn-xs btn-danger" data-delete-prompt="${prompt.id}">✕</button>
      </div>
    </div>
    <div class="prompt-body">${prompt.body||''}</div>
    <div class="card-meta mt-8">${formatRelativeTime(prompt.updatedAt)}</div>
  </div>`;
}
