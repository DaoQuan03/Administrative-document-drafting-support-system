/* ===== LOGIN.JS ===== */

// ─── OTP auto-advance ───
document.querySelectorAll('.otp-input').forEach((input, i, arr) => {
  input.addEventListener('input', () => {
    if (input.value.length === 1 && arr[i + 1]) arr[i + 1].focus();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && input.value === '' && arr[i - 1]) arr[i - 1].focus();
  });
});

// ─── Toggle password visibility ───
function togglePassword() {
  const pw = document.getElementById('password');
  const icon = document.getElementById('eye-icon');
  if (pw.type === 'password') {
    pw.type = 'text';
    icon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    pw.type = 'password';
    icon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>`;
  }
}

// ─── OAuth login simulation ───
function loginOAuth(provider) {
  const btn = document.getElementById(`btn-${provider}`);
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.innerHTML = `<span style="font-size:12px">Đang chuyển hướng...</span>`;

  setTimeout(() => {
    // In production: redirect to OAuth provider
    window.location.href = 'dashboard.html';
  }, 1500);
}

// ─── Email/password login ───
function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('error-msg');
  const errorText = document.getElementById('error-text');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('btn-spinner');

  // hide previous error
  errorEl.hidden = true;

  // basic validation
  if (!email || !password) {
    showError('Vui lòng nhập đầy đủ email và mật khẩu.');
    return;
  }

  // loading state
  btnText.textContent = 'Đang đăng nhập...';
  spinner.hidden = false;
  submitBtn.disabled = true;

  // simulate API call
  setTimeout(() => {
    spinner.hidden = true;
    submitBtn.disabled = false;
    btnText.textContent = 'Đăng nhập';

    // Demo: admin@demo.vn / 123456 → 2FA
    //       any other → redirect
    if (email === 'admin@demo.vn' && password === '123456') {
      show2FA();
    } else if (email.includes('@') && password.length >= 6) {
      // success
      window.location.href = 'dashboard.html';
    } else {
      showError('Email hoặc mật khẩu không chính xác.');
    }
  }, 1200);
}

function showError(msg) {
  const errorEl = document.getElementById('error-msg');
  const errorText = document.getElementById('error-text');
  errorText.textContent = msg;
  errorEl.hidden = false;
  errorEl.classList.add('fade-in');
}

// ─── 2FA flow ───
function show2FA() {
  document.getElementById('login-form').hidden = true;
  document.querySelector('.oauth-row').hidden = true;
  document.querySelector('.divider-text').hidden = true;
  document.querySelector('.signup-hint').hidden = true;
  document.getElementById('twofa-section').hidden = false;
  document.querySelector('.form-header h1').textContent = 'Xác thực 2 yếu tố';
  document.querySelector('.form-header p').textContent = 'Nhập mã 6 chữ số từ ứng dụng Google Authenticator.';
  document.querySelectorAll('.otp-input')[0].focus();
}

function verify2FA() {
  const otp = Array.from(document.querySelectorAll('.otp-input'))
    .map(i => i.value).join('');
  if (otp.length < 6) {
    alert('Vui lòng nhập đủ 6 chữ số.');
    return;
  }
  // simulate verify
  window.location.href = 'dashboard.html';
}

let resendTimer = 0;
function resendOTP() {
  const now = Date.now();
  if (now - resendTimer < 60000) {
    alert('Vui lòng đợi 60 giây trước khi gửi lại.');
    return;
  }
  resendTimer = now;
  alert('Mã OTP đã được gửi lại qua SMS.');
}
