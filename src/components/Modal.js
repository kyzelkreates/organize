export function showModal({ title, body, footer, onClose }) {
  const root = document.getElementById('modal-root');
  const id = 'modal_' + Date.now();
  root.innerHTML = `<div class="modal-overlay" id="${id}"><div class="modal" role="dialog"><div class="modal-header"><span class="modal-title">${title}</span><button class="modal-close" id="${id}_close">✕</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}</div></div>`;
  const overlay = document.getElementById(id);
  const close = () => { root.innerHTML = ''; if (onClose) onClose(); };
  document.getElementById(id+'_close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target===overlay) close(); });
  document.addEventListener('keydown', function esc(e) { if (e.key==='Escape') { close(); document.removeEventListener('keydown',esc); } });
  return { close, id };
}
export function closeModal() { document.getElementById('modal-root').innerHTML = ''; }
