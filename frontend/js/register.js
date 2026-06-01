/* ===== REGISTER.JS ===== */

let currentStep = 1;

function goStep(n) {
  document.getElementById('register-step-' + currentStep).style.display = 'none';
  currentStep = n;
  document.getElementById('register-step-' + n).style.display = 'block';
  updateStepUI();
}

function updateStepUI() {
  [1, 2, 3, 4].forEach(i => {
    const dot = document.getElementById('step-dot-' + i);
    const lbl = document.getElementById('step-lbl-' + i);
    dot.classList.remove('active', 'done');
    lbl.classList.remove('active', 'done');
    if (i < currentStep) { dot.classList.add('done'); dot.innerHTML = '<span>✓</span>'; lbl.classList.add('done'); }
    else if (i === currentStep) { dot.classList.add('active'); dot.innerHTML = '<span>' + i + '</span>'; lbl.classList.add('active'); }
    else { dot.innerHTML = '<span>' + i + '</span>'; }
  });
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

function nextStep(from) {
  if (from === 1) {
    const name = document.getElementById('reg-name').value.trim();
    const username = document.getElementById('reg-username').value.trim().toLowerCase();
    const email = document.getElementById('reg-email').value.trim();
    const pw = document.getElementById('reg-password').value;
    const confirmPw = document.getElementById('reg-confirm-password').value;
    const errEl = document.getElementById('reg-error');
    const errTxt = document.getElementById('reg-error-text');
    errEl.hidden = true;
    errEl.style.display = 'none';
    
    if (!name) { errTxt.textContent = 'Vui lòng nhập họ và tên.'; errEl.hidden = false; errEl.style.display = 'flex'; return; }
    if (!username) { errTxt.textContent = 'Vui lòng nhập tên đăng nhập.'; errEl.hidden = false; errEl.style.display = 'flex'; return; }
    if (username.includes(' ')) { errTxt.textContent = 'Tên đăng nhập không được chứa khoảng trắng.'; errEl.hidden = false; errEl.style.display = 'flex'; return; }
    if (!email || !email.includes('@')) { errTxt.textContent = 'Vui lòng nhập email hợp lệ.'; errEl.hidden = false; errEl.style.display = 'flex'; return; }
    if (pw.length < 8) { errTxt.textContent = 'Mật khẩu tối thiểu 8 ký tự.'; errEl.hidden = false; errEl.style.display = 'flex'; return; }
    if (pw !== confirmPw) { errTxt.textContent = 'Mật khẩu xác nhận không khớp.'; errEl.hidden = false; errEl.style.display = 'flex'; return; }
    goStep(2);
  } else if (from === 2) {
    buildConfirmSummary();
    goStep(3);
  }
}

function buildConfirmSummary() {
  const roleVal = document.querySelector('input[name="reg-role"]:checked').value;
  const roleText = roleVal === 'LEADER' ? 'Leader / Trưởng nhóm' : 'Người dùng thường';
  
  const data = {
    'Họ tên': document.getElementById('reg-name').value,
    'Tên đăng nhập': document.getElementById('reg-username').value,
    'Email': document.getElementById('reg-email').value,
    'Vai trò': roleText,
    'Tổ chức': document.getElementById('reg-org').value || 'Cá nhân',
    'Chức danh': document.getElementById('reg-title').value || '—',
    'Phòng ban': document.getElementById('reg-dept').value || '—',
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

function toggleRegConfirmPw() {
  const pw = document.getElementById('reg-confirm-password');
  pw.type = pw.type === 'password' ? 'text' : 'password';
}

function submitRegister() {
  const confirmErr = document.getElementById('confirm-error');
  if (!document.getElementById('agree-terms').checked) {
    confirmErr.hidden = false;
    confirmErr.style.display = 'flex';
    return;
  }
  confirmErr.hidden = true;
  confirmErr.style.display = 'none';
  
  const submitBtn = document.querySelector('button[onclick="submitRegister()"]');
  const btnText = document.getElementById('reg-submit-text');
  
  btnText.textContent = 'Đang gửi mã OTP...';
  submitBtn.disabled = true;

  const payload = {
    full_name: document.getElementById('reg-name').value.trim(),
    username: document.getElementById('reg-username').value.trim().toLowerCase(),
    email: document.getElementById('reg-email').value.trim(),
    password: document.getElementById('reg-password').value,
    role: document.querySelector('input[name="reg-role"]:checked').value,
    organization: document.getElementById('reg-org').value.trim() || 'Cá nhân',
    title: document.getElementById('reg-title').value.trim(),
    department: document.getElementById('reg-dept').value
  };

  fetch('/api/register/send-code/', {
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
        throw new Error(data.error || 'Có lỗi xảy ra khi đăng ký.');
      }
      return data;
    });
  })
  .then(data => {
    btnText.textContent = 'Tạo tài khoản';
    submitBtn.disabled = false;
    if (data.success) {
      if (data.otp_local_dev) {
        document.getElementById('reg-otp').value = data.otp_local_dev;
        alert(`[Thử nghiệm Local]\nMã OTP đăng ký của bạn là: ${data.otp_local_dev}\n(Đã được tự động điền vào ô xác thực)`);
      } else if (data.message && data.message.includes('Terminal')) {
        alert(data.message);
      }
      goStep(4);
    } else {
      alert(data.error || 'Gửi mã OTP thất bại.');
    }
  })
  .catch(error => {
    btnText.textContent = 'Tạo tài khoản';
    submitBtn.disabled = false;
    const confirmErr = document.getElementById('confirm-error');
    confirmErr.querySelector('span').textContent = error.message;
    confirmErr.hidden = false;
    confirmErr.style.display = 'flex';
  });
}

function verifyRegisterOTP() {
  const otpVal = document.getElementById('reg-otp').value.trim();
  const errEl = document.getElementById('otp-error');
  const errTxt = document.getElementById('otp-error-text');
  const submitBtn = document.querySelector('button[onclick="verifyRegisterOTP()"]');
  const btnText = document.getElementById('otp-submit-text');
  
  errEl.hidden = true;
  errEl.style.display = 'none';
  if (!otpVal || otpVal.length !== 6) {
    errTxt.textContent = 'Vui lòng nhập đủ 6 chữ số mã OTP.';
    errEl.hidden = false;
    errEl.style.display = 'flex';
    return;
  }
  
  btnText.textContent = 'Đang xác minh...';
  submitBtn.disabled = true;
  
  fetch('/api/register/verify/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify({ otp: otpVal })
  })
  .then(response => {
    return response.json().then(data => {
      if (!response.ok) {
        throw new Error(data.error || 'Mã xác minh không chính xác.');
      }
      return data;
    });
  })
  .then(data => {
    if (data.success) {
      alert(data.message || 'Đăng ký tài khoản thành công! Vui lòng đăng nhập để tiếp tục.');
      window.location.href = 'login.html';
    } else {
      btnText.textContent = 'Xác minh & Hoàn tất';
      submitBtn.disabled = false;
      errTxt.textContent = data.error || 'Xác minh thất bại.';
      errEl.hidden = false;
      errEl.style.display = 'flex';
    }
  })
  .catch(error => {
    btnText.textContent = 'Xác minh & Hoàn tất';
    submitBtn.disabled = false;
    errTxt.textContent = error.message;
    errEl.hidden = false;
    errEl.style.display = 'flex';
  });
}

