const navItems = [
  { path: '/',              label: 'Dashboard',    icon: '⬡' },
  { path: '/projects',      label: 'Projects',     icon: '◈' },
  { path: '/prompts',       label: 'Prompt Vault', icon: '◉' },
  { path: '/errors',        label: 'Error Centre', icon: '⚠' },
  { path: '/repair-plans',  label: 'Repair Plans', icon: '⟳' },
  { path: '/key-vault',     label: 'Key Vault',    icon: '🔑' },
  { path: '/ai-playground', label: 'AI Playground',icon: '🤖' },
  { path: '/import-export', label: 'Import / Export', icon: '⇅' },
  { path: '/settings',      label: 'Settings',     icon: '⚙' }
];
export function renderSidebar(currentPage) {
  const pageMap = {
    dashboard:'/', projects:'/projects', 'project-detail':'/projects',
    prompts:'/prompts', errors:'/errors', 'repair-plans':'/repair-plans',
    'key-vault':'/key-vault', 'ai-playground':'/ai-playground',
    'import-export':'/import-export', settings:'/settings'
  };
  const activePath = pageMap[currentPage] || '/';
  return `
    <div class="sidebar-brand">
      <div class="sidebar-brand-title">AP3X PROJECT<br/>RESCUE OS™</div>
      <div class="sidebar-brand-sub">by Kyzel Kreates</div>
    </div>
    <nav class="sidebar-nav">
      ${navItems.map(item=>`<a class="nav-item ${activePath===item.path?'active':''}" data-nav="${item.path}" href="#"><span class="nav-icon">${item.icon}</span><span>${item.label}</span></a>`).join('')}
    </nav>
    <div class="sidebar-footer">Local-first · No backend · PWA</div>`;
}
