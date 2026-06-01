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

// ─── OAuth login redirection ───
function loginOAuth(provider) {
  const btn = document.getElementById(`btn-${provider}`);
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.innerHTML = `<span style="font-size:12px">Đang chuyển hướng...</span>`;

  if (provider === 'google') {
    window.location.href = '/accounts/google/login/';
  } else if (provider === 'microsoft') {
    window.location.href = '/accounts/microsoft/login/';
  }
}

// Helper to get CSRF token
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
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
  errorEl.style.display = 'none';

  // basic validation
  if (!email || !password) {
    showError('Vui lòng nhập đầy đủ email/username và mật khẩu.');
    return;
  }

  // loading state
  btnText.textContent = 'Đang đăng nhập...';
  spinner.style.display = 'inline-block';
  spinner.hidden = false;
  submitBtn.disabled = true;

  // Call Django Login API
  fetch('/api/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify({ email: email, password: password })
  })
  .then(response => {
    return response.json().then(data => {
      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công.');
      }
      return data;
    });
  })
  .then(data => {
    spinner.style.display = 'none';
    spinner.hidden = true;
    submitBtn.disabled = false;
    btnText.textContent = 'Đăng nhập';

    if (data.success) {
      // successful login - redirect to dashboard.html
      window.location.href = 'dashboard.html';
    } else {
      showError(data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    }
  })
  .catch(error => {
    spinner.style.display = 'none';
    spinner.hidden = true;
    submitBtn.disabled = false;
    btnText.textContent = 'Đăng nhập';
    showError(error.message || 'Không thể kết nối đến máy chủ.');
  });
}

function showError(msg) {
  const errorEl = document.getElementById('error-msg');
  const errorText = document.getElementById('error-text');
  errorText.textContent = msg;
  errorEl.hidden = false;
  errorEl.style.display = 'flex';
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

// Check if redirected for first-time social onboarding or has oauth errors
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('social_register') === '1') {
    document.getElementById('social-onboarding-modal').style.display = 'flex';
  }
  
  const errMsg = urlParams.get('error_message');
  if (errMsg) {
    showError(errMsg);
  }
});

function closeSocialModal() {
  document.getElementById('social-onboarding-modal').style.display = 'none';
  window.location.href = '/html/login.html';
}

function submitSocialOnboarding() {
  const username = document.getElementById('social-username').value.trim().toLowerCase();
  const role = document.querySelector('input[name="social-role"]:checked').value;
  const org = document.getElementById('social-org').value.trim();
  const title = document.getElementById('social-title').value.trim();
  const dept = document.getElementById('social-dept').value;
  const errEl = document.getElementById('social-error');
  const errTxt = document.getElementById('social-error-text');

  errEl.hidden = true;
  if (!username) {
    errTxt.textContent = 'Vui lòng nhập tên đăng nhập mong muốn.';
    errEl.hidden = false;
    return;
  }
  if (username.includes(' ')) {
    errTxt.textContent = 'Tên đăng nhập không chứa khoảng trắng.';
    errEl.hidden = false;
    return;
  }

  const payload = {
    username: username,
    role: role,
    organization: org || 'Cá nhân',
    title: title,
    department: dept
  };

  const submitBtn = document.querySelector('button[onclick="submitSocialOnboarding()"]');
  submitBtn.disabled = true;
  
  fetch('/api/oauth/register/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    return response.json().then(data => {
      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi hoàn tất thông tin.');
      }
      return data;
    });
  })
  .then(data => {
    if (data.success) {
      window.location.href = 'dashboard.html';
    } else {
      submitBtn.disabled = false;
      errTxt.textContent = data.error || 'Hoàn tất thông tin thất bại.';
      errEl.hidden = false;
    }
  })
  .catch(error => {
    submitBtn.disabled = false;
    errTxt.textContent = error.message;
    errEl.hidden = false;
  });
}

