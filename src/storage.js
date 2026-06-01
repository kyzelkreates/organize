const STORAGE_KEY = 'ap3x_os_state';
export const DEFAULT_STATE = {
  app: { name: 'AP3X PROJECT RESCUE OS\u2122', version: '1.0.0', owner: 'Kyzel Kreates', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  projects: [], prompts: [], errors: [], repairPlans: [], tags: [], activityLog: [],
  settings: { theme: 'dark', accent: '#00f5ff', compactMode: false, showDemoData: false }
};
let _state = null;
const _subscribers = new Set();
export function getState() {
  if (!_state) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { try { _state = JSON.parse(raw); _state = deepMergeDefaults(DEFAULT_STATE, _state); } catch { _state = structuredClone(DEFAULT_STATE); } }
    else { _state = structuredClone(DEFAULT_STATE); }
  }
  return _state;
}
export function setState(updater) {
  const current = getState();
  _state = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  _state.app.updatedAt = new Date().toISOString();
  saveState();
  _subscribers.forEach(fn => fn(_state));
}
export function saveState() { if (_state) localStorage.setItem(STORAGE_KEY, JSON.stringify(_state)); }
export function resetState() {
  _state = structuredClone(DEFAULT_STATE);
  _state.app.createdAt = _state.app.updatedAt = new Date().toISOString();
  localStorage.removeItem(STORAGE_KEY); saveState();
  _subscribers.forEach(fn => fn(_state));
}
export function exportState() { return JSON.stringify(getState(), null, 2); }
export function importState(jsonString) {
  const parsed = JSON.parse(jsonString);
  _state = deepMergeDefaults(DEFAULT_STATE, parsed);
  _state.app.updatedAt = new Date().toISOString(); saveState();
  _subscribers.forEach(fn => fn(_state));
}
export function subscribe(fn) { _subscribers.add(fn); return () => _subscribers.delete(fn); }
export function generateId() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9); }
export function createTimestamp() { return new Date().toISOString(); }
export function updateTimestamp() { return new Date().toISOString(); }
export function seedDemoData(sampleData) {
  setState(s => ({
    ...s,
    projects: sampleData.projects || s.projects, prompts: sampleData.prompts || s.prompts,
    errors: sampleData.errors || s.errors, repairPlans: sampleData.repairPlans || s.repairPlans,
    activityLog: [{ id: generateId(), action: 'DEMO_DATA_LOADED', label: 'Demo data loaded', timestamp: createTimestamp() }, ...s.activityLog],
    settings: { ...s.settings, showDemoData: true }
  }));
}
function deepMergeDefaults(defaults, target) {
  const result = { ...defaults };
  for (const key of Object.keys(target)) {
    if (key in defaults && typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key]) &&
        typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
      result[key] = deepMergeDefaults(defaults[key], target[key]);
    } else { result[key] = target[key]; }
  }
  return result;
}
