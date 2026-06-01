const pageTitles = {
  dashboard:'Dashboard', projects:'Projects', 'project-detail':'Project Detail',
  prompts:'Prompt Vault', errors:'Error Centre', 'repair-plans':'Repair Plans',
  'key-vault':'Key Vault', 'ai-playground':'AI Playground',
  'import-export':'Import / Export', settings:'Settings'
};
export function renderTopBar(currentPage, state) {
  return `<div class="topbar-inner">
    <div style="display:flex;align-items:center;gap:12px;">
      <button class="hamburger" id="hamburger-btn">☰</button>
      <span class="topbar-title">${pageTitles[currentPage]||'Dashboard'}</span>
    </div>
    <div class="topbar-right">
      <span class="topbar-owner">${state.app.owner||'Kyzel Kreates'}</span>
      <span class="topbar-version">v${state.app.version||'1.1.0'}</span>
    </div>
  </div>
  <div class="sidebar-overlay" id="sidebar-overlay"></div>`;
}
document.addEventListener('click', e => {
  if (e.target.closest('#hamburger-btn')) {
    document.getElementById('sidebar-container')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('active');
  }
  if (e.target.closest('#sidebar-overlay')) {
    document.getElementById('sidebar-container')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
  }
});
