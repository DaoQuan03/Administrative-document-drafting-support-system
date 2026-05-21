/* ===== KNOWLEDGE-BASE.JS ===== */

function openKB(id) {
  document.querySelectorAll('.kb-card').forEach(c => c.classList.remove('active-kb'));
  event.currentTarget.classList.add('active-kb');
}

function filterDocs(query) {
  const rows = document.querySelectorAll('#docs-tbody tr');
  rows.forEach(row => {
    const name = row.querySelector('.doc-name-cell')?.textContent?.toLowerCase() || '';
    row.style.display = name.includes(query.toLowerCase()) ? '' : 'none';
  });
}

function toggleSelectAll(cb) {
  document.querySelectorAll('.doc-check').forEach(c => c.checked = cb.checked);
}

function deleteDoc(btn) {
  if (confirm('Xóa tài liệu này và toàn bộ embedding liên quan?')) {
    btn.closest('tr').remove();
  }
}

function previewDoc(btn) {
  const name = btn.closest('tr').querySelector('.doc-name-cell').textContent.trim();
  document.getElementById('preview-title').textContent = name;
  document.getElementById('preview-body').innerHTML = `
    <p><strong>${name}</strong></p>
    <p>Ngày thêm: ${new Date().toLocaleDateString('vi-VN')}</p>
    <hr style="margin:12px 0;border:none;border-top:1px solid var(--border-subtle)"/>
    <p>Tổng số chunks: <strong>48</strong> · Embedding model: text-embedding-3-large</p>
    <hr style="margin:12px 0;border:none;border-top:1px solid var(--border-subtle)"/>
    <h4 style="margin-bottom:8px;font-size:13px">Nội dung tóm tắt (AI)</h4>
    <p>Tài liệu này quy định về quy trình và chuẩn mực soạn thảo văn bản hành chính trong nội bộ cơ quan, bao gồm: định dạng, ký hiệu, thẩm quyền ký, và quy trình phê duyệt...</p>
  `;
  document.getElementById('preview-panel').style.display = 'flex';
}

function closePreview() {
  document.getElementById('preview-panel').style.display = 'none';
}

// Upload modal
function showUploadModal() {
  document.getElementById('upload-modal').style.display = 'flex';
}

function closeUploadModal(e) {
  if (!e || e.target === document.getElementById('upload-modal')) {
    document.getElementById('upload-modal').style.display = 'none';
    document.getElementById('file-list').innerHTML = '';
  }
}

function switchUploadTab(el, tab) {
  document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['file', 'url', 'drive'].forEach(id => {
    const el = document.getElementById('upload-' + id);
    if (el) el.style.display = id === tab ? 'block' : 'none';
  });
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  renderFileList(files);
}

function renderFileList(files) {
  const list = document.getElementById('file-list');
  list.innerHTML = '';
  files.forEach(f => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
      <span>📄</span>
      <span class="file-name">${f.name}</span>
      <span class="file-size">${(f.size/1024).toFixed(0)} KB</span>
    `;
    list.appendChild(div);
  });
}

// Drag & drop
const dz = document.getElementById('drop-zone');
if (dz) {
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('drag-over');
    renderFileList(Array.from(e.dataTransfer.files));
  });
}

function startUpload() {
  const list = document.getElementById('file-list');
  if (!list.children.length) {
    alert('Vui lòng chọn ít nhất một file.');
    return;
  }
  // Simulate upload progress
  Array.from(list.children).forEach((item, i) => {
    const bar = document.createElement('div');
    bar.className = 'file-progress';
    bar.innerHTML = '<div class="file-progress-fill" style="width:0%"></div>';
    item.appendChild(bar);
    const fill = bar.querySelector('.file-progress-fill');
    let w = 0;
    const t = setInterval(() => {
      w = Math.min(100, w + Math.random() * 20);
      fill.style.width = w + '%';
      if (w >= 100) {
        clearInterval(t);
        if (i === list.children.length - 1) {
          setTimeout(() => { closeUploadModal(); alert('Tải lên và index thành công!'); }, 500);
        }
      }
    }, 200 + i * 100);
  });
}

function showCreateKBModal() {
  const name = prompt('Tên kho tri thức mới:');
  if (name) alert(`Đã tạo kho "${name}". Bắt đầu thêm tài liệu để AI có thể sử dụng.`);
}
