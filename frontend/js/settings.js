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
  
  const fullNameInput = document.getElementById('profile-full-name');
  const titleInput = document.getElementById('profile-title');
  const orgInput = document.getElementById('profile-organization');
  const deptInput = document.getElementById('profile-department');
  const phoneInput = document.getElementById('profile-phone');
  const birthDateInput = document.getElementById('profile-birth-date');
  const confirmPasswordInput = document.getElementById('profile-confirm-password');
  
  if (!fullNameInput) return; // Not on profile tab / input not rendered
  
  const fullName = fullNameInput.value.trim();
  const title = titleInput.value.trim();
  const organization = orgInput.value.trim();
  const department = deptInput.value.trim();
  const phone_number = phoneInput ? phoneInput.value.trim() : '';
  const birth_date = birthDateInput ? birthDateInput.value.trim() : '';
  const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
  
  if (!fullName) {
    alert('Họ và tên không được để trống.');
    return;
  }
  
  if (!confirmPassword) {
    alert('Vui lòng nhập mật khẩu xác nhận để áp dụng thay đổi thông tin cá nhân.');
    if (confirmPasswordInput) confirmPasswordInput.focus();
    return;
  }
  
  btn.textContent = 'Đang lưu...';
  btn.disabled = true;
  
  fetch('/api/profile/update/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify({
      full_name: fullName,
      title: title,
      organization: organization,
      department: department,
      phone_number: phone_number,
      birth_date: birth_date,
      confirm_password: confirmPassword
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      btn.textContent = '✓ Đã lưu';
      
      // Clear password field
      if (confirmPasswordInput) confirmPasswordInput.value = '';
      
      // Update UI elements dynamically
      const sidebarName = document.querySelector('.sidebar .user-name');
      if (sidebarName) sidebarName.textContent = data.user.full_name;
      
      const initials = data.user.full_name.substring(0, 2).toUpperCase();
      
      const sidebarAvatar = document.querySelector('.sidebar-footer .avatar');
      if (sidebarAvatar) {
        if (data.user.avatar) {
          sidebarAvatar.innerHTML = `<img src="${data.user.avatar}" style="width:100%;height:100%;object-fit:cover;" />`;
        } else {
          sidebarAvatar.textContent = initials;
        }
      }
      
      const topbarAvatar = document.querySelector('.topbar-right .avatar');
      if (topbarAvatar) {
        if (data.user.avatar) {
          topbarAvatar.innerHTML = `<img src="${data.user.avatar}" style="width:100%;height:100%;object-fit:cover;" />`;
        } else {
          topbarAvatar.textContent = initials;
        }
      }
      
      const workspaceName = document.querySelector('.workspace-name');
      if (workspaceName) workspaceName.textContent = data.user.organization;
      
      const breadcrumbWorkspace = document.querySelector('.breadcrumb span:first-child');
      if (breadcrumbWorkspace) breadcrumbWorkspace.textContent = data.user.organization;
      
      setTimeout(() => { btn.textContent = 'Lưu thay đổi'; btn.disabled = false; }, 2000);
    } else {
      alert(data.error || 'Có lỗi xảy ra khi lưu cài đặt.');
      btn.textContent = 'Lưu thay đổi';
      btn.disabled = false;
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Không thể kết nối đến máy chủ.');
    btn.textContent = 'Lưu thay đổi';
    btn.disabled = false;
  });
}

function uploadAvatar() {
  const fileInput = document.getElementById('avatar-file-input');
  if (!fileInput || fileInput.files.length === 0) return;
  
  const file = fileInput.files[0];
  
  // Client-side validation: max 2MB
  if (file.size > 2 * 1024 * 1024) {
    alert('Kích thước ảnh đại diện tối đa là 2MB.');
    fileInput.value = '';
    return;
  }
  
  const formData = new FormData();
  formData.append('avatar', file);
  
  // Show loading indicator in avatar display
  const avatarDisplay = document.getElementById('profile-avatar-display');
  const oldHTML = avatarDisplay.innerHTML;
  avatarDisplay.innerHTML = `<span style="font-size:11px;color:var(--text-secondary);">Uploading...</span>`;
  
  fetch('/api/profile/upload-avatar/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const imgHTML = `<img src="${data.avatar_url}" style="width:100%;height:100%;object-fit:cover;" />`;
      
      // Update displays
      avatarDisplay.innerHTML = imgHTML;
      
      const sidebarAvatar = document.querySelector('.sidebar-footer .avatar');
      if (sidebarAvatar) sidebarAvatar.innerHTML = imgHTML;
      
      const topbarAvatar = document.querySelector('.topbar-right .avatar');
      if (topbarAvatar) topbarAvatar.innerHTML = imgHTML;
      
      // Clear input value
      fileInput.value = '';
      
      alert('Đã cập nhật hình ảnh đại diện thành công!');
    } else {
      alert(data.error || 'Lỗi tải lên hình đại diện.');
      avatarDisplay.innerHTML = oldHTML;
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Không thể kết nối đến máy chủ để tải lên ảnh đại diện.');
    avatarDisplay.innerHTML = oldHTML;
  });
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
