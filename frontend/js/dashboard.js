/* ===== DASHBOARD.JS ===== */

// Animate usage bars on load
window.addEventListener('load', () => {
  const fills = document.querySelectorAll('.usage-fill');
  fills.forEach(el => {
    const target = el.style.width;
    el.style.width = '0%';
    setTimeout(() => { el.style.width = target; }, 100);
  });
});
