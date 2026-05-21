/* ===== REGISTER.JS ===== */

let currentStep = 1;

function goStep(n) {
  document.getElementById('register-step-' + currentStep).style.display = 'none';
  currentStep = n;
  document.getElementById('register-step-' + n).style.display = 'block';
  updateStepUI();
}

function updateStepUI() {
  [1, 2, 3].forEach(i => {
    const dot = document.getElementById('step-dot-' + i);
    const lbl = document.getElementById('step-lbl-' + i);
    dot.classList.remove('active', 'done');
    lbl.classList.remove('active', 'done');
    if (i < currentStep) { dot.classList.add('done'); dot.innerHTML = '<span>✓</span>'; lbl.classList.add('done'); }
    else if (i === currentStep) { dot.classList.add('active'); dot.innerHTML = '<span>' + i + '</span>'; lbl.classList.add('active'); }
    else { dot.innerHTML = '<span>' + i + '</span>'; }
  });
}

function nextStep(from) {
  if (from === 1) {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pw = document.getElementById('reg-password').value;
    const errEl = document.getElementById('reg-error');
    const errTxt = document.getElementById('reg-error-text');
    errEl.hidden = true;
    if (!name) { errTxt.textContent = 'Vui lòng nhập họ và tên.'; errEl.hidden = false; return; }
    if (!email || !email.includes('@')) { errTxt.textContent = 'Vui lòng nhập email hợp lệ.'; errEl.hidden = false; return; }
    if (pw.length < 8) { errTxt.textContent = 'Mật khẩu tối thiểu 8 ký tự.'; errEl.hidden = false; return; }
    goStep(2);
  } else if (from === 2) {
    const org = document.getElementById('reg-org').value.trim();
    if (!org) { alert('Vui lòng nhập tên tổ chức.'); return; }
    buildConfirmSummary();
    goStep(3);
  }
}

function buildConfirmSummary() {
  const data = {
    'Họ tên': document.getElementById('reg-name').value,
    'Email': document.getElementById('reg-email').value,
    'Tổ chức': document.getElementById('reg-org').value,
    'Chức danh': document.getElementById('reg-title').value || '—',
    'Phòng ban': document.getElementById('reg-dept').value || '—',
    'Gói dịch vụ': 'Dùng thử miễn phí 14 ngày',
  };
  document.getElementById('confirm-summary').innerHTML = Object.entries(data).map(([k, v]) =>
    `<div class="confirm-row"><span class="confirm-key">${k}</span><span class="confirm-val">${v}</span></div>`
  ).join('');
}

function checkPasswordStrength(pw) {
  const bar = document.getElementById('pw-bar');
  const label = document.getElementById('pw-label');
  const wrap = document.getElementById('pw-strength');
  if (!pw) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';

  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const levels = [
    { width: '20%', color: '#e05858', text: 'Rất yếu' },
    { width: '40%', color: '#d4870e', text: 'Yếu' },
    { width: '60%', color: '#e8a42f', text: 'Trung bình' },
    { width: '80%', color: '#4caf7a', text: 'Mạnh' },
    { width: '100%', color: '#2da868', text: 'Rất mạnh' },
  ];
  const lvl = levels[Math.min(score, 4)];
  bar.style.width = lvl.width;
  bar.style.background = lvl.color;
  label.textContent = lvl.text;
  label.style.color = lvl.color;
}

function toggleRegPw() {
  const pw = document.getElementById('reg-password');
  pw.type = pw.type === 'password' ? 'text' : 'password';
}

function submitRegister() {
  if (!document.getElementById('agree-terms').checked) {
    document.getElementById('confirm-error').hidden = false;
    return;
  }
  document.getElementById('confirm-error').hidden = true;
  const btn = document.getElementById('reg-submit-text');
  btn.textContent = 'Đang tạo tài khoản...';
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
}
