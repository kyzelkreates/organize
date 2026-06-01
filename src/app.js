import { getState, subscribe } from './storage.js';
import { initRouter, navigate } from './router.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderTopBar } from './components/TopBar.js';
import { renderDashboard } from './pages/DashboardPage.js';
import { renderProjects } from './pages/ProjectsPage.js';
import { renderProjectDetail } from './pages/ProjectDetailPage.js';
import { renderPrompts } from './pages/PromptsPage.js';
import { renderErrorCentre } from './pages/ErrorCentrePage.js';
import { renderRepairPlans } from './pages/RepairPlansPage.js';
import { renderImportExport } from './pages/ImportExportPage.js';
import { renderSettings } from './pages/SettingsPage.js';
import './components/TopBar.js';

let currentPage = 'dashboard', currentParams = {};

function render() {
  const state = getState();
  document.documentElement.style.setProperty('--accent', state.settings.accent || '#00f5ff');
  document.body.classList.toggle('compact-mode', !!state.settings.compactMode);
  const sidebar = document.getElementById('sidebar-container');
  const topbar  = document.getElementById('topbar-container');
  const page    = document.getElementById('page-container');
  if (sidebar) sidebar.innerHTML = renderSidebar(currentPage);
  if (topbar)  topbar.innerHTML  = renderTopBar(currentPage, state);
  if (page) {
    const map = { dashboard: renderDashboard, projects: renderProjects, prompts: renderPrompts,
      errors: renderErrorCentre, 'repair-plans': renderRepairPlans,
      'import-export': renderImportExport, settings: renderSettings };
    if (currentPage === 'project-detail') page.innerHTML = renderProjectDetail(state, currentParams);
    else page.innerHTML = (map[currentPage] || renderDashboard)(state);
  }
  document.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.nav); }));
  document.querySelectorAll('[data-project-id]').forEach(el => el.addEventListener('click', () => navigate('/projects/' + el.dataset.projectId)));
}

subscribe(() => render());
initRouter((page, params) => { currentPage = page; currentParams = params || {}; render(); });
