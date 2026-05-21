/* ===== SETTINGS.JS ===== */

function switchSection(btn, id) {
  // nav active
  document.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // show section
  document.querySelectorAll('.settings-section').forEach(s => s.style.display = 'none');
  const target = document.getElementById('sec-' + id);
  if (target) { target.style.display = 'block'; target.classList.add('fade-in'); }
}

function saveSettings() {
  const btn = document.querySelector('.topbar-right .btn-primary');
  btn.textContent = '✓ Đã lưu';
  btn.disabled = true;
  setTimeout(() => { btn.textContent = 'Lưu thay đổi'; btn.disabled = false; }, 2000);
}

function toggle2FA(cb) {
  if (cb.checked) {
    alert('Bước tiếp theo: Quét mã QR bằng Google Authenticator hoặc Authy để kích hoạt 2FA.');
  }
}

function revokeSession(btn) {
  if (confirm('Thu hồi phiên đăng nhập này?')) {
    btn.closest('.session-item').remove();
  }
}

function removeMember(btn) {
  if (confirm('Xóa thành viên này khỏi không gian làm việc?')) {
    btn.closest('.member-row').remove();
  }
}

function selectModel(card) {
  document.querySelectorAll('.model-card').forEach(c => {
    c.classList.remove('selected');
    const badge = c.querySelector('.model-badge');
    if (badge) { badge.className = 'model-badge badge badge-gray'; badge.textContent = ''; }
  });
  card.classList.add('selected');
  const badge = card.querySelector('.model-badge');
  if (badge) { badge.className = 'model-badge badge badge-blue'; badge.textContent = 'Đang dùng'; }
}
