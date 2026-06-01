import { getState, setState, resetState } from '../storage.js';
import { showToast } from '../components/Toast.js';
const ACCENT_COLORS = [{label:'Cyan',value:'#00f5ff'},{label:'Purple',value:'#7c3aed'},{label:'Green',value:'#10b981'},{label:'Amber',value:'#f59e0b'},{label:'Pink',value:'#ec4899'},{label:'Blue',value:'#3b82f6'}];
export function renderSettings(state) {
  const { settings, app } = state;
  return `<div class="page-header"><div class="page-title">Settings</div><div class="page-subtitle">Customise AP3X OS.</div></div>
    <div class="card mb-16">
      <div class="section-title mb-12">Appearance</div>
      <div class="settings-row"><div><div class="settings-row-label">Compact Mode</div><div class="settings-row-desc">Reduce card padding for a denser layout.</div></div><label class="toggle"><input type="checkbox" id="setting-compact" ${settings.compactMode?'checked':''} /><div class="toggle-track"></div><div class="toggle-thumb"></div></label></div>
      <div class="settings-row"><div><div class="settings-row-label">Accent Colour</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;">${ACCENT_COLORS.map(c=>`<button class="btn btn-xs accent-btn" data-accent="${c.value}" title="${c.label}" style="width:28px;height:28px;padding:0;border-radius:50%;background:${c.value};border:2px solid ${settings.accent===c.value?'#fff':'transparent'};cursor:pointer;"></button>`).join('')}</div></div>
    </div>
    <div class="card mb-16">
      <div class="section-title mb-12">Data</div>
      <div class="settings-row"><div><div class="settings-row-label">Show Demo Data</div><div class="settings-row-desc">Toggle demo record visibility.</div></div><label class="toggle"><input type="checkbox" id="setting-demo" ${settings.showDemoData?'checked':''} /><div class="toggle-track"></div><div class="toggle-thumb"></div></label></div>
      <div class="settings-row"><div><div class="settings-row-label">Reset All Data</div><div class="settings-row-desc">Wipe everything.</div></div><button class="btn btn-danger btn-sm" id="settings-reset">Reset Data</button></div>
    </div>
    <div class="card">
      <div class="section-title mb-12">About</div>
      <div class="settings-row"><div class="settings-row-label">App Name</div><span class="text-muted">${app.name}</span></div>
      <div class="settings-row"><div class="settings-row-label">Version</div><span class="badge" style="color:var(--accent);">v${app.version}</span></div>
      <div class="settings-row"><div class="settings-row-label">Owner</div><span class="text-muted">${app.owner}</span></div>
      <div class="notice mt-16"><span class="notice-icon">🔒</span><span>All data is stored in this browser using localStorage. No backend, no cloud sync, no external AI calls.</span></div>
    </div>`;
}
document.addEventListener('change', e => {
  if(e.target.matches('#setting-compact')){setState(s=>({...s,settings:{...s.settings,compactMode:e.target.checked}}));showToast(e.target.checked?'Compact mode on.':'Compact mode off.','info');}
  if(e.target.matches('#setting-demo')){setState(s=>({...s,settings:{...s.settings,showDemoData:e.target.checked}}));showToast('Setting saved.','info');}
});
document.addEventListener('click', e => {
  const ab=e.target.closest('.accent-btn');if(ab){const accent=ab.dataset.accent;setState(s=>({...s,settings:{...s.settings,accent}}));document.documentElement.style.setProperty('--accent',accent);showToast('Accent updated.','success');}
  if(e.target.matches('#settings-reset')){if(confirm('Reset ALL data?')){if(confirm('Final confirm.')){resetState();showToast('Reset.','info');}}}
});
