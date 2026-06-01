const CACHE_NAME = 'ap3x-os-v1';
const SHELL_ASSETS = [
  '/','/index.html','/manifest.json','/src/styles/styles.css',
  '/src/app.js','/src/storage.js','/src/router.js',
  '/src/components/Sidebar.js','/src/components/TopBar.js',
  '/src/components/StatCard.js','/src/components/ProjectCard.js',
  '/src/components/PromptCard.js','/src/components/ErrorCard.js',
  '/src/components/Modal.js','/src/components/EmptyState.js',
  '/src/components/StatusBadge.js','/src/components/Toast.js',
  '/src/pages/DashboardPage.js','/src/pages/ProjectsPage.js',
  '/src/pages/ProjectDetailPage.js','/src/pages/PromptsPage.js',
  '/src/pages/ErrorCentrePage.js','/src/pages/RepairPlansPage.js',
  '/src/pages/ImportExportPage.js','/src/pages/SettingsPage.js',
  '/src/utils/classifiers.js','/src/utils/validators.js',
  '/src/utils/formatters.js','/src/utils/sampleData.js'
];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(SHELL_ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match('/index.html'));
  }));
});
