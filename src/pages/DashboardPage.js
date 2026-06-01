import { getState, setState, generateId, createTimestamp } from '../storage.js';
import { renderStatCard } from '../components/StatCard.js';
import { renderStatusBadge, renderPriorityBadge } from '../components/StatusBadge.js';
import { formatRelativeTime, truncateText } from '../utils/formatters.js';

export function renderDashboard(state) {
  const { projects, errors, activityLog } = state;
  const active = projects.filter(p => p.status !== 'Archived');
  const counts = {
    total: active.length,
    working: active.filter(p=>p.status==='Working').length,
    broken: active.filter(p=>p.status==='Broken').length,
    deployFail: active.filter(p=>p.status==='Deployment Failed').length,
    portfolio: active.filter(p=>p.status==='Portfolio Ready').length,
    investor: active.filter(p=>p.status==='Investor Ready').length,
    rebuild: active.filter(p=>p.status==='Rebuild Candidate').length,
    archived: projects.filter(p=>p.status==='Archived').length
  };
  const rawScore = 100 + counts.working*3 + counts.portfolio*5 - counts.broken*8 - counts.deployFail*6 - active.filter(p=>p.status==='Needs Fix').length*4;
  const health = Math.max(0, Math.min(100, rawScore));
  const healthLabel = health>=90?'Strong':health>=70?'Stable':health>=40?'Needs Control':'Critical';
  const healthColor = health>=90?'#10b981':health>=70?'#3b82f6':health>=40?'#f59e0b':'#ef4444';
  const recentProjects = [...active].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,5);
  const priorityFixes = active.filter(p=>['Broken','Deployment Failed','Needs Fix'].includes(p.status)).sort((a,b)=>{const ord={Critical:0,High:1,Medium:2,Low:3};return (ord[a.priority]??4)-(ord[b.priority]??4);}).slice(0,4);
  const latestErrors = [...errors].filter(e=>e.status!=='Fixed'&&e.status!=='Ignored').sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4);
  const recentActivity = [...activityLog].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,8);
  const nextActions = [];
  if (counts.broken>0) nextActions.push({icon:'🔴',text:`Fix ${counts.broken} broken project${counts.broken>1?'s':''}`,action:'/projects'});
  if (counts.deployFail>0) nextActions.push({icon:'🚀',text:`Resolve ${counts.deployFail} deployment failure${counts.deployFail>1?'s':''}`,action:'/repair-plans'});
  if (latestErrors.length>0) nextActions.push({icon:'⚠',text:`Classify ${latestErrors.length} unresolved error${latestErrors.length>1?'s':''}`,action:'/errors'});
  if (counts.rebuild>0) nextActions.push({icon:'♻',text:`Review ${counts.rebuild} rebuild candidate${counts.rebuild>1?'s':''}`,action:'/projects'});
  if (nextActions.length===0) nextActions.push({icon:'✅',text:'All clear — keep building!',action:'/'});
  return `
    <div class="page-header">
      <div class="page-title" style="font-size:28px;color:var(--accent);text-shadow:var(--glow);">Rescue Your Builds</div>
      <div class="page-subtitle">Track what works, expose what's broken, and turn unfinished systems into deployable products.</div>
    </div>
    <div class="health-score-card">
      <div class="health-score-number" style="color:${healthColor};">${health}</div>
      <div style="flex:1;">
        <div class="health-score-label">System Health Score</div>
        <div class="health-score-status" style="color:${healthColor};">${healthLabel}</div>
        <div class="health-bar"><div class="health-bar-fill" style="width:${health}%;background:${healthColor};"></div></div>
      </div>
    </div>
    <div class="stat-grid">
      ${renderStatCard({value:counts.total,label:'Total Projects',color:'var(--accent)'})}
      ${renderStatCard({value:counts.working,label:'Working',color:'#10b981'})}
      ${renderStatCard({value:counts.broken,label:'Broken',color:'#ef4444'})}
      ${renderStatCard({value:counts.deployFail,label:'Deployment Failed',color:'#f97316'})}
      ${renderStatCard({value:counts.portfolio,label:'Portfolio Ready',color:'#00f5ff'})}
      ${renderStatCard({value:counts.investor,label:'Investor Ready',color:'#f59e0b'})}
      ${renderStatCard({value:counts.rebuild,label:'Rebuild Candidates',color:'#7c3aed'})}
      ${renderStatCard({value:counts.archived,label:'Archived',color:'#64748b'})}
    </div>
    <div class="dashboard-grid">
      <div class="dashboard-col">
        <div class="card">
          <div class="section-header"><span class="section-title">Recent Projects</span><a class="btn btn-xs btn-ghost" data-nav="/projects">View all →</a></div>
          ${recentProjects.length===0?'<div class="text-muted text-sm">No projects yet.</div>':recentProjects.map(p=>`<div class="flex gap-8 mb-8" style="align-items:center;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" data-project-id="${p.id}"><div style="flex:1;min-width:0;"><div class="fw-600 text-sm">${truncateText(p.name,40)}</div><div class="text-xs text-muted">${p.type} · ${formatRelativeTime(p.updatedAt)}</div></div>${renderStatusBadge(p.status)}</div>`).join('')}
        </div>
        <div class="card">
          <div class="section-header"><span class="section-title">Highest Priority Fixes</span><a class="btn btn-xs btn-ghost" data-nav="/projects">Projects →</a></div>
          ${priorityFixes.length===0?'<div class="text-muted text-sm">No broken or failing projects.</div>':priorityFixes.map(p=>`<div class="flex gap-8 mb-8" style="align-items:center;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" data-project-id="${p.id}"><div style="flex:1;min-width:0;"><div class="fw-600 text-sm">${truncateText(p.name,40)}</div></div>${renderStatusBadge(p.status)}${renderPriorityBadge(p.priority)}</div>`).join('')}
        </div>
      </div>
      <div class="dashboard-col">
        <div class="card">
          <div class="section-header"><span class="section-title">Next Best Actions</span></div>
          ${nextActions.map(a=>`<div class="flex gap-8 mb-8" style="align-items:center;padding:8px 0;border-bottom:1px solid var(--border);"><span>${a.icon}</span><span class="text-sm flex-1">${a.text}</span>${a.action!=='/'?`<a class="btn btn-xs btn-secondary" data-nav="${a.action}">Go →</a>`:''}</div>`).join('')}
        </div>
        <div class="card">
          <div class="section-header"><span class="section-title">Latest Unresolved Errors</span><a class="btn btn-xs btn-ghost" data-nav="/errors">Error Centre →</a></div>
          ${latestErrors.length===0?'<div class="text-muted text-sm">No unresolved errors. 🎉</div>':latestErrors.map(e=>`<div class="flex gap-8 mb-8" style="align-items:center;padding:8px 0;border-bottom:1px solid var(--border);"><div style="flex:1;min-width:0;"><div class="fw-600 text-sm">${truncateText(e.title,40)}</div><div class="text-xs text-muted">${e.source}</div></div><span class="badge badge-severity-${e.severity.toLowerCase()}">${e.severity}</span></div>`).join('')}
        </div>
        <div class="card">
          <div class="section-header"><span class="section-title">Recent Activity</span></div>
          ${recentActivity.length===0?'<div class="text-muted text-sm">No activity yet.</div>':`<div class="activity-list">${recentActivity.map(a=>`<div class="activity-item"><div class="activity-dot"></div><span>${a.label}</span><span class="activity-time">${formatRelativeTime(a.timestamp)}</span></div>`).join('')}</div>`}
        </div>
      </div>
    </div>`;
}
