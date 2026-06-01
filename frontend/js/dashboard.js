/* ===== DASHBOARD.JS ===== */

// Helper to escape HTML tags to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Fetch and render actual documents from DB
async function loadDashboardData() {
  const docListContainer = document.getElementById('dashboard-doc-list');
  const countEl = document.getElementById('my-docs-count');
  
  if (!docListContainer) return;
  
  try {
    const response = await fetch('/api/documents/');
    const data = await response.json();
    
    if (data.success) {
      const docs = data.documents;
      
      // 1. Update statistics count
      if (countEl) {
        // Animate count-up from 0 to actual value
        animateCount(countEl, 0, docs.length, 600);
      }
      
      // 2. Render document list
      if (docs.length === 0) {
        docListContainer.innerHTML = `
          <div style="padding: 32px 16px; text-align: center; color: var(--text-tertiary); font-size: 13px;">
            <div style="font-size: 24px; margin-bottom: 8px;">📁</div>
            <p>Bạn chưa có bản nháp hoặc tài liệu nào.</p>
            <button class="btn btn-ghost btn-sm" onclick="nav('editor.html')" style="margin-top: 8px; color: var(--brand-color);">
              + Tạo tài liệu ngay
            </button>
          </div>
        `;
        return;
      }
      
      let html = '';
      docs.forEach(doc => {
        const badgeClass = doc.status === 'DONE' ? 'badge-green' : 'badge-gray';
        const badgeLabel = doc.status === 'DONE' ? 'Hoàn thành' : 'Chưa hoàn thành';
        
        html += `
          <div class="doc-item" onclick="nav('editor.html?id=${doc.id}')" style="position: relative; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
              <div class="doc-item-icon">📄</div>
              <div class="doc-item-info" style="min-width: 0;">
                <div class="doc-item-name" style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-weight: 500;">
                  ${escapeHTML(doc.title)}
                </div>
                <div class="doc-item-meta">Chỉnh sửa ${doc.updated_at}</div>
              </div>
            </div>
            <div class="doc-item-badges" style="display: flex; align-items: center; gap: 8px; z-index: 2;">
              <span class="badge ${badgeClass}">${badgeLabel}</span>
              <button class="btn btn-ghost btn-icon btn-sm delete-btn" 
                      style="color: var(--red-400); padding: 4px; border: none; background: transparent; cursor: pointer; min-height: 0; min-width: 0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center;"
                      title="Xóa tài liệu"
                      onclick="handleDeleteDoc(event, ${doc.id})">
                ✕
              </button>
            </div>
          </div>
        `;
      });
      docListContainer.innerHTML = html;
      
    } else {
      docListContainer.innerHTML = `<p style="padding:16px;color:var(--red-400);font-size:13px">Lỗi: ${escapeHTML(data.error)}</p>`;
    }
  } catch (err) {
    docListContainer.innerHTML = `<p style="padding:16px;color:var(--red-400);font-size:13px">Không thể kết nối đến máy chủ.</p>`;
    console.error(err);
  }
}

// Function to delete document with stopPropagation
async function handleDeleteDoc(event, id) {
  event.stopPropagation(); // Prevent trigger nav('editor.html') from parent item
  
  if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu này khỏi kho lưu trữ cá nhân?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/documents/${id}/delete/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      }
    });
    const data = await response.json();
    
    if (data.success) {
      // Reload dashboard list
      loadDashboardData();
    } else {
      alert('Không thể xóa tài liệu: ' + data.error);
    }
  } catch (err) {
    alert('Lỗi kết nối đến máy chủ khi thực hiện xóa.');
    console.error(err);
  }
}

// Simple CSRF cookie reader
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

// Count animation helper
function animateCount(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    element.textContent = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Animate usage bars on load & Load real data
window.addEventListener('load', () => {
  // Usage bar animations
  const fills = document.querySelectorAll('.usage-fill');
  fills.forEach(el => {
    const target = el.style.width;
    el.style.width = '0%';
    setTimeout(() => { el.style.width = target; }, 100);
  });
  
  // Load documents
  loadDashboardData();
});
