const routes = { '/':'dashboard','/projects':'projects','/prompts':'prompts','/errors':'errors','/repair-plans':'repair-plans','/import-export':'import-export','/settings':'settings' };
let _onNavigate = null;
export function initRouter(onNavigate) { _onNavigate = onNavigate; window.addEventListener('hashchange', handleRoute); handleRoute(); }
export function navigate(path) { window.location.hash = path; }
function handleRoute() {
  const hash = window.location.hash.replace('#', '') || '/';
  const m = hash.match(/^\/projects\/(.+)$/);
  if (m) { if (_onNavigate) _onNavigate('project-detail', { id: m[1] }); return; }
  const base = hash.split('?')[0];
  if (_onNavigate) _onNavigate(routes[base] || 'dashboard', {});
}
export function getCurrentPath() { return window.location.hash.replace('#', '') || '/'; }
