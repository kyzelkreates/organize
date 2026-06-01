import { getState, setState, generateId, createTimestamp, updateTimestamp } from '../storage.js';
import { renderProjectCard } from '../components/ProjectCard.js';
import { renderEmptyState } from '../components/EmptyState.js';
import { showModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { validateProject } from '../utils/validators.js';
import { navigate } from '../router.js';

const PROJECT_TYPES = ['PWA','SaaS','LMS','Routing Platform','AI Tool','Dashboard','Portfolio Demo','Admin System','Mobile App Concept','Other'];
const PROJECT_STATUSES = ['Working','Broken','Needs Fix','Needs Refactor','Deployment Failed','Abandoned','Rebuild Candidate','Investor Ready','Portfolio Ready','Archived'];
const PRIORITIES = ['Low','Medium','High','Critical'];

export function renderProjects(state) {
  const { projects } = state;
  const params = new URLSearchParams(window.location.hash.split('?')[1]||'');
  const search=params.get('q')||'', filterStatus=params.get('status')||'', filterPriority=params.get('priority')||'', sortBy=params.get('sort')||'updatedAt', showArchived=params.get('archived')==='1';
  let filtered = projects.filter(p=>showArchived?p.status==='Archived':p.status!=='Archived');
  if (search) { const q=search.toLowerCase(); filtered=filtered.filter(p=>p.name.toLowerCase().includes(q)||(p.description||'').toLowerCase().includes(q)||(p.techStack||'').toLowerCase().includes(q)||(p.tags||[]).some(t=>t.toLowerCase().includes(q))); }
  if (filterStatus) filtered=filtered.filter(p=>p.status===filterStatus);
  if (filterPriority) filtered=filtered.filter(p=>p.priority===filterPriority);
  filtered=[...filtered].sort((a,b)=>{if(sortBy==='name')return a.name.localeCompare(b.name);if(sortBy==='priority'){const ord={Critical:0,High:1,Medium:2,Low:3};return(ord[a.priority]??4)-(ord[b.priority]??4);}return new Date(b.updatedAt)-new Date(a.updatedAt);});
  return `<div class="page-header"><div class="page-title">Projects</div><div class="page-subtitle">Manage, classify, and fix your builds.</div></div>
    <div class="toolbar">
      <div class="search-box"><span class="search-icon">⌕</span><input class="search-input" id="project-search" placeholder="Search projects…" value="${search}" /></div>
      <select class="form-select" style="width:auto;" id="filter-status"><option value="">All Statuses</option>${PROJECT_STATUSES.map(s=>`<option value="${s}" ${filterStatus===s?'selected':''}>${s}</option>`).join('')}</select>
      <select class="form-select" style="width:auto;" id="filter-priority"><option value="">All Priorities</option>${PRIORITIES.map(p=>`<option value="${p}" ${filterPriority===p?'selected':''}>${p}</option>`).join('')}</select>
      <select class="form-select" style="width:auto;" id="sort-by"><option value="updatedAt" ${sortBy==='updatedAt'?'selected':''}>Recent</option><option value="name" ${sortBy==='name'?'selected':''}>Name</option><option value="priority" ${sortBy==='priority'?'selected':''}>Priority</option></select>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text2);cursor:pointer;"><input type="checkbox" id="show-archived" ${showArchived?'checked':''} /> Archived</label>
      <button class="btn btn-primary" id="btn-new-project">+ New Project</button>
    </div>
    <div id="projects-list">${filtered.length===0?renderEmptyState({icon:'◈',title:'No projects found',desc:'Create your first project or adjust filters.',action:'<button class="btn btn-primary" id="btn-new-project-2">+ New Project</button>'}):filtered.map(p=>renderProjectCard(p)).join('')}</div>`;
}

document.addEventListener('click', e => {
  if (e.target.matches('#btn-new-project,#btn-new-project-2')) openProjectModal(null);
});

document.addEventListener('change', e => {
  if (e.target.matches('#filter-status,#filter-priority,#sort-by,#show-archived')) {
    const params = getFilterParams();
    params.status = document.getElementById('filter-status')?.value||'';
    params.priority = document.getElementById('filter-priority')?.value||'';
    params.sort = document.getElementById('sort-by')?.value||'updatedAt';
    params.archived = document.getElementById('show-archived')?.checked?'1':'';
    window.location.hash = buildHash(params);
  }
});

document.addEventListener('input', e => {
  if (e.target.matches('#project-search')) {
    clearTimeout(window._psd);
    window._psd = setTimeout(()=>{ const p=getFilterParams(); p.q=e.target.value; window.location.hash=buildHash(p); },300);
  }
});

function getFilterParams() {
  const u=new URLSearchParams(window.location.hash.split('?')[1]||'');
  return { q:u.get('q')||'', status:u.get('status')||'', priority:u.get('priority')||'', sort:u.get('sort')||'updatedAt', archived:u.get('archived')||'' };
}

function buildHash(p) {
  const parts=[];
  if(p.q) parts.push('q='+encodeURIComponent(p.q));
  if(p.status) parts.push('status='+encodeURIComponent(p.status));
  if(p.priority) parts.push('priority='+encodeURIComponent(p.priority));
  if(p.sort&&p.sort!=='updatedAt') parts.push('sort='+p.sort);
  if(p.archived) parts.push('archived=1');
  return '/projects'+(parts.length?'?'+parts.join('&'):'');
}

export function openProjectModal(project) {
  const isEdit=!!project, p=project||{};
  const body=`
    <div class="form-row">
      <div class="form-group"><label class="form-label">Project Name *</label><input class="form-input" id="pm-name" value="${p.name||''}" placeholder="My App" /></div>
      <div class="form-group"><label class="form-label">Type</label><select class="form-select" id="pm-type">${PROJECT_TYPES.map(t=>`<option value="${t}" ${p.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="pm-desc" rows="3">${p.description||''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="pm-status">${PROJECT_STATUSES.map(s=>`<option value="${s}" ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="pm-priority">${PRIORITIES.map(pr=>`<option value="${pr}" ${p.priority===pr?'selected':''}>${pr}</option>`).join('')}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Repo URL</label><input class="form-input" id="pm-repo" value="${p.repoUrl||''}" placeholder="https://github.com/…" /></div>
      <div class="form-group"><label class="form-label">Live URL</label><input class="form-input" id="pm-live" value="${p.liveUrl||''}" placeholder="https://…" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Build Tool</label><input class="form-input" id="pm-build" value="${p.buildTool||''}" /></div>
      <div class="form-group"><label class="form-label">Sector</label><input class="form-input" id="pm-sector" value="${p.sector||''}" /></div>
    </div>
    <div class="form-group"><label class="form-label">Tech Stack</label><input class="form-input" id="pm-stack" value="${p.techStack||''}" /></div>
    <div class="form-group"><label class="form-label">Tags (comma-separated)</label><input class="form-input" id="pm-tags" value="${(p.tags||[]).join(', ')}" /></div>
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="pm-notes" rows="3">${p.notes||''}</textarea></div>
    <div id="pm-errors" class="text-danger text-sm mt-8"></div>`;
  const footer=`${isEdit?`<button class="btn btn-danger" id="pm-delete">Delete</button>${p.status==='Archived'?'<button class="btn btn-secondary" id="pm-restore">Restore</button>':'<button class="btn btn-secondary" id="pm-archive">Archive</button>'}`:''}<button class="btn btn-ghost" id="pm-cancel">Cancel</button><button class="btn btn-primary" id="pm-save">${isEdit?'Save':'Create'}</button>`;
  const modal=showModal({title:isEdit?'Edit Project':'New Project',body,footer});
  document.getElementById('pm-cancel').addEventListener('click',()=>modal.close());
  document.getElementById('pm-save').addEventListener('click',()=>{
    const data={name:document.getElementById('pm-name').value.trim(),description:document.getElementById('pm-desc').value.trim(),type:document.getElementById('pm-type').value,status:document.getElementById('pm-status').value,priority:document.getElementById('pm-priority').value,repoUrl:document.getElementById('pm-repo').value.trim(),liveUrl:document.getElementById('pm-live').value.trim(),buildTool:document.getElementById('pm-build').value.trim(),sector:document.getElementById('pm-sector').value.trim(),techStack:document.getElementById('pm-stack').value.trim(),notes:document.getElementById('pm-notes').value.trim(),tags:document.getElementById('pm-tags').value.split(',').map(t=>t.trim()).filter(Boolean)};
    const ve=validateProject(data);
    if(ve.length){document.getElementById('pm-errors').textContent=ve.join(' ');return;}
    const final=isEdit?{...p,...data,updatedAt:updateTimestamp()}:{id:generateId(),...data,createdAt:createTimestamp(),updatedAt:createTimestamp()};
    setState(s=>({...s,projects:isEdit?s.projects.map(pr=>pr.id===final.id?final:pr):[final,...s.projects],activityLog:[{id:generateId(),action:isEdit?'PROJECT_UPDATED':'PROJECT_CREATED',label:`${isEdit?'Updated':'Created'} project: ${final.name}`,timestamp:createTimestamp()},...s.activityLog]}));
    showToast(isEdit?'Project updated.':'Project created.','success'); modal.close();
  });
  if(isEdit){
    document.getElementById('pm-delete')?.addEventListener('click',()=>{if(confirm('Delete this project?')){setState(s=>({...s,projects:s.projects.filter(pr=>pr.id!==p.id),activityLog:[{id:generateId(),action:'PROJECT_DELETED',label:`Deleted project: ${p.name}`,timestamp:createTimestamp()},...s.activityLog]}));showToast('Project deleted.','info');modal.close();}});
    document.getElementById('pm-archive')?.addEventListener('click',()=>{setState(s=>({...s,projects:s.projects.map(pr=>pr.id===p.id?{...pr,status:'Archived',updatedAt:updateTimestamp()}:pr),activityLog:[{id:generateId(),action:'PROJECT_ARCHIVED',label:`Archived: ${p.name}`,timestamp:createTimestamp()},...s.activityLog]}));showToast('Archived.','info');modal.close();});
    document.getElementById('pm-restore')?.addEventListener('click',()=>{setState(s=>({...s,projects:s.projects.map(pr=>pr.id===p.id?{...pr,status:'Needs Fix',updatedAt:updateTimestamp()}:pr),activityLog:[{id:generateId(),action:'PROJECT_RESTORED',label:`Restored: ${p.name}`,timestamp:createTimestamp()},...s.activityLog]}));showToast('Restored.','success');modal.close();});
  }
}
