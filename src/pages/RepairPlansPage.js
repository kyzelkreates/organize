import { getState, setState, generateId, createTimestamp, updateTimestamp } from '../storage.js';
import { renderEmptyState } from '../components/EmptyState.js';
import { showModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { validateRepairPlan } from '../utils/validators.js';
import { renderPriorityBadge } from '../components/StatusBadge.js';
import { formatRelativeTime, truncateText } from '../utils/formatters.js';
const PRIORITIES=['Low','Medium','High','Critical'];
const PLAN_STATUSES=['Not Started','In Progress','Complete','Abandoned'];
export function renderRepairPlans(state) {
  const { repairPlans, projects } = state;
  const params=new URLSearchParams(window.location.hash.split('?')[1]||'');
  const search=params.get('q')||'';
  let filtered=[...repairPlans];
  if(search){const q=search.toLowerCase();filtered=filtered.filter(r=>r.title.toLowerCase().includes(q));}
  filtered.sort((a,b)=>{const ord={Critical:0,High:1,Medium:2,Low:3};return(ord[a.priority]??4)-(ord[b.priority]??4);});
  return `<div class="page-header"><div class="page-title">Repair Plans</div><div class="page-subtitle">Step-by-step fix plans generated from projects and errors.</div></div>
    <div class="toolbar"><div class="search-box"><span class="search-icon">⌕</span><input class="search-input" id="repair-search" placeholder="Search plans…" value="${search}" /></div><button class="btn btn-primary" id="btn-new-plan">+ New Plan</button></div>
    <div id="repair-plans-list">${filtered.length===0?renderEmptyState({icon:'⟳',title:'No repair plans yet',desc:'Generate from a project or error, or create manually.',action:'<button class="btn btn-primary" id="btn-new-plan-2">+ New Plan</button>'}):filtered.map(plan=>{const proj=projects.find(p=>p.id===plan.linkedProjectId);const done=plan.steps.filter(s=>s.done).length,total=plan.steps.length,pct=total>0?Math.round(done/total*100):0;return `<div class="repair-card" id="repair-${plan.id}"><div class="card-header"><div style="flex:1;min-width:0;"><div class="card-title">${truncateText(plan.title,60)}</div><div class="card-meta">${renderPriorityBadge(plan.priority)}<span class="badge">${plan.status}</span>${proj?`<span>→ ${truncateText(proj.name,30)}</span>`:''}<span>${done}/${total} steps · ${pct}%</span></div></div><div style="display:flex;gap:6px;flex-shrink:0;"><button class="btn btn-xs btn-secondary" data-edit-plan="${plan.id}">✎ Edit</button><button class="btn btn-xs btn-danger" data-delete-plan="${plan.id}">✕</button></div></div><div class="health-bar mt-8" style="width:100%;"><div class="health-bar-fill" style="width:${pct}%;background:${pct===100?'var(--success)':'var(--accent)'};"></div></div><div class="steps-list mt-12">${plan.steps.map((step,idx)=>`<div class="step-item ${step.done?'step-done':''}"><div class="step-num">${step.done?'✓':idx+1}</div><span style="flex:1;">${step.text}</span><button class="btn btn-xs btn-ghost" data-toggle-step="${plan.id}" data-step-idx="${idx}">${step.done?'Undo':'Done'}</button></div>`).join('')}</div></div>`;}).join('')}</div>`;
}
document.addEventListener('click', e => {
  if(e.target.matches('#btn-new-plan,#btn-new-plan-2')) openPlanModal(null);
  const ep=e.target.closest('[data-edit-plan]');if(ep){const pl=getState().repairPlans.find(r=>r.id===ep.dataset.editPlan);if(pl)openPlanModal(pl);}
  const dp=e.target.closest('[data-delete-plan]');if(dp&&confirm('Delete this repair plan?')){const id=dp.dataset.deletePlan;const pl=getState().repairPlans.find(r=>r.id===id);setState(s=>({...s,repairPlans:s.repairPlans.filter(r=>r.id!==id),activityLog:[{id:generateId(),action:'REPAIR_PLAN_DELETED',label:`Deleted: ${pl?.title}`,timestamp:createTimestamp()},...s.activityLog]}));showToast('Deleted.','info');}
  const ts=e.target.closest('[data-toggle-step]');if(ts){const planId=ts.dataset.toggleStep,idx=parseInt(ts.dataset.stepIdx,10);setState(s=>({...s,repairPlans:s.repairPlans.map(r=>{if(r.id!==planId)return r;const steps=r.steps.map((step,i)=>i===idx?{...step,done:!step.done}:step);return{...r,steps,status:steps.every(s=>s.done)?'Complete':'In Progress',updatedAt:updateTimestamp()};})}))}
});
document.addEventListener('input', e => { if(e.target.matches('#repair-search')){clearTimeout(window._rsd);window._rsd=setTimeout(()=>{window.location.hash='/repair-plans'+(e.target.value?'?q='+encodeURIComponent(e.target.value):'');},300);} });
function openPlanModal(plan){
  const isEdit=!!plan,r=plan||{},state=getState();
  const stepsText=(r.steps||[]).map(s=>s.text).join('\n');
  const body=`<div class="form-group"><label class="form-label">Plan Title *</label><input class="form-input" id="rp-title" value="${r.title||''}" /></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="rp-priority">${PRIORITIES.map(p=>`<option value="${p}" ${r.priority===p?'selected':''}>${p}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Status</label><select class="form-select" id="rp-status">${PLAN_STATUSES.map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></div></div>
    <div class="form-group"><label class="form-label">Linked Project</label><select class="form-select" id="rp-project"><option value="">None</option>${state.projects.filter(p=>p.status!=='Archived').map(p=>`<option value="${p.id}" ${r.linkedProjectId===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Steps (one per line) *</label><textarea class="form-textarea" id="rp-steps" rows="8">${stepsText}</textarea></div>
    <div id="rp-errors" class="text-danger text-sm mt-8"></div>`;
  const footer=`${isEdit?'<button class="btn btn-danger" id="rp-delete">Delete</button>':''}<button class="btn btn-ghost" id="rp-cancel">Cancel</button><button class="btn btn-primary" id="rp-save">${isEdit?'Save':'Create'}</button>`;
  const modal=showModal({title:isEdit?'Edit Repair Plan':'New Repair Plan',body,footer});
  document.getElementById('rp-cancel').addEventListener('click',()=>modal.close());
  document.getElementById('rp-save').addEventListener('click',()=>{
    const title=document.getElementById('rp-title').value.trim();
    const stepsRaw=document.getElementById('rp-steps').value.trim().split('\n').filter(s=>s.trim());
    const data={title,priority:document.getElementById('rp-priority').value,status:document.getElementById('rp-status').value,linkedProjectId:document.getElementById('rp-project').value||null,steps:stepsRaw.map((text,i)=>({id:(isEdit&&r.steps?.[i]?.id)||generateId(),text:text.trim(),done:isEdit&&r.steps?.[i]?r.steps[i].done:false}))};
    const ve=validateRepairPlan(data);if(ve.length){document.getElementById('rp-errors').textContent=ve.join(' ');return;}
    const final=isEdit?{...r,...data,updatedAt:updateTimestamp()}:{id:generateId(),...data,linkedErrorId:null,createdAt:createTimestamp(),updatedAt:createTimestamp()};
    setState(s=>({...s,repairPlans:isEdit?s.repairPlans.map(rp=>rp.id===final.id?final:rp):[final,...s.repairPlans],activityLog:[{id:generateId(),action:isEdit?'REPAIR_PLAN_UPDATED':'REPAIR_PLAN_CREATED',label:`${isEdit?'Updated':'Created'}: ${final.title}`,timestamp:createTimestamp()},...s.activityLog]}));
    showToast(isEdit?'Updated.':'Created.','success');modal.close();
  });
  if(isEdit) document.getElementById('rp-delete')?.addEventListener('click',()=>{if(confirm('Delete?')){setState(s=>({...s,repairPlans:s.repairPlans.filter(rp=>rp.id!==r.id),activityLog:[{id:generateId(),action:'REPAIR_PLAN_DELETED',label:`Deleted: ${r.title}`,timestamp:createTimestamp()},...s.activityLog]}));showToast('Deleted.','info');modal.close();}});
}
