/* ===== ADMIN-UPLOAD.JS ===== */

let selectedAdminFiles = [];

document.addEventListener("DOMContentLoaded", () => {
  setupDragAndDrop();
});

function handleAdminDocTypeChange(val) {
  const customInput = document.getElementById("admin-doc-type-custom");
  if (customInput) {
    customInput.style.display = val === "khác" ? "block" : "none";
  }
}

function handleAdminFileSelect(e) {
  const files = Array.from(e.target.files);
  addAdminFiles(files);
}

function addAdminFiles(files) {
  selectedAdminFiles = selectedAdminFiles.concat(files);
  renderAdminFileList();
}

function renderAdminFileList() {
  const list = document.getElementById("admin-file-list");
  if (!list) return;
  list.innerHTML = "";
  
  selectedAdminFiles.forEach((f, idx) => {
    const div = document.createElement("div");
    div.className = "file-item";
    
    const sizeStr = f.size >= 1024 * 1024 
      ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(f.size / 1024).toFixed(0)} KB`;
      
    div.innerHTML = `
      <span style="margin-right: 8px;">📄</span>
      <span class="file-name" style="color:#e2e8f0; font-size: 13.5px;">${escapeHTML(f.name)}</span>
      <span class="file-size" style="margin-left: 8px; color:var(--text-tertiary); font-size: 12.5px;">(${sizeStr})</span>
      <button class="btn btn-ghost btn-icon" style="color:var(--red-400); margin-left:auto; padding: 2px 6px;" onclick="removeSelectedAdminFile(${idx})">✕</button>
    `;
    list.appendChild(div);
  });
}

function removeSelectedAdminFile(index) {
  selectedAdminFiles.splice(index, 1);
  renderAdminFileList();
}

function setupDragAndDrop() {
  const dz = document.getElementById("admin-drop-zone");
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
    addAdminFiles(Array.from(e.dataTransfer.files));
  });
}

function closeProgressModal() {
  document.getElementById("processing-progress-modal").style.display = "none";
}

async function submitAdminSystemUpload() {
  if (document.getElementById("processing-progress-modal").style.display === "flex") {
    return;
  }
  const title = document.getElementById("admin-doc-title").value.trim();
  const selectType = document.getElementById("admin-doc-type").value;
  const customType = document.getElementById("admin-doc-type-custom").value.trim();
  
  const docType = selectType === "khác" ? customType : selectType;
  
  if (!title) {
    alert("Vui lòng nhập tiêu đề tài liệu mẫu.");
    return;
  }
  if (!docType) {
    alert("Vui lòng cung cấp loại tài liệu.");
    return;
  }
  if (selectedAdminFiles.length === 0) {
    alert("Vui lòng chọn ít nhất một file từ máy tính để nạp.");
    return;
  }
  
  // Calculate total size and verify max 100MB limit
  const totalSize = selectedAdminFiles.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > 100 * 1024 * 1024) {
    alert("Tổng dung lượng các file tải lên không được vượt quá 100MB.");
    return;
  }
  
  // Reset and Show Progress modal
  const progressModal = document.getElementById("processing-progress-modal");
  const errorContainer = document.getElementById("progress-error-container");
  const closeBtn = document.getElementById("btn-close-progress");
  
  progressModal.style.display = "flex";
  errorContainer.style.display = "none";
  closeBtn.style.display = "none";
  
  // Reset steps classes and icons
  const steps = {
    upload: document.getElementById("step-upload"),
    chunk: document.getElementById("step-chunk"),
    embed: document.getElementById("step-embed"),
    chroma: document.getElementById("step-chroma")
  };
  
  Object.values(steps).forEach(el => {
    el.className = "progress-step";
    el.querySelector(".step-icon").textContent = "⏳";
  });
  
  // Active Step 1: Uploading
  steps.upload.classList.add("active");
  steps.upload.querySelector(".step-icon").textContent = "🔄";
  
  const formData = new FormData();
  formData.append("title", title);
  formData.append("doc_type", docType);
  selectedAdminFiles.forEach(f => {
    formData.append("files", f);
  });
  
  try {
    const responsePromise = fetch("/api/admin/kb/upload/", {
      method: "POST",
      body: formData
    });
    
    const res = await responsePromise;
    const data = await res.json();
    
    if (data.success) {
      // Mark step 1 as complete
      steps.upload.className = "progress-step success";
      steps.upload.querySelector(".step-icon").textContent = "✓";
      
      // Step 2: Chunking
      steps.chunk.className = "progress-step active";
      steps.chunk.querySelector(".step-icon").textContent = "🔄";
      await new Promise(r => setTimeout(r, 1200)); // smooth visual delay
      steps.chunk.className = "progress-step success";
      steps.chunk.querySelector(".step-icon").textContent = "✓";
      
      // Step 3: Embedding
      steps.embed.className = "progress-step active";
      steps.embed.querySelector(".step-icon").textContent = "🔄";
      await new Promise(r => setTimeout(r, 1500)); // E5 local embedding simulation
      steps.embed.className = "progress-step success";
      steps.embed.querySelector(".step-icon").textContent = "✓";
      
      // Step 4: ChromaDB insertion
      steps.chroma.className = "progress-step active";
      steps.chroma.querySelector(".step-icon").textContent = "🔄";
      await new Promise(r => setTimeout(r, 1000));
      steps.chroma.className = "progress-step success";
      steps.chroma.querySelector(".step-icon").textContent = "✓";
      
      // Success complete!
      await new Promise(r => setTimeout(r, 600));
      closeProgressModal();
      
      // Clear forms
      document.getElementById("admin-doc-title").value = "";
      document.getElementById("admin-doc-type").value = "tờ trình";
      document.getElementById("admin-doc-type-custom").style.display = "none";
      document.getElementById("admin-doc-type-custom").value = "";
      document.getElementById("admin-file-list").innerHTML = "";
      selectedAdminFiles = [];
      
      alert(`Đã nạp và nhúng thành công ${data.uploaded_count} tài liệu mẫu vào CSDL hệ thống!`);
    } else {
      // Mark active step as error
      let activeStep = document.querySelector(".progress-step.active");
      if (!activeStep) activeStep = steps.upload;
      activeStep.className = "progress-step error";
      activeStep.querySelector(".step-icon").textContent = "✕";
      
      errorContainer.textContent = `Lỗi hệ thống: ${data.error}`;
      errorContainer.style.display = "block";
      closeBtn.style.display = "block";
    }
  } catch (err) {
    let activeStep = document.querySelector(".progress-step.active");
    if (!activeStep) activeStep = steps.upload;
    activeStep.className = "progress-step error";
    activeStep.querySelector(".step-icon").textContent = "✕";
    
    errorContainer.textContent = `Lỗi kết nối: Không thể gửi yêu cầu nạp tài liệu đến máy chủ.`;
    errorContainer.style.display = "block";
    closeBtn.style.display = "block";
  }
}

// HTML Escaping
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
