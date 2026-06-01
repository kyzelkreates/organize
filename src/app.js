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
import { renderKeyVault } from './pages/KeyVaultPage.js';
import { renderAIPlayground } from './pages/AIPlaygroundPage.js';
import { renderImportExport } from './pages/ImportExportPage.js';
import { renderSettings } from './pages/SettingsPage.js';
import './components/TopBar.js';
import './pages/KeyVaultPage.js';
import './pages/AIPlaygroundPage.js';

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
    switch(currentPage) {
      case 'dashboard':      page.innerHTML = renderDashboard(state); break;
      case 'projects':       page.innerHTML = renderProjects(state); break;
      case 'project-detail': page.innerHTML = renderProjectDetail(state, currentParams); break;
      case 'prompts':        page.innerHTML = renderPrompts(state); break;
      case 'errors':         page.innerHTML = renderErrorCentre(state); break;
      case 'repair-plans':   page.innerHTML = renderRepairPlans(state); break;
      case 'key-vault':      page.innerHTML = renderKeyVault(state); break;
      case 'ai-playground':  page.innerHTML = renderAIPlayground(state); break;
      case 'import-export':  page.innerHTML = renderImportExport(state); break;
      case 'settings':       page.innerHTML = renderSettings(state); break;
      default:               page.innerHTML = renderDashboard(state);
    }
  }
  document.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.nav); }));
  document.querySelectorAll('[data-project-id]').forEach(el => el.addEventListener('click', () => navigate('/projects/' + el.dataset.projectId)));
}

subscribe(() => render());
initRouter((page, params) => { currentPage = page; currentParams = params || {}; render(); });
