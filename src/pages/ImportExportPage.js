import { getState, setState, exportState, importState, resetState, seedDemoData, generateId, createTimestamp } from '../storage.js';
import { showToast } from '../components/Toast.js';
import { validateImportedState } from '../utils/validators.js';
import { getSampleData } from '../utils/sampleData.js';
import { formatRelativeTime } from '../utils/formatters.js';
export function renderImportExport(state) {
  const raw=localStorage.getItem('ap3x_os_state')||'{}';
  const usageKB=(new Blob([raw]).size/1024).toFixed(1);
  return `<div class="page-header"><div class="page-title">Import / Export</div><div class="page-subtitle">Back up your data, restore from a file, or reset everything.</div></div>
    <div class="ie-grid">
      <div class="ie-card"><div class="ie-card-icon">⬇</div><div class="ie-card-title">Export All Data</div><div class="ie-card-desc">Download a full JSON backup of all your data.</div><button class="btn btn-primary" id="btn-export">Export JSON</button></div>
      <div class="ie-card"><div class="ie-card-icon">⬆</div><div class="ie-card-title">Import Data</div><div class="ie-card-desc">Restore from a JSON file. This will overwrite current data.</div><label class="btn btn-secondary" style="cursor:pointer;">Select JSON File<input type="file" id="import-file" accept=".json" style="display:none;" /></label></div>
      <div class="ie-card"><div class="ie-card-icon">◈</div><div class="ie-card-title">Load Demo Data</div><div class="ie-card-desc">Load 5 sample projects to explore the app.</div><button class="btn btn-secondary" id="btn-demo">Load Demo Data</button></div>
      <div class="ie-card"><div class="ie-card-icon">✕</div><div class="ie-card-title">Reset All Data</div><div class="ie-card-desc">Wipe everything and start fresh. Export first!</div><button class="btn btn-danger" id="btn-reset">Reset Everything</button></div>
    </div>
    <div class="card">
      <div class="section-title mb-12">Storage Info</div>
      <div class="settings-row"><div><div class="settings-row-label">localStorage Usage</div></div><span class="text-accent fw-600">${usageKB} KB</span></div>
      <div class="settings-row"><div><div class="settings-row-label">Last Updated</div></div><span class="text-muted">${formatRelativeTime(state.app.updatedAt)}</span></div>
      <div class="settings-row"><div class="settings-row-label">Projects</div><span class="fw-600">${state.projects.length}</span></div>
      <div class="settings-row"><div class="settings-row-label">Prompts</div><span class="fw-600">${state.prompts.length}</span></div>
      <div class="settings-row"><div class="settings-row-label">Errors</div><span class="fw-600">${state.errors.length}</span></div>
      <div class="settings-row"><div class="settings-row-label">Repair Plans</div><span class="fw-600">${state.repairPlans.length}</span></div>
    </div>
    <div id="import-result"></div>`;
}
document.addEventListener('click', e => {
  if(e.target.matches('#btn-export')){const blob=new Blob([exportState()],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ap3x-os-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);setState(s=>({...s,activityLog:[{id:generateId(),action:'DATA_EXPORTED',label:'Data exported to JSON',timestamp:createTimestamp()},...s.activityLog]}));showToast('Exported!','success');}
  if(e.target.matches('#btn-demo')){if(confirm('Load demo data? This will ADD demo records.')){seedDemoData(getSampleData());showToast('Demo data loaded!','success');}}
  if(e.target.matches('#btn-reset')){if(confirm('Reset ALL data? Export first if needed.')){if(confirm('Final confirm — this deletes everything.')){resetState();showToast('Data reset.','info');}}}
});
document.addEventListener('change', e => {
  if(e.target.matches('#import-file')){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{try{const parsed=JSON.parse(ev.target.result);const errors=validateImportedState(parsed);if(errors.length){const el=document.getElementById('import-result');if(el)el.innerHTML=`<div class="notice" style="border-color:rgba(239,68,68,0.3);margin-top:16px;"><span>✕ Import failed: ${errors.join(', ')}</span></div>`;return;}if(confirm('Import? This will replace all current data.')){importState(ev.target.result);showToast('Imported!','success');}}catch{showToast('Invalid JSON.','error');}};reader.readAsText(file);e.target.value='';}
});
