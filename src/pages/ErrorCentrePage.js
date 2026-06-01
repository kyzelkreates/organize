import { getState, setState, generateId, createTimestamp, updateTimestamp } from '../storage.js';
import { renderErrorCard } from '../components/ErrorCard.js';
import { renderEmptyState } from '../components/EmptyState.js';
import { showModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { validateError } from '../utils/validators.js';
import { classifyError, generateRepairSteps } from '../utils/classifiers.js';
import { navigate } from '../router.js';
const SOURCES=['Vercel','Supabase','Base44','Manus','Browser Console','GitHub','NPM','API','SQL','Unknown'];
const STATUSES=['Unresolved','Investigating','Fixed','Ignored'];
const SEVERITIES=['Low','Medium','High','Critical'];
export function renderErrorCentre(state) {
  const { errors, projects } = state;
  const params=new URLSearchParams(window.location.hash.split('?')[1]||'');
  const search=params.get('q')||'',filterStatus=params.get('status')||'',filterSeverity=params.get('severity')||'';
  let filtered=[...errors];
  if(search){const q=search.toLowerCase();filtered=filtered.filter(e=>e.title.toLowerCase().includes(q)||(e.rawError||'').toLowerCase().includes(q));}
  if(filterStatus) filtered=filtered.filter(e=>e.status===filterStatus);
  if(filterSeverity) filtered=filtered.filter(e=>e.severity===filterSeverity);
  filtered.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return `<div class="page-header"><div class="page-title">Error Centre</div><div class="page-subtitle">Paste, classify, diagnose, and fix errors from across your stack.</div></div>
    <div class="toolbar">
      <div class="search-box"><span class="search-icon">⌕</span><input class="search-input" id="error-search" placeholder="Search errors…" value="${search}" /></div>
      <select class="form-select" style="width:auto;" id="filter-error-status"><option value="">All Statuses</option>${STATUSES.map(s=>`<option value="${s}" ${filterStatus===s?'selected':''}>${s}</option>`).join('')}</select>
      <select class="form-select" style="width:auto;" id="filter-severity"><option value="">All Severities</option>${SEVERITIES.map(s=>`<option value="${s}" ${filterSeverity===s?'selected':''}>${s}</option>`).join('')}</select>
      <button class="btn btn-primary" id="btn-new-error">+ Add Error</button>
    </div>
    <div id="errors-list">${filtered.length===0?renderEmptyState({icon:'⚠',title:'No errors found',desc:'Add an error to classify and track it.',action:'<button class="btn btn-primary" id="btn-new-error-2">+ Add Error</button>'}):filtered.map(er=>{const proj=projects.find(p=>p.id===er.linkedProjectId);return renderErrorCard(er,proj?.name||null);}).join('')}</div>`;
}
document.addEventListener('click', e => {
  if(e.target.matches('#btn-new-error,#btn-new-error-2')) openErrorModal(null);
  const ee=e.target.closest('[data-edit-error]');if(ee){const er=getState().errors.find(x=>x.id===ee.dataset.editError);if(er)openErrorModal(er);}
  const de=e.target.closest('[data-delete-error]');
  if(de&&confirm('Delete?')){const id=de.dataset.deleteError;const er=getState().errors.find(x=>x.id===id);setState(s=>({...s,errors:s.errors.filter(x=>x.id!==id),activityLog:[{id:generateId(),action:'ERROR_DELETED',label:`Deleted error: ${er?.title}`,timestamp:createTimestamp()},...s.activityLog]}));showToast('Deleted.','info');}
});
document.addEventListener('change', e => {
  if(e.target.matches('#filter-error-status,#filter-severity')){const p=getEP();p.status=document.getElementById('filter-error-status')?.value||'';p.severity=document.getElementById('filter-severity')?.value||'';window.location.hash=buildEH(p);}
});
document.addEventListener('input', e => { if(e.target.matches('#error-search')){clearTimeout(window._esd);window._esd=setTimeout(()=>{const p=getEP();p.q=e.target.value;window.location.hash=buildEH(p);},300);} });
function getEP(){const u=new URLSearchParams(window.location.hash.split('?')[1]||'');return{q:u.get('q')||'',status:u.get('status')||'',severity:u.get('severity')||''};}
function buildEH(p){const parts=[];if(p.q)parts.push('q='+encodeURIComponent(p.q));if(p.status)parts.push('status='+encodeURIComponent(p.status));if(p.severity)parts.push('severity='+encodeURIComponent(p.severity));return'/errors'+(parts.length?'?'+parts.join('&'):'');}
function openErrorModal(error){
  const isEdit=!!error,e=error||{},state=getState();
  const body=`<div class="form-group"><label class="form-label">Error Title *</label><input class="form-input" id="em-title" value="${e.title||''}" /></div>
    <div class="form-group"><label class="form-label">Raw Error *</label><textarea class="form-textarea" id="em-raw" rows="5">${e.rawError||''}</textarea></div>
    <button class="btn btn-secondary btn-sm mb-12" id="em-classify">⚡ Auto-Classify</button>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Source</label><select class="form-select" id="em-source">${SOURCES.map(s=>`<option value="${s}" ${e.source===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Severity</label><select class="form-select" id="em-severity">${SEVERITIES.map(s=>`<option value="${s}" ${e.severity===s?'selected':''}>${s}</option>`).join('')}</select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="em-status">${STATUSES.map(s=>`<option value="${s}" ${e.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Linked Project</label><select class="form-select" id="em-project"><option value="">None</option>${state.projects.filter(p=>p.status!=='Archived').map(p=>`<option value="${p.id}" ${e.linkedProjectId===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label class="form-label">Diagnosis</label><textarea class="form-textarea" id="em-diag" rows="2">${e.diagnosis||''}</textarea></div>
    <div class="form-group"><label class="form-label">Suggested Fix</label><textarea class="form-textarea" id="em-fix" rows="2">${e.suggestedFix||''}</textarea></div>
    <div id="em-errors" class="text-danger text-sm mt-8"></div>`;
  const footer=`${isEdit?'<button class="btn btn-secondary btn-sm" id="em-gen-repair">+ Repair Plan</button><button class="btn btn-danger" id="em-delete">Delete</button>':''}<button class="btn btn-ghost" id="em-cancel">Cancel</button><button class="btn btn-primary" id="em-save">${isEdit?'Save':'Add Error'}</button>`;
  const modal=showModal({title:isEdit?'Edit Error':'Add Error',body,footer});
  document.getElementById('em-cancel').addEventListener('click',()=>modal.close());
  document.getElementById('em-classify').addEventListener('click',()=>{const r=classifyError(document.getElementById('em-raw').value);document.getElementById('em-severity').value=r.severity;document.getElementById('em-diag').value=r.diagnosis;document.getElementById('em-fix').value=r.suggestedFix;showToast('Classified!','success');});
  document.getElementById('em-save').addEventListener('click',()=>{
    const data={title:document.getElementById('em-title').value.trim(),rawError:document.getElementById('em-raw').value.trim(),source:document.getElementById('em-source').value,severity:document.getElementById('em-severity').value,status:document.getElementById('em-status').value,linkedProjectId:document.getElementById('em-project').value||null,diagnosis:document.getElementById('em-diag').value.trim(),suggestedFix:document.getElementById('em-fix').value.trim()};
    const ve=validateError(data);if(ve.length){document.getElementById('em-errors').textContent=ve.join(' ');return;}
    const final=isEdit?{...e,...data,updatedAt:updateTimestamp()}:{id:generateId(),...data,createdAt:createTimestamp(),updatedAt:createTimestamp()};
    setState(s=>({...s,errors:isEdit?s.errors.map(x=>x.id===final.id?final:x):[final,...s.errors],activityLog:[{id:generateId(),action:isEdit?'ERROR_UPDATED':'ERROR_CREATED',label:`${isEdit?'Updated':'Added'} error: ${final.title}`,timestamp:createTimestamp()},...s.activityLog]}));
    showToast(isEdit?'Updated.':'Added.','success');modal.close();
  });
  if(isEdit){
    document.getElementById('em-delete')?.addEventListener('click',()=>{if(confirm('Delete?')){setState(s=>({...s,errors:s.errors.filter(x=>x.id!==e.id),activityLog:[{id:generateId(),action:'ERROR_DELETED',label:`Deleted: ${e.title}`,timestamp:createTimestamp()},...s.activityLog]}));showToast('Deleted.','info');modal.close();}});
    document.getElementById('em-gen-repair')?.addEventListener('click',()=>{const cl=classifyError(e.rawError);const steps=generateRepairSteps(cl.category).map(text=>({id:generateId(),text,done:false}));const plan={id:generateId(),title:`Fix: ${e.title}`,linkedProjectId:e.linkedProjectId||null,linkedErrorId:e.id,priority:e.severity==='Critical'?'Critical':e.severity==='High'?'High':'Medium',status:'Not Started',steps,createdAt:createTimestamp(),updatedAt:createTimestamp()};setState(s=>({...s,repairPlans:[plan,...s.repairPlans],activityLog:[{id:generateId(),action:'REPAIR_PLAN_GENERATED',label:`Generated plan for: ${e.title}`,timestamp:createTimestamp()},...s.activityLog]}));showToast('Repair plan generated!','success');modal.close();navigate('/repair-plans');});
  }
}
