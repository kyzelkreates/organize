import { getState, setState, generateId, createTimestamp, updateTimestamp } from '../storage.js';
import { renderStatusBadge, renderPriorityBadge, renderSeverityBadge } from '../components/StatusBadge.js';
import { renderEmptyState } from '../components/EmptyState.js';
import { showToast } from '../components/Toast.js';
import { classifyProject, generateRepairSteps } from '../utils/classifiers.js';
import { formatDate, formatRelativeTime, safeUrl, truncateText } from '../utils/formatters.js';
import { openProjectModal } from './ProjectsPage.js';
import { navigate } from '../router.js';

export function renderProjectDetail(state, params) {
  const { id } = params;
  const project = state.projects.find(p=>p.id===id);
  if (!project) return `<div class="page-header"><div class="page-title">Project Not Found</div></div>${renderEmptyState({icon:'◈',title:'Project not found',desc:'It may have been deleted.',action:'<button class="btn btn-secondary" data-nav="/projects">← Back</button>'})}`;
  const linkedErrors=state.errors.filter(e=>e.linkedProjectId===id);
  const linkedPrompts=state.prompts.filter(p=>p.linkedProjectId===id);
  const linkedPlans=state.repairPlans.filter(r=>r.linkedProjectId===id);
  const cl=classifyProject(project,linkedErrors);
  const portfolioChecklist=[
    {text:'Live URL is set and working',done:!!project.liveUrl},
    {text:'Repo URL is set',done:!!project.repoUrl},
    {text:'Description is complete',done:(project.description||'').length>40},
    {text:'No unresolved critical errors',done:linkedErrors.filter(e=>e.severity==='Critical'&&e.status!=='Fixed'&&e.status!=='Ignored').length===0},
    {text:'Tech stack is documented',done:!!project.techStack},
    {text:'Status is Working or better',done:['Working','Portfolio Ready','Investor Ready'].includes(project.status)}
  ];
  const investorChecklist=[...portfolioChecklist,{text:'Sector is defined',done:!!project.sector},{text:'Priority is Low or Medium (stable)',done:['Low','Medium'].includes(project.priority)},{text:'Notes describe value proposition',done:(project.notes||'').length>60}];
  const portScore=portfolioChecklist.filter(i=>i.done).length;
  const invScore=investorChecklist.filter(i=>i.done).length;
  return `
    <div style="margin-bottom:16px;"><button class="btn btn-ghost btn-sm" data-nav="/projects">← Back to Projects</button></div>
    <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
      <div><div class="page-title">${project.name}</div><div class="page-subtitle" style="margin-top:8px;">${renderStatusBadge(project.status)}${renderPriorityBadge(project.priority)}<span class="badge" style="margin-left:4px;">${project.type}</span></div></div>
      <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;"><button class="btn btn-secondary btn-sm" id="btn-edit-project" data-project-id="${project.id}">✎ Edit</button><button class="btn btn-primary btn-sm" id="btn-gen-repair">+ Repair Plan</button></div>
    </div>
    <div class="detail-grid">
      <div>
        <div class="info-card" style="border-color:rgba(0,245,255,0.2);background:rgba(0,245,255,0.03);">
          <div class="info-card-title">🧠 AI Classification</div>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;"><span>Suggested:</span>${renderStatusBadge(cl.suggestedStatus)}</div>
          <div class="text-sm text-muted mb-8">${cl.reason}</div>
          <div class="text-sm" style="color:var(--accent);">→ ${cl.nextBestAction}</div>
        </div>
        <div class="info-card">
          <div class="info-card-title">Project Info</div>
          ${project.description?`<div class="detail-field"><div class="detail-field-label">Description</div><div class="detail-field-value">${project.description}</div></div>`:''}
          ${project.techStack?`<div class="detail-field"><div class="detail-field-label">Tech Stack</div><div class="detail-field-value">${project.techStack}</div></div>`:''}
          ${project.buildTool?`<div class="detail-field"><div class="detail-field-label">Build Tool</div><div class="detail-field-value">${project.buildTool}</div></div>`:''}
          ${project.sector?`<div class="detail-field"><div class="detail-field-label">Sector</div><div class="detail-field-value">${project.sector}</div></div>`:''}
          ${project.repoUrl?`<div class="detail-field"><div class="detail-field-label">Repo</div><div class="detail-field-value"><a href="${safeUrl(project.repoUrl)}" target="_blank" rel="noopener" style="color:var(--accent);">${truncateText(project.repoUrl,50)}</a></div></div>`:''}
          ${project.liveUrl?`<div class="detail-field"><div class="detail-field-label">Live URL</div><div class="detail-field-value"><a href="${safeUrl(project.liveUrl)}" target="_blank" rel="noopener" style="color:var(--success);">${truncateText(project.liveUrl,50)}</a></div></div>`:''}
          ${project.notes?`<div class="detail-field"><div class="detail-field-label">Notes</div><div class="detail-field-value">${project.notes}</div></div>`:''}
          ${(project.tags||[]).length>0?`<div class="detail-field"><div class="detail-field-label">Tags</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">${project.tags.map(t=>`<span class="badge badge-tag">${t}</span>`).join('')}</div></div>`:''}
          <div class="detail-field"><div class="detail-field-label">Created</div><div class="detail-field-value text-muted">${formatDate(project.createdAt)} · Updated ${formatRelativeTime(project.updatedAt)}</div></div>
        </div>
        <div class="info-card">
          <div class="info-card-title">Linked Errors (${linkedErrors.length})</div>
          ${linkedErrors.length===0?'<div class="text-muted text-sm">No errors linked.</div>':linkedErrors.map(e=>`<div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;"><div style="flex:1;min-width:0;"><div class="fw-600 text-sm">${truncateText(e.title,50)}</div><div class="text-xs text-muted">${e.source}</div></div>${renderSeverityBadge(e.severity)}${renderStatusBadge(e.status)}</div>`).join('')}
          ${linkedErrors.length>0?'<button class="btn btn-xs btn-ghost mt-8" data-nav="/errors">View all errors →</button>':''}
        </div>
        <div class="info-card">
          <div class="info-card-title">Repair Plans (${linkedPlans.length})</div>
          ${linkedPlans.length===0?'<div class="text-muted text-sm">No repair plans yet.</div>':linkedPlans.map(pl=>`<div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;"><div style="flex:1;min-width:0;"><div class="fw-600 text-sm">${truncateText(pl.title,50)}</div><div class="text-xs text-muted">${pl.steps.filter(s=>s.done).length}/${pl.steps.length} done</div></div><span class="badge badge-priority-${pl.priority.toLowerCase()}">${pl.priority}</span></div>`).join('')}
          ${linkedPlans.length>0?'<button class="btn btn-xs btn-ghost mt-8" data-nav="/repair-plans">View plans →</button>':''}
        </div>
      </div>
      <div>
        <div class="info-card">
          <div class="info-card-title">Portfolio Readiness (${portScore}/${portfolioChecklist.length})</div>
          <div class="checklist">${portfolioChecklist.map(i=>`<div class="checklist-item ${i.done?'done':''}"><input type="checkbox" disabled ${i.done?'checked':''} /><span>${i.text}</span></div>`).join('')}</div>
        </div>
        <div class="info-card">
          <div class="info-card-title">Investor Readiness (${invScore}/${investorChecklist.length})</div>
          <div class="checklist">${investorChecklist.map(i=>`<div class="checklist-item ${i.done?'done':''}"><input type="checkbox" disabled ${i.done?'checked':''} /><span>${i.text}</span></div>`).join('')}</div>
        </div>
        <div class="info-card">
          <div class="info-card-title">Quick Repair Checklist</div>
          <div class="checklist">
            ${[{t:'Review latest deployment log',d:false},{t:'Check all env vars in production',d:!!project.liveUrl},{t:'Confirm repo is up to date',d:!!project.repoUrl},{t:'Run local build with no errors',d:['Working','Portfolio Ready','Investor Ready'].includes(project.status)},{t:'Fix all critical/high errors',d:false},{t:'Add live URL',d:!!project.liveUrl},{t:'Test on mobile',d:false},{t:'Update project status',d:['Working','Portfolio Ready','Investor Ready'].includes(project.status)}].map(i=>`<div class="checklist-item ${i.d?'done':''}"><input type="checkbox" disabled ${i.d?'checked':''} /><span>${i.t}</span></div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

document.addEventListener('click', e => {
  const editBtn=e.target.closest('#btn-edit-project');
  if (editBtn) { const p=getState().projects.find(pr=>pr.id===editBtn.dataset.projectId); if(p) openProjectModal(p); }
  if (e.target.matches('#btn-gen-repair')) {
    const m=window.location.hash.match(/\/projects\/(.+)/);
    if(!m) return;
    const project=getState().projects.find(p=>p.id===m[1]);
    if(!project) return;
    const type=project.status==='Deployment Failed'?'Deployment Failed':project.status==='Broken'?'Build Failure':'default';
    const steps=generateRepairSteps(type).map(text=>({id:generateId(),text,done:false}));
    const plan={id:generateId(),title:`Repair Plan: ${project.name}`,linkedProjectId:project.id,linkedErrorId:null,priority:project.priority||'Medium',status:'Not Started',steps,createdAt:createTimestamp(),updatedAt:createTimestamp()};
    setState(s=>({...s,repairPlans:[plan,...s.repairPlans],activityLog:[{id:generateId(),action:'REPAIR_PLAN_GENERATED',label:`Generated repair plan for: ${project.name}`,timestamp:createTimestamp()},...s.activityLog]}));
    showToast('Repair plan generated!','success');
    navigate('/repair-plans');
  }
});
