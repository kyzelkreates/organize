export function showToast(message, type='info') {
  const root = document.getElementById('toast-root');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' };
  toast.innerHTML = `<span>${icons[type]||'ℹ'}</span><span>${message}</span>`;
  root.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(20px)'; toast.style.transition='all 0.3s ease'; setTimeout(()=>toast.remove(),300); }, 3000);
}
