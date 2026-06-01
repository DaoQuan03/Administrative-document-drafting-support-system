/* ===== KNOWLEDGE-BASE.JS (DYNAMIC CSDL INTEGRATION) ===== */

let activeKBId = null;
let allKBs = [];
let kbDocuments = [];
let selectedFiles = [];

// Khởi chạy khi tải trang
document.addEventListener("DOMContentLoaded", () => {
  loadKBs();
  setupDragAndDrop();
});

// 1. Tải danh sách Kho Tri Thức của người dùng từ CSDL
async function loadKBs(selectKBId = null) {
  try {
    const res = await fetch("/api/kb/");
    const data = await res.json();
    
    if (data.success) {
      allKBs = data.knowledge_bases;
      renderKBCards();
      
      if (allKBs.length === 0) {
        document.getElementById("kb-empty-state").style.display = "flex";
        document.getElementById("doc-section-container").style.display = "none";
        activeKBId = null;
      } else {
        document.getElementById("kb-empty-state").style.display = "none";
        document.getElementById("doc-section-container").style.display = "block";
        
        // Chọn kho mặc định: ưu tiên kho được chỉ định, hoặc giữ kho cũ, hoặc kho đầu tiên
        if (selectKBId && allKBs.some(kb => kb.id === selectKBId)) {
          activeKBId = selectKBId;
        } else if (!activeKBId || !allKBs.some(kb => kb.id === activeKBId)) {
          activeKBId = allKBs[0].id;
        }
        
        highlightActiveCard();
        loadDocuments(activeKBId);
      }
    } else {
      console.error("Lỗi lấy danh sách kho:", data.error);
    }
  } catch (err) {
    console.error("Lỗi mạng:", err);
  }
}

// Render các thẻ Kho Tri Thức ra HTML
function renderKBCards() {
  const container = document.getElementById("kb-cards-container");
  
  // Xóa các card cũ trừ card "+ Tạo kho tri thức mới"
  const addCard = container.querySelector(".kb-add-card");
  container.innerHTML = "";
  
  allKBs.forEach(kb => {
    const card = document.createElement("div");
    card.className = `kb-card ${kb.id === activeKBId ? "active-kb" : ""}`;
    card.setAttribute("data-id", kb.id);
    card.onclick = () => openKB(kb.id);
    
    // Tạo cấu trúc card tri thức glassmorphism premium
    card.innerHTML = `
      <div class="kb-card-icon">📋</div>
      <div class="kb-card-info">
        <div class="kb-card-name">${escapeHTML(kb.name)}</div>
        <div class="kb-card-meta">${kb.doc_count} tài liệu · ${kb.size}</div>
      </div>
      <div class="kb-card-right">
        <span class="badge badge-green">Hoạt động</span>
        <div class="kb-card-bar"><div style="width: 100%"></div></div>
      </div>
    `;
    container.appendChild(card);
  });
  
  // Append lại nút thêm
  container.appendChild(addCard);
}

// Làm nổi bật card đang chọn
function highlightActiveCard() {
  document.querySelectorAll(".kb-card").forEach(card => {
    const id = parseInt(card.getAttribute("data-id"));
    if (id === activeKBId) {
      card.classList.add("active-kb");
    } else {
      card.classList.remove("active-kb");
    }
  });
}

// 2. Chuyển đổi kho tri thức đang chọn
function openKB(id) {
  activeKBId = id;
  highlightActiveCard();
  loadDocuments(id);
}

// 3. Tải danh sách tài liệu của Kho Tri Thức hiện tại
async function loadDocuments(kbId) {
  const tbody = document.getElementById("docs-tbody");
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-tertiary);">⏳ Đang tải tài liệu...</td></tr>`;
  
  // Cập nhật tiêu đề Kho đang chọn
  const activeKB = allKBs.find(kb => kb.id === kbId);
  if (activeKB) {
    document.getElementById("active-kb-title").textContent = activeKB.name;
    document.getElementById("active-kb-count").textContent = `${activeKB.doc_count} tài liệu`;
  }
  
  try {
    const res = await fetch(`/api/kb/${kbId}/documents/`);
    const data = await res.json();
    
    if (data.success) {
      kbDocuments = data.documents;
      renderDocumentsTable(kbDocuments);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--red-400);">❌ Lỗi: ${escapeHTML(data.error)}</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--red-400);">❌ Lỗi kết nối máy chủ.</td></tr>`;
  }
}

// Render dữ liệu bảng tài liệu
function renderDocumentsTable(docs) {
  const tbody = document.getElementById("docs-tbody");
  tbody.innerHTML = "";
  
  if (docs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-tertiary);">📂 Kho này chưa có tài liệu. Bấm <strong>Upload</strong> hoặc lưu từ <strong>Trình soạn thảo</strong> để thêm tài liệu.</td></tr>`;
    return;
  }
  
  docs.forEach(doc => {
    const tr = document.createElement("tr");
    
    // Xác định badge type màu sắc
    let typeBadgeClass = "badge-gray";
    if (doc.file_type === "PDF") typeBadgeClass = "badge-blue";
    else if (doc.file_type === "DOCX" || doc.file_type === "DOC") typeBadgeClass = "badge-indigo";
    else if (doc.file_type === "XLSX" || doc.file_type === "XLS") typeBadgeClass = "badge-green";
    else if (doc.file_type === "HTML") typeBadgeClass = "badge-amber";
    
    // Trạng thái index màu sắc
    let statusBadgeClass = "badge-amber";
    if (doc.status_raw === "active") statusBadgeClass = "badge-green";
    else if (doc.status_raw === "error") statusBadgeClass = "badge-red";
    
    // Icon đại diện
    let fileIcon = "📄";
    if (doc.file_type === "XLSX" || doc.file_type === "XLS") fileIcon = "📊";
    else if (doc.file_type === "HTML") fileIcon = "🌐";
    
    tr.innerHTML = `
      <td><input type="checkbox" class="doc-check" value="${doc.id}"/></td>
      <td class="doc-name-cell"><span class="doc-file-icon">${fileIcon}</span>${escapeHTML(doc.title)}</td>
      <td><span class="badge ${typeBadgeClass}">${doc.file_type}</span></td>
      <td>${doc.file_size}</td>
      <td><span class="badge ${statusBadgeClass}">${doc.status}</span></td>
      <td>${doc.created_at}</td>
      <td class="doc-actions">
        <button class="btn btn-ghost btn-sm" onclick="previewDoc(${doc.id})">Xem</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--red-400)" onclick="deleteDoc(${doc.id})">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 4. Client-side filters
function filterDocs(query) {
  const rows = document.querySelectorAll("#docs-tbody tr");
  rows.forEach(row => {
    const nameCell = row.querySelector(".doc-name-cell");
    if (!nameCell) return;
    const name = nameCell.textContent.toLowerCase();
    row.style.display = name.includes(query.toLowerCase()) ? "" : "none";
  });
}

function filterDocType(type) {
  if (type === "All") {
    renderDocumentsTable(kbDocuments);
    return;
  }
  const filtered = kbDocuments.filter(doc => doc.file_type === type);
  renderDocumentsTable(filtered);
}

// 5. Thao tác Modal Tạo Kho Tri Thức Mới
function showCreateKBModal() {
  document.getElementById("create-kb-modal").style.display = "flex";
  document.getElementById("kb-name-input").value = "";
  document.getElementById("kb-desc-input").value = "";
  document.getElementById("kb-name-input").focus();
}

function closeCreateKBModal(e) {
  if (!e || e.target === document.getElementById("create-kb-modal") || e.target.tagName === "BUTTON") {
    document.getElementById("create-kb-modal").style.display = "none";
  }
}

async function submitCreateKB() {
  const name = document.getElementById("kb-name-input").value.trim();
  const description = document.getElementById("kb-desc-input").value.trim();
  
  if (!name) {
    alert("Vui lòng điền tên kho tri thức.");
    return;
  }
  
  try {
    const res = await fetch("/api/kb/create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description })
    });
    const data = await res.json();
    
    if (data.success) {
      closeCreateKBModal();
      loadKBs(data.kb.id); // Tải lại và chọn đúng kho vừa tạo
    } else {
      alert("Lỗi: " + data.error);
    }
  } catch (err) {
    alert("Lỗi kết nối máy chủ khi tạo kho.");
  }
}

// 6. Xóa Kho Tri Thức
async function deleteActiveKB() {
  if (!activeKBId) return;
  const activeKB = allKBs.find(kb => kb.id === activeKBId);
  if (!activeKB) return;
  
  if (confirm(`⚠️ CẢNH BÁO CỰC KỲ QUAN TRỌNG:\nHành động này sẽ xóa vĩnh viễn kho tri thức "${activeKB.name}".\nToàn bộ tài liệu bên trong và các vector nhúng AI trong ChromaDB sẽ bị xóa sạch.\nCậu có chắc chắn muốn tiếp tục không?`)) {
    try {
      const res = await fetch(`/api/kb/${activeKBId}/`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        activeKBId = null;
        loadKBs();
      } else {
        alert("Lỗi khi xóa kho: " + data.error);
      }
    } catch (err) {
      alert("Lỗi kết nối khi xóa kho.");
    }
  }
}

// 7. Thao tác Tài liệu (Xem và Xóa)
async function previewDoc(docId) {
  // Điều hướng và hiển thị văn bản ở trang soạn thảo theo yêu cầu của cậu
  window.location.href = `editor.html?kb_doc_id=${docId}`;
}

function closePreview() {
  document.getElementById("preview-panel").style.display = "none";
}

async function deleteDoc(docId) {
  if (confirm("Cậu có chắc chắn muốn xóa vĩnh viễn tài liệu này khỏi CSDL và loại bỏ hoàn toàn các vector nhúng AI trong ChromaDB?")) {
    try {
      const res = await fetch(`/api/kb/document/${docId}/`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        loadKBs(activeKBId); // Tải lại kho hiện tại để cập nhật số lượng và danh sách file
      } else {
        alert("Lỗi khi xóa tài liệu: " + data.error);
      }
    } catch (err) {
      alert("Lỗi kết nối khi xóa tài liệu.");
    }
  }
}

// 8. Thao tác Upload tài liệu mới
function showUploadModal() {
  if (!activeKBId) {
    alert("Vui lòng chọn hoặc tạo một Kho Tri Thức trước khi tải file.");
    return;
  }
  document.getElementById("upload-modal").style.display = "flex";
  selectedFiles = [];
  document.getElementById("file-list").innerHTML = "";
}

function closeUploadModal(e) {
  if (!e || e.target === document.getElementById("upload-modal") || e.target.tagName === "BUTTON") {
    document.getElementById("upload-modal").style.display = "none";
    document.getElementById("file-list").innerHTML = "";
    selectedFiles = [];
  }
}

function switchUploadTab(el, tab) {
  document.querySelectorAll(".upload-tab").forEach(t => t.classList.remove("active"));
  el.classList.add("active");
  ["file", "url", "drive"].forEach(id => {
    const container = document.getElementById("upload-" + id);
    if (container) container.style.display = id === tab ? "block" : "none";
  });
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  addSelectedFiles(files);
}

function addSelectedFiles(files) {
  selectedFiles = selectedFiles.concat(files);
  renderFileList();
}

function renderFileList() {
  const list = document.getElementById("file-list");
  list.innerHTML = "";
  selectedFiles.forEach((f, idx) => {
    const div = document.createElement("div");
    div.className = "file-item";
    div.innerHTML = `
      <span>📄</span>
      <span class="file-name" style="word-break: break-all;">${escapeHTML(f.name)}</span>
      <span class="file-size">${(f.size / 1024).toFixed(0)} KB</span>
      <button class="btn btn-ghost btn-icon" style="color:var(--red-400);margin-left:auto;" onclick="removeSelectedFile(${idx})">✕</button>
    `;
    list.appendChild(div);
  });
}

function removeSelectedFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
}

// Cấu hình kéo thả file DropZone
function setupDragAndDrop() {
  const dz = document.getElementById("drop-zone");
  if (!dz) return;
  
  dz.addEventListener("dragover", e => {
    e.preventDefault();
    dz.classList.add("drag-over");
  });
  
  dz.addEventListener("dragleave", () => {
    dz.classList.remove("drag-over");
  });
  
  dz.addEventListener("drop", e => {
    e.preventDefault();
    dz.classList.remove("drag-over");
    addSelectedFiles(Array.from(e.dataTransfer.files));
  });
}

// Gửi file thật lên API Upload & Index
async function startUpload() {
  if (selectedFiles.length === 0) {
    alert("Vui lòng chọn ít nhất một file để tải lên.");
    return;
  }
  
  // Hiển thị thanh tiến trình giả lập nhúng mượt mà dạng Glassmorphism
  const listItems = document.querySelectorAll(".file-item");
  listItems.forEach((item, i) => {
    // Xóa nút xóa
    const removeBtn = item.querySelector("button");
    if (removeBtn) removeBtn.remove();
    
    const bar = document.createElement("div");
    bar.className = "file-progress";
    bar.style.width = "100%";
    bar.style.height = "6px";
    bar.style.background = "rgba(255,255,255,0.05)";
    bar.style.borderRadius = "3px";
    bar.style.marginTop = "8px";
    bar.style.overflow = "hidden";
    bar.innerHTML = '<div class="file-progress-fill" style="width:10%; height:100%; background:linear-gradient(90deg, #3b82f6, #10b981); transition: width 0.3s ease;"></div>';
    item.appendChild(bar);
  });
  
  const formData = new FormData();
  selectedFiles.forEach(f => {
    formData.append("files", f);
  });
  
  // Tạo tiến trình tăng dần thanh bar
  const fills = document.querySelectorAll(".file-progress-fill");
  let progress = 10;
  const progressInterval = setInterval(() => {
    progress = Math.min(85, progress + Math.random() * 8);
    fills.forEach(fill => {
      fill.style.width = progress + "%";
    });
  }, 250);
  
  try {
    const res = await fetch(`/api/kb/${activeKBId}/upload/`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    
    clearInterval(progressInterval);
    
    if (data.success) {
      fills.forEach(fill => {
        fill.style.width = "100%";
      });
      setTimeout(() => {
        closeUploadModal();
        alert(`Tải lên và index thành công ${data.uploaded_documents.length} tài liệu!`);
        loadKBs(activeKBId); // Tải lại
      }, 400);
    } else {
      alert("Lỗi khi upload: " + data.error);
      loadKBs(activeKBId);
    }
  } catch (err) {
    clearInterval(progressInterval);
    alert("Lỗi kết nối khi tải file lên máy chủ.");
    loadKBs(activeKBId);
  }
}

// Helpers phòng chống XSS tấn công bảo mật
function escapeHTML(str) {
  if (!str) return "";
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

function toggleSelectAll(cb) {
  document.querySelectorAll(".doc-check").forEach(check => {
    check.checked = cb.checked;
  });
}


