import { getState, setState, generateId, createTimestamp, updateTimestamp } from '../storage.js';
import { renderPromptCard } from '../components/PromptCard.js';
import { renderEmptyState } from '../components/EmptyState.js';
import { showModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { validatePrompt } from '../utils/validators.js';
const CATEGORIES = ['Build Run','Fix Prompt','Refactor Prompt','Deployment Prompt','Supabase Prompt','UI Prompt','Safety Prompt','Manus Prompt','Base44 Prompt','Other'];
export function renderPrompts(state) {
  const { prompts, projects } = state;
  const params=new URLSearchParams(window.location.hash.split('?')[1]||'');
  const search=params.get('q')||'',filterCat=params.get('cat')||'',favOnly=params.get('fav')==='1';
  let filtered=[...prompts];
  if(search){const q=search.toLowerCase();filtered=filtered.filter(p=>p.title.toLowerCase().includes(q)||p.body.toLowerCase().includes(q));}
  if(filterCat) filtered=filtered.filter(p=>p.category===filterCat);
  if(favOnly) filtered=filtered.filter(p=>p.favourite);
  filtered.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  return `<div class="page-header"><div class="page-title">Prompt Vault</div><div class="page-subtitle">Store, organise, and reuse your most powerful prompts.</div></div>
    <div class="toolbar">
      <div class="search-box"><span class="search-icon">⌕</span><input class="search-input" id="prompt-search" placeholder="Search prompts…" value="${search}" /></div>
      <select class="form-select" style="width:auto;" id="filter-cat"><option value="">All Categories</option>${CATEGORIES.map(c=>`<option value="${c}" ${filterCat===c?'selected':''}>${c}</option>`).join('')}</select>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text2);cursor:pointer;"><input type="checkbox" id="fav-only" ${favOnly?'checked':''} /> Favourites only</label>
      <button class="btn btn-primary" id="btn-new-prompt">+ New Prompt</button>
    </div>
    <div id="prompts-list">${filtered.length===0?renderEmptyState({icon:'◉',title:'No prompts found',desc:'Add your first prompt.',action:'<button class="btn btn-primary" id="btn-new-prompt-2">+ New Prompt</button>'}):filtered.map(pr=>{const proj=projects.find(p=>p.id===pr.linkedProjectId);return renderPromptCard(pr,proj?.name||null);}).join('')}</div>`;
}
document.addEventListener('click', e => {
  if(e.target.matches('#btn-new-prompt,#btn-new-prompt-2')) openPromptModal(null);
  const cp=e.target.closest('[data-copy-prompt]');
  if(cp){const pr=getState().prompts.find(p=>p.id===cp.dataset.copyPrompt);if(pr)navigator.clipboard.writeText(pr.body).then(()=>showToast('Copied!','success'));}
  const ep=e.target.closest('[data-edit-prompt]');
  if(ep){const pr=getState().prompts.find(p=>p.id===ep.dataset.editPrompt);if(pr)openPromptModal(pr);}
  const fav=e.target.closest('[data-toggle-fav]');
  if(fav){setState(s=>({...s,prompts:s.prompts.map(p=>p.id===fav.dataset.toggleFav?{...p,favourite:!p.favourite,updatedAt:updateTimestamp()}:p)}));showToast('Favourite updated.','info');}
  const dp=e.target.closest('[data-delete-prompt]');
  if(dp&&confirm('Delete this prompt?')){const id=dp.dataset.deletePrompt;const pr=getState().prompts.find(p=>p.id===id);setState(s=>({...s,prompts:s.prompts.filter(p=>p.id!==id),activityLog:[{id:generateId(),action:'PROMPT_DELETED',label:`Deleted prompt: ${pr?.title}`,timestamp:createTimestamp()},...s.activityLog]}));showToast('Deleted.','info');}
});
document.addEventListener('change', e => {
  if(e.target.matches('#filter-cat,#fav-only')){const p=getPromptParams();p.cat=document.getElementById('filter-cat')?.value||'';p.fav=document.getElementById('fav-only')?.checked?'1':'';window.location.hash=buildPH(p);}
});
document.addEventListener('input', e => {
  if(e.target.matches('#prompt-search')){clearTimeout(window._psd2);window._psd2=setTimeout(()=>{const p=getPromptParams();p.q=e.target.value;window.location.hash=buildPH(p);},300);}
});
function getPromptParams(){const u=new URLSearchParams(window.location.hash.split('?')[1]||'');return{q:u.get('q')||'',cat:u.get('cat')||'',fav:u.get('fav')||''};}
function buildPH(p){const parts=[];if(p.q)parts.push('q='+encodeURIComponent(p.q));if(p.cat)parts.push('cat='+encodeURIComponent(p.cat));if(p.fav)parts.push('fav=1');return'/prompts'+(parts.length?'?'+parts.join('&'):'');}
function openPromptModal(prompt){
  const isEdit=!!prompt,p=prompt||{},state=getState();
  const body=`<div class="form-group"><label class="form-label">Title *</label><input class="form-input" id="prom-title" value="${p.title||''}" /></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Category</label><select class="form-select" id="prom-cat">${CATEGORIES.map(c=>`<option value="${c}" ${p.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Linked Project</label><select class="form-select" id="prom-project"><option value="">None</option>${state.projects.filter(pr=>pr.status!=='Archived').map(pr=>`<option value="${pr.id}" ${p.linkedProjectId===pr.id?'selected':''}>${pr.name}</option>`).join('')}</select></div></div>
    <div class="form-group"><label class="form-label">Prompt Body *</label><textarea class="form-textarea" id="prom-body" rows="8">${p.body||''}</textarea></div>
    <div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text2);"><input type="checkbox" id="prom-fav" ${p.favourite?'checked':''} /> Favourite</label></div>
    <div id="prom-errors" class="text-danger text-sm mt-8"></div>`;
  const footer=`${isEdit?'<button class="btn btn-danger" id="prom-delete">Delete</button>':''}<button class="btn btn-ghost" id="prom-cancel">Cancel</button><button class="btn btn-primary" id="prom-save">${isEdit?'Save':'Create'}</button>`;
  const modal=showModal({title:isEdit?'Edit Prompt':'New Prompt',body,footer});
  document.getElementById('prom-cancel').addEventListener('click',()=>modal.close());
  document.getElementById('prom-save').addEventListener('click',()=>{
    const data={title:document.getElementById('prom-title').value.trim(),category:document.getElementById('prom-cat').value,body:document.getElementById('prom-body').value.trim(),linkedProjectId:document.getElementById('prom-project').value||null,favourite:document.getElementById('prom-fav').checked};
    const ve=validatePrompt(data);if(ve.length){document.getElementById('prom-errors').textContent=ve.join(' ');return;}
    const final=isEdit?{...p,...data,updatedAt:updateTimestamp()}:{id:generateId(),...data,createdAt:createTimestamp(),updatedAt:createTimestamp()};
    setState(s=>({...s,prompts:isEdit?s.prompts.map(pr=>pr.id===final.id?final:pr):[final,...s.prompts],activityLog:[{id:generateId(),action:isEdit?'PROMPT_UPDATED':'PROMPT_CREATED',label:`${isEdit?'Updated':'Created'} prompt: ${final.title}`,timestamp:createTimestamp()},...s.activityLog]}));
    showToast(isEdit?'Updated.':'Created.','success');modal.close();
  });
  if(isEdit) document.getElementById('prom-delete')?.addEventListener('click',()=>{if(confirm('Delete?')){setState(s=>({...s,prompts:s.prompts.filter(pr=>pr.id!==p.id),activityLog:[{id:generateId(),action:'PROMPT_DELETED',label:`Deleted: ${p.title}`,timestamp:createTimestamp()},...s.activityLog]}));showToast('Deleted.','info');modal.close();}});
}
