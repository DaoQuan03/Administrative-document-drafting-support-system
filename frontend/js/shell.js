/* ===== SHELL.JS — shared across all inner pages ===== */

function nav(page) {
  window.location.href = page;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('collapsed');
}

// Ctrl+K → search
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    nav('search.html');
  }
});
