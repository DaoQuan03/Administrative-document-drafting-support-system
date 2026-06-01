/* ===== EDITOR.JS ===== */

// Global state for document
let currentDocId = null;
let saveTimer = null;
let wordCountTimer = null;

// Read query parameter 'id' or 'kb_doc_id' on load
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const docId = urlParams.get('id');
  const kbDocId = urlParams.get('kb_doc_id');
  
  if (docId) {
    currentDocId = parseInt(docId);
    loadDocument(currentDocId);
  } else if (kbDocId) {
    loadKnowledgeDocumentInEditor(parseInt(kbDocId));
  } else {
    // New document mode - start completely blank as requested
    document.getElementById('doc-title').value = '';
    // Set default date input value to today in YYYY-MM-DD format
    document.getElementById('doc-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('editor').innerHTML = '<p><br></p>';
    updateWordCount();
  }

  // Đăng ký bộ lắng nghe sự kiện delegation cho Tooltip cải thiện ở cấp độ toàn cục
  const tooltip = document.getElementById('ai-improve-tooltip');
  if (tooltip) {
    tooltip.addEventListener('click', (ev) => {
      const target = ev.target;
      if (target.id === 'ai-btn-dismiss-action' || target.closest('#ai-btn-dismiss-action')) {
        ev.stopPropagation();
        if (typeof window.rejectHighlight === 'function') {
          window.rejectHighlight(ev);
        }
      } else if (target.id === 'ai-btn-accept-action' || target.closest('#ai-btn-accept-action')) {
        ev.stopPropagation();
        if (typeof window.acceptHighlight === 'function') {
          window.acceptHighlight(ev);
        }
      }
    });
  }
});

// Load document details from API
async function loadDocument(id) {
  const statusIndicator = document.getElementById('save-status');
  if (statusIndicator) {
    statusIndicator.textContent = 'Đang tải...';
    statusIndicator.className = 'save-status saving';
  }
  
  try {
    const response = await fetch(`/api/documents/${id}/`);
    const data = await response.json();
    
    if (data.success) {
      const doc = data.document;
      document.getElementById('doc-title').value = doc.title;
      document.getElementById('editor').innerHTML = doc.content || '<p><br></p>';
      document.getElementById('doc-status').value = doc.status;
      // Set date input value (expects YYYY-MM-DD)
      document.getElementById('doc-date').value = doc.doc_date;
      
      // Update breadcrumb
      const breadcrumbCurrent = document.querySelector('.breadcrumb .bc-current');
      if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = doc.title || 'Tài liệu không tên';
      }
      
      if (statusIndicator) {
        statusIndicator.textContent = '✓ Đã tải';
        statusIndicator.className = 'save-status';
        setTimeout(() => { statusIndicator.textContent = 'Đã lưu'; }, 1000);
      }
      
      updateWordCount();
    } else {
      if (statusIndicator) {
        statusIndicator.textContent = 'Lỗi tải tệp';
        statusIndicator.className = 'save-status error';
      }
      alert('Lỗi: ' + data.error);
    }
  } catch (err) {
    if (statusIndicator) {
      statusIndicator.textContent = 'Lỗi kết nối';
      statusIndicator.className = 'save-status error';
    }
    console.error(err);
  }
}

// Triggered on any text editor change
function onEditorInput() {
  const status = document.getElementById('save-status');
  if (status) { 
    status.textContent = 'Đang lưu...'; 
    status.className = 'save-status saving'; 
  }

  // Debounce Auto-save
  clearTimeout(saveTimer);
  saveTimer = setTimeout(triggerSave, 1500);

  // Debounce Word count update
  clearTimeout(wordCountTimer);
  wordCountTimer = setTimeout(updateWordCount, 300);
}

// Triggered when document status changes
function onStatusChange() {
  triggerSave();
}

// Triggered when document date changes
function onDateChange() {
  triggerSave();
}

// Perform AJAX call to save document details
async function triggerSave() {
  const status = document.getElementById('save-status');
  if (status) { 
    status.textContent = 'Đang lưu...'; 
    status.className = 'save-status saving'; 
  }
  
  const title = document.getElementById('doc-title').value.trim() || 'Tài liệu không tên';
  const content = document.getElementById('editor').innerHTML;
  const docStatus = document.getElementById('doc-status').value;
  const docDate = document.getElementById('doc-date').value;
  
  const payload = {
    title: title,
    content: content,
    status: docStatus,
    doc_date: docDate
  };
  
  if (currentDocId) {
    payload.id = currentDocId;
  }
  
  try {
    const response = await fetch('/api/documents/save/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (status) { 
        status.textContent = '✓ Đã lưu'; 
        status.className = 'save-status'; 
      }
      
      // Update local ID if this is a newly created document
      if (!currentDocId && data.document_id) {
        currentDocId = data.document_id;
        // Update URL to append the document ID dynamically without reloading
        const newUrl = `${window.location.pathname}?id=${currentDocId}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }
      
      // Update breadcrumb and date field
      const breadcrumbCurrent = document.querySelector('.breadcrumb .bc-current');
      if (breadcrumbCurrent) breadcrumbCurrent.textContent = title;
      if (data.doc_date) {
        document.getElementById('doc-date').value = data.doc_date;
      }
      
    } else {
      if (status) {
        status.textContent = 'Lỗi lưu'; 
        status.className = 'save-status error'; 
      }
      console.error(data.error);
    }
  } catch (err) {
    if (status) {
      status.textContent = 'Mất kết nối'; 
      status.className = 'save-status error'; 
    }
    console.error(err);
  }
}

// ─── Keyboard shortcuts ───
function onEditorKeydown(e) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'b') { e.preventDefault(); fmt('bold'); }
    if (e.key === 'i') { e.preventDefault(); fmt('italic'); }
    if (e.key === 'u') { e.preventDefault(); fmt('underline'); }
    if (e.key === 's') { e.preventDefault(); triggerSave(); }
  }
}

// Word count calculator
function updateWordCount() {
  const editor = document.getElementById('editor');
  if (!editor) return;
  const text = editor.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const readMin = Math.max(1, Math.ceil(words / 200));
  const wcEl = document.getElementById('word-count');
  const swEl = document.getElementById('status-words');
  if (wcEl) wcEl.textContent = `🔤 ${words.toLocaleString()} từ`;
  if (swEl) swEl.textContent = `${words.toLocaleString()} từ · ~${readMin} phút`;
}

// CSRF cookie reader
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

// ─── Format commands ───
function fmt(cmd) { document.execCommand(cmd, false, null); }

function setBlockType(val) {
  document.execCommand('formatBlock', false, val === 'p' ? 'p' : val);
}

function insertTable() {
  const html = `<table style="width:100%;border-collapse:collapse;margin:12px 0">
    <tr><th style="border:1px solid #ddd;padding:8px;background:#f7f7f5">Nội dung</th><th style="border:1px solid #ddd;padding:8px;background:#f7f7f5">Giá trị</th><th style="border:1px solid #ddd;padding:8px;background:#f7f7f5">Ghi chú</th></tr>
    <tr><td style="border:1px solid #ddd;padding:8px">&nbsp;</td><td style="border:1px solid #ddd;padding:8px">&nbsp;</td><td style="border:1px solid #ddd;padding:8px">&nbsp;</td></tr>
    <tr><td style="border:1px solid #ddd;padding:8px">&nbsp;</td><td style="border:1px solid #ddd;padding:8px">&nbsp;</td><td style="border:1px solid #ddd;padding:8px">&nbsp;</td></tr>
  </table><p><br></p>`;
  document.execCommand('insertHTML', false, html);
}

function insertHR() {
  document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid #e6e4e0;margin:16px 0"><p><br></p>');
}

// ─── AI Panel toggle ───
function toggleAIPanel() {
  const panel = document.getElementById('ai-panel');
  const btn = document.getElementById('ai-panel-toggle');
  if (panel) {
    panel.classList.toggle('hidden');
    btn.textContent = panel.classList.contains('hidden') ? 'AI Panel ▸' : 'AI Panel ◂';
  }
}

function switchPanelTab(el, tab) {
  document.querySelectorAll('.ap-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['search','draft'].forEach(id => {
    const el = document.getElementById('tab-' + id);
    if (el) el.style.display = id === tab ? 'flex' : 'none';
  });
}

// ─── AI actions (Mocked) ───
const AI_SAMPLES = {
  write: 'Bên cạnh đó, đơn vị đã triển khai hiệu quả nhiều chương trình cải cách hành chính, đặc biệt là việc số hóa toàn bộ quy trình tiếp nhận và trả kết quả hồ sơ. Điều này giúp rút ngắn thời gian xử lý trung bình từ 7 ngày xuống còn 4,5 ngày làm việc, đồng thời nâng cao sự hài lòng của người dân lên mức 92,4% theo khảo sát tháng 6/2025.',
  improve: 'Trong Quý II năm 2025, đơn vị đã hoàn thành xuất sắc 95,3% các chỉ tiêu kế hoạch đề ra, vượt mức so với cùng kỳ năm trước. Tổng doanh thu đạt 42,7 tỷ đồng, tương đương mức tăng trưởng 12,4% so với Quý I/2025.',
  summarize: 'Tóm tắt: Báo cáo Q2/2025 ghi nhận kết quả tích cực với 95,3% chỉ tiêu hoàn thành, doanh thu 42,7 tỷ đồng (+12,4%), và 1.842 hồ sơ được giải quyết với tỷ lệ đúng hạn 98,1%. Đề xuất tiếp tục duy trì các biện pháp cải cách trong Q3.',
  translate: 'In Q2 2025, the department successfully completed 95.3% of its planned targets, surpassing the same period last year. Total revenue reached VND 42.7 billion, reflecting a 12.4% growth compared to Q1.'
};

async function aiAction(type) {
  if (type === 'improve') {
    const editor = document.getElementById('editor');
    if (!editor) return;
    const content = editor.innerHTML.trim();
    if (!content || content === '<p><br></p>') {
      alert('Vùng soạn thảo đang trống. Cậu hãy nhập văn bản trước khi yêu cầu AI cải thiện nhé!');
      return;
    }

    // 1. Tạo Glassmorphic loading overlay
    const body = document.body;
    const loader = document.createElement('div');
    loader.id = 'ai-improve-loader';
    loader.style = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 99999; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 16px;
      color: white; font-family: var(--font-sans); font-size: 15px; font-weight: 500;
    `;
    loader.innerHTML = `
      <svg class="spinner" width="36" height="36" viewBox="0 0 50 50" style="animation:rotate 1.5s linear infinite; color:#f59f0b;">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite;"></circle>
      </svg>
      <span>Trợ lý AI đang quét và tìm điểm cải thiện văn bản...</span>
    `;
    body.appendChild(loader);

    try {
      const docTitle = document.getElementById('doc-title').value;
      const response = await fetch('/api/documents/ai-improve/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content,
          title: docTitle
        })
      });

      const data = await response.json();
      loader.remove();

      if (data.success) {
        highlightImprovements(data.improvements);
      } else {
        alert('Lỗi cải thiện AI: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      loader.remove();
      alert('Không thể kết nối đến máy chủ AI để cải thiện văn bản.');
    }
  } else {
    // Fallback cho các action khác nếu có
    const sugg = document.getElementById('ai-suggestion');
    const text = document.getElementById('ai-sugg-text');
    if (!sugg || !text) return;

    text.textContent = 'Đang xử lý...';
    sugg.style.display = 'block';
    sugg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
      const content = AI_SAMPLES[type] || 'Nội dung gợi ý từ AI dựa trên kho tri thức...';
      typeText(text, content, 0);
    }, 800);
  }
}

// ─── Logic bôi nổi bật cải thiện tương tác ───
function highlightImprovements(improvements) {
  const editor = document.getElementById('editor');
  if (!editor) return;
  
  // Xóa toàn bộ highlights cũ trước khi quét mới
  clearAllHighlights();
  
  if (!improvements || improvements.length === 0) {
    alert("✨ Tuyệt vời! Trợ lý AI không phát hiện lỗi chính tả hay điểm nào cần cải thiện trong văn bản này.");
    return;
  }
  
  let count = 0;
  
  // Hàm đệ quy duyệt qua các Text Node để bọc thẻ highlight an toàn
  function traverse(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.nodeValue;
      
      for (let imp of improvements) {
        const orig = imp.original;
        if (!orig) continue;
        
        const idx = text.indexOf(orig);
        if (idx !== -1) {
          const parent = node.parentNode;
          // Tránh lặp bọc nếu đã ở trong thẻ highlight
          if (parent && parent.classList.contains('ai-highlight-span')) {
            continue;
          }
          
          // Tách Text Node thành 3 phần: Trước cụm từ, Cụm từ khớp, Sau cụm từ
          const beforeText = text.substring(0, idx);
          const matchedText = text.substring(idx, idx + orig.length);
          const afterText = text.substring(idx + orig.length);
          
          const beforeNode = document.createTextNode(beforeText);
          const afterNode = document.createTextNode(afterText);
          
          const span = document.createElement('span');
          span.className = 'ai-highlight-span';
          span.textContent = matchedText;
          span.setAttribute('data-original', orig);
          span.setAttribute('data-improved', imp.improved);
          span.setAttribute('data-reason', imp.reason);
          
          span.onclick = (e) => showImproveTooltip(e, span);
          
          parent.insertBefore(beforeNode, node);
          parent.insertBefore(span, node);
          parent.insertBefore(afterNode, node);
          parent.removeChild(node);
          
          // Tiếp tục duyệt đệ quy phần trước và phần sau
          traverse(beforeNode);
          traverse(afterNode);
          
          count++;
          break;
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE' && !node.classList.contains('ai-improve-tooltip')) {
        const children = Array.from(node.childNodes);
        for (let child of children) {
          traverse(child);
        }
      }
    }
  }
  
  traverse(editor);
  
  if (count > 0) {
    // Hiển thị một Toast thông báo nổi tuyệt đẹp ở góc dưới màn hình
    const toast = document.createElement('div');
    toast.style = `
      position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
      background: #d97706; color: white; padding: 10px 22px; border-radius: 30px;
      box-shadow: var(--shadow-lg); font-family: var(--font-sans);
      font-size: 13px; font-weight: 600; z-index: 99999;
      animation: tooltipFadeIn 0.3s; display: flex; align-items: center; gap: 8px;
    `;
    toast.innerHTML = `<span>💡 AI đề xuất <strong>${count} vị trí</strong> cần sửa đổi. Hãy nhấp vào các cụm từ tô màu vàng để xem gợi ý!</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 6000);
  } else {
    alert("✨ Tuyệt vời! Trợ lý AI không phát hiện lỗi chính tả hay điểm nào cần cải thiện trong văn bản này.");
  }
}

function clearAllHighlights() {
  const highlights = document.querySelectorAll('.ai-highlight-span');
  highlights.forEach(span => {
    const parent = span.parentNode;
    if (parent) {
      const textNode = document.createTextNode(span.textContent);
      parent.replaceChild(textNode, span);
      parent.normalize();
    }
  });
  hideImproveTooltip();
}

function hideImproveTooltip() {
  const tooltip = document.getElementById('ai-improve-tooltip');
  if (tooltip) {
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(4px)';
    tooltip.style.transition = 'opacity 0.12s ease, transform 0.12s ease';
    setTimeout(() => {
      tooltip.style.display = 'none';
    }, 120);
  }
}

let activeHighlightSpan = null;

function showImproveTooltip(e, span) {
  e.stopPropagation();
  activeHighlightSpan = span;
  
  const tooltip = document.getElementById('ai-improve-tooltip');
  if (!tooltip) return;
  
  const original = span.getAttribute('data-original');
  const improved = span.getAttribute('data-improved');
  const reason = span.getAttribute('data-reason');
  
  tooltip.innerHTML = `
    <div class="ai-tooltip-header">
      💡 Gợi ý cải thiện từ AI
    </div>
    <p class="ai-tooltip-reason">"${reason}"</p>
    <div class="ai-tooltip-diff">
      <span class="ai-diff-del">${original}</span>
      <span class="ai-diff-ins">${improved}</span>
    </div>
    <div class="ai-tooltip-actions">
      <button class="ai-btn-dismiss" id="ai-btn-dismiss-action" onclick="event.stopPropagation(); if(typeof window.rejectHighlight==='function') window.rejectHighlight(event)">✕ Bỏ qua</button>
      <button class="ai-btn-accept" id="ai-btn-accept-action" onclick="event.stopPropagation(); if(typeof window.acceptHighlight==='function') window.acceptHighlight(event)">✓ Chấp nhận</button>
    </div>
  `;
  
  // Thiết lập trạng thái bắt đầu của hiệu ứng fade-in mượt mà
  tooltip.style.display = 'flex';
  tooltip.style.opacity = '0';
  tooltip.style.transform = 'translateY(8px)';
  tooltip.style.transition = 'none';
  
  // Ép buộc trình duyệt tính toán kích thước (Force Reflow) để lấy chiều cao chính xác lập tức
  const tooltipHeight = tooltip.offsetHeight;
  
  // Xác định vị trí của thẻ span để đặt hộp thoại phía trên cụm từ đó
  const rect = span.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
  
  const tooltipWidth = 300;
  const left = rect.left + rect.width / 2 - tooltipWidth / 2 + scrollLeft;
  const top = rect.top - tooltipHeight - 12 + scrollTop; // Đặt cách trên từ 12px để tăng tính thẩm mỹ và an toàn
  
  tooltip.style.left = Math.max(16, left) + 'px';
  tooltip.style.top = top + 'px';
  
  // Kích hoạt hiệu ứng chuyển động tịnh tiến và mờ ảo
  setTimeout(() => {
    tooltip.style.transition = 'opacity 0.18s ease-out, transform 0.18s ease-out';
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'translateY(0)';
  }, 10);
}

function acceptHighlight(e) {
  if (e) e.stopPropagation();
  if (!activeHighlightSpan) {
    hideImproveTooltip();
    return;
  }
  
  try {
    const improved = activeHighlightSpan.getAttribute('data-improved');
    const parent = activeHighlightSpan.parentNode;
    if (parent) {
      const textNode = document.createTextNode(improved);
      parent.replaceChild(textNode, activeHighlightSpan);
      parent.normalize();
      updateWordCount();
      triggerSave();
    }
  } catch (err) {
    console.error("Lỗi khi áp dụng cải thiện:", err);
  }
  
  activeHighlightSpan = null;
  hideImproveTooltip();
}

function rejectHighlight(e) {
  if (e) e.stopPropagation();
  if (!activeHighlightSpan) {
    hideImproveTooltip();
    return;
  }
  
  try {
    const original = activeHighlightSpan.getAttribute('data-original');
    const parent = activeHighlightSpan.parentNode;
    if (parent) {
      const textNode = document.createTextNode(original);
      parent.replaceChild(textNode, activeHighlightSpan);
      parent.normalize();
    }
  } catch (err) {
    console.error("Lỗi khi bỏ qua cải thiện:", err);
  }
  
  activeHighlightSpan = null;
  hideImproveTooltip();
}

// Gắn rõ ràng vào đối tượng window để các lệnh onclick thô trên thẻ HTML luôn tìm thấy
window.acceptHighlight = acceptHighlight;
window.rejectHighlight = rejectHighlight;

// Ẩn tooltip khi người dùng nhấp ra ngoài
window.addEventListener('click', (e) => {
  const tooltip = document.getElementById('ai-improve-tooltip');
  if (tooltip && tooltip.style.display === 'flex') {
    if (!tooltip.contains(e.target) && !e.target.classList.contains('ai-highlight-span')) {
      hideImproveTooltip();
    }
  }
});

function typeText(el, txt, i) {
  if (i <= txt.length) {
    el.textContent = txt.slice(0, i);
    setTimeout(() => typeText(el, txt, i + 3), 18);
  }
}

function acceptSuggestion() {
  const text = document.getElementById('ai-sugg-text');
  const editor = document.getElementById('editor');
  if (text && editor) {
    editor.focus();
    const p = document.createElement('p');
    p.textContent = text.textContent;
    editor.appendChild(p);
    onEditorInput();
  }
  dismissSuggestion();
}

function dismissSuggestion() {
  const sugg = document.getElementById('ai-suggestion');
  if (sugg) sugg.style.display = 'none';
}

function regenerateSuggestion() {
  const text = document.getElementById('ai-sugg-text');
  if (text) {
    text.textContent = 'Đang viết lại...';
    setTimeout(() => typeText(text, AI_SAMPLES.write + ' Ngoài ra, chất lượng phục vụ nhân dân được nâng cao đáng kể.', 0), 600);
  }
}

// ─── Chat ───
// ─── Chat ───
function chatKeydown(e, mode) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (mode === 'search') {
      sendSearchChat();
    } else if (mode === 'draft') {
      sendDraftChat();
    } else {
      sendSearchChat();
    }
  }
}

async function sendSearchChat() {
  const input = document.getElementById('search-chat-input');
  const messages = document.getElementById('search-chat-messages');
  if (!input || !messages) return;
  const msg = input.value.trim();
  if (!msg) return;

  // 1. Hiển thị tin nhắn người dùng
  messages.innerHTML += `<div class="chat-msg user"><div class="chat-bubble">${msg}</div></div>`;
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  const queryLower = msg.toLowerCase();
  
  // Kiểm tra xem đây có phải là lệnh yêu cầu chỉnh sửa văn bản đang có hay không
  const isEditingRequest = [
    "sửa", "chỉnh", "sửa lỗi", "cải thiện", "viết tiếp", "điền", 
    "chinh sua", "sua loi", "cai thien", "viet tiep"
  ].some(kw => queryLower.includes(kw));

  const editorContent = document.getElementById('editor').innerHTML.trim();
  const hasContent = editorContent && editorContent !== '<p><br></p>';

  if (isEditingRequest && hasContent) {
    // Luồng yêu cầu AI chỉnh sửa văn bản trực tiếp
    const loadingId = 'ai-search-loading-' + Date.now();
    messages.innerHTML += `
      <div class="chat-msg assistant" id="${loadingId}">
        <div class="chat-bubble" style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);">
          <svg class="spinner" width="14" height="14" viewBox="0 0 50 50" style="animation:rotate 1.5s linear infinite;color:var(--blue-500);">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite;"></circle>
          </svg>
          Trợ lý AI đang đọc và tối ưu hóa tài liệu hiện tại...
        </div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    const docTitle = document.getElementById('doc-title').value;

    try {
      const response = await fetch('/api/documents/ai-assist/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: editorContent,
          user_query: msg,
          title: docTitle
        })
      });

      const data = await response.json();
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();

      if (data.success) {
        document.getElementById('editor').innerHTML = data.content;
        updateWordCount();
        await triggerSave();

        messages.innerHTML += `
          <div class="chat-msg assistant">
            <div class="chat-bubble" style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; font-size:12px; line-height:1.6;">
              ✓ Đã chỉnh sửa tài liệu theo yêu cầu của cậu! Cậu xem thử văn bản bên trái nhé.
            </div>
          </div>
        `;
        messages.scrollTop = messages.scrollHeight;
      } else {
        messages.innerHTML += `
          <div class="chat-msg assistant">
            <div class="chat-bubble">Lỗi trợ lý AI: ${data.error}</div>
          </div>
        `;
        messages.scrollTop = messages.scrollHeight;
      }
    } catch (err) {
      console.error(err);
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();
      messages.innerHTML += `
        <div class="chat-msg assistant">
          <div class="chat-bubble">Mất kết nối mạng khi gửi yêu cầu tới trợ lý AI. Cậu thử lại nhé.</div>
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
    }
  } else {
    // Luồng tìm kiếm 10 biểu mẫu từ database vector
    const loadingId = 'ai-search-loading-' + Date.now();
    messages.innerHTML += `
      <div class="chat-msg assistant" id="${loadingId}">
        <div class="chat-bubble" style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);">
          <svg class="spinner" width="14" height="14" viewBox="0 0 50 50" style="animation:rotate 1.5s linear infinite;color:var(--blue-500);">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite;"></circle>
          </svg>
          Đang liên kết vector DB và tìm kiếm 10 biểu mẫu tối ưu...
        </div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    try {
      const response = await fetch('/api/search/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: msg, search_mode: 'template' })
      });
      
      const data = await response.json();
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();

      if (data.success && data.templates && data.templates.length > 0) {
        let optionsHTML = data.templates.map((t, idx) => `
          <div class="chat-template-card" onclick="previewSelectedTemplate('${t.file_name}', '${t.title.replace(/'/g, "\\'")}', this)" style="background:var(--white); border:1.5px solid var(--border-default); border-radius:var(--radius-lg); padding:10px; margin-top:8px; cursor:pointer; transition:all var(--transition); display:flex; flex-direction:column; gap:4px; box-shadow:var(--shadow-sm);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:11.5px; font-weight:600; color:var(--blue-700); text-align:left;">${idx + 1}. ${t.title}</span>
              <span style="font-size:10px; color:var(--green-600); font-weight:600; background:var(--green-50); padding:1px 4px; border-radius:4px; flex-shrink:0;">${t.score}</span>
            </div>
            <p style="font-size:10.5px; color:var(--text-secondary); line-height:1.4; margin:0; text-align:justify;">${t.snippet.substring(0, 120)}...</p>
            <span class="card-action-text" style="font-size:10.5px; font-weight:600; color:var(--blue-600); margin-top:2px; display:inline-block; text-align:left;">👁️ Nhấp để xem thử &rarr;</span>
          </div>
        `).join('');

        messages.innerHTML += `
          <div class="chat-msg assistant">
            <div class="chat-bubble" style="display:flex; flex-direction:column;">
              <span>Tớ đã tìm thấy <strong>${data.templates.length} biểu mẫu</strong> khớp nhất từ kho tri thức. Bạn hãy click vào một mẫu bên dưới để xem thử phía bên trái nhé:</span>
              ${optionsHTML}
              <div id="confirm-use-area" style="display:none; margin-top:12px; padding:12px; background:var(--blue-50); border:1px solid var(--blue-100); border-radius:var(--radius-lg); text-align:center; flex-direction:column; gap:8px;">
                <span style="font-size:11.5px; color:var(--blue-900); font-weight:500;" id="confirm-use-text">Bạn đang xem thử mẫu...</span>
                <div style="display:flex; gap:8px; width:100%;">
                  <button class="btn btn-primary btn-sm" id="btn-confirm-use" style="background:#10b981; border-color:#10b981; font-weight:600; flex:1; height:32px; font-size:11.5px; color:white;" onclick="confirmUseTemplate()">✏️ Sử dụng mẫu</button>
                  <button class="btn btn-primary btn-sm" id="btn-ai-autofill" style="background:var(--blue-600); border-color:var(--blue-600); font-weight:600; flex:1; height:32px; font-size:11.5px; color:white;" onclick="startAiAutoFill()">✨ AI Soạn nhanh</button>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        messages.innerHTML += `
          <div class="chat-msg assistant">
            <div class="chat-bubble">Tớ đã kết nối kho tri thức nhưng chưa tìm thấy biểu mẫu nào khớp hoàn chỉnh. Bạn hãy thử mô tả rõ hơn loại văn bản cần soạn nhé (Ví dụ: "đơn xin nghỉ phép", "tờ trình kinh phí",...).</div>
          </div>
        `;
      }
      messages.scrollTop = messages.scrollHeight;
    } catch (err) {
      console.error(err);
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();
      messages.innerHTML += `
        <div class="chat-msg assistant">
          <div class="chat-bubble">Không thể kết nối đến máy chủ để tra cứu biểu mẫu. Bạn hãy kiểm tra lại đường truyền mạng nhé.</div>
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
    }
  }
}

async function sendDraftChat() {
  const input = document.getElementById('draft-chat-input');
  const messages = document.getElementById('draft-chat-messages');
  if (!input || !messages) return;
  const msg = input.value.trim();
  if (!msg) return;

  // 1. Hiển thị tin nhắn người dùng
  messages.innerHTML += `<div class="chat-msg user"><div class="chat-bubble">${msg}</div></div>`;
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  const editorContent = document.getElementById('editor').innerHTML.trim();
  const hasContent = editorContent && editorContent !== '<p><br></p>';

  const queryLower = msg.toLowerCase();
  
  // Xác định xem người dùng muốn chỉnh sửa tài liệu đang có hay soạn thảo mới hoàn toàn
  const isEditingRequest = [
    "sửa", "chỉnh", "sửa lỗi", "cải thiện", "viết tiếp", "điền", 
    "chinh sua", "sua loi", "cai thien", "viet tiep"
  ].some(kw => queryLower.includes(kw));

  if (isEditingRequest && hasContent) {
    // Luồng Trợ lý AI chỉnh sửa/hiệu đính tài liệu đang mở trên editor live
    const loadingId = 'ai-draft-loading-' + Date.now();
    messages.innerHTML += `
      <div class="chat-msg assistant" id="${loadingId}">
        <div class="chat-bubble" style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);">
          <svg class="spinner" width="14" height="14" viewBox="0 0 50 50" style="animation:rotate 1.5s linear infinite;color:var(--blue-500);">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite;"></circle>
          </svg>
          Trợ lý AI đang chỉnh sửa tài liệu theo yêu cầu...
        </div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    const docTitle = document.getElementById('doc-title').value;

    try {
      const response = await fetch('/api/documents/ai-assist/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: editorContent,
          user_query: msg,
          title: docTitle
        })
      });

      const data = await response.json();
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();

      if (data.success) {
        document.getElementById('editor').innerHTML = data.content;
        updateWordCount();
        await triggerSave();

        messages.innerHTML += `
          <div class="chat-msg assistant">
            <div class="chat-bubble" style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; font-size:12px; line-height:1.6;">
              ✓ Đã chỉnh sửa tài liệu theo yêu cầu của cậu! Cậu xem thử văn bản bên trái nhé.
            </div>
          </div>
        `;
        messages.scrollTop = messages.scrollHeight;
      } else {
        messages.innerHTML += `
          <div class="chat-msg assistant">
            <div class="chat-bubble">Lỗi trợ lý AI: ${data.error}</div>
          </div>
        `;
        messages.scrollTop = messages.scrollHeight;
      }
    } catch (err) {
      console.error(err);
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();
      messages.innerHTML += `
        <div class="chat-msg assistant">
          <div class="chat-bubble">Mất kết nối mạng khi gửi yêu cầu tới trợ lý AI. Cậu thử lại nhé.</div>
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
    }
  } else {
    // Luồng AI Soạn thảo văn bản mới tinh từ đầu theo yêu cầu sử dụng RAG
    const loadingId = 'ai-draft-loading-' + Date.now();
    messages.innerHTML += `
      <div class="chat-msg assistant" id="${loadingId}">
        <div class="chat-bubble" style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);">
          <svg class="spinner" width="14" height="14" viewBox="0 0 50 50" style="animation:rotate 1.5s linear infinite;color:var(--blue-500);">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite;"></circle>
          </svg>
          AI đang liên kết tri thức, lập đề cương và tự động soạn thảo...
        </div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    try {
      const response = await fetch('/api/search/generate-template/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          option_title: msg,
          original_query: msg
        })
      });

      const data = await response.json();
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();

      if (data.success) {
        document.getElementById('doc-title').value = data.title;
        document.getElementById('editor').innerHTML = data.content;
        updateWordCount();
        await triggerSave();

        messages.innerHTML += `
          <div class="chat-msg assistant">
            <div class="chat-bubble" style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; font-size:12px; line-height:1.6;">
              ✓ Trợ lý AI đã soạn thảo xong tài liệu <strong>"${data.title}"</strong> chuẩn thể thức Nghị định 30 và nạp vào khung soạn thảo bên trái thành công!
            </div>
          </div>
        `;
        messages.scrollTop = messages.scrollHeight;
      } else {
        messages.innerHTML += `
          <div class="chat-msg assistant">
            <div class="chat-bubble">Lỗi soạn thảo AI: ${data.error}</div>
          </div>
        `;
        messages.scrollTop = messages.scrollHeight;
      }
    } catch (err) {
      console.error(err);
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.remove();
      messages.innerHTML += `
        <div class="chat-msg assistant">
          <div class="chat-bubble">Lỗi kết nối mạng khi gọi trợ lý AI soạn thảo. Cậu thử lại nhé.</div>
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
    }
  }
}

// ─── Share modal ───
function showShareModal() {
  document.getElementById('share-modal').style.display = 'flex';
}
function closeShareModal() {
  document.getElementById('share-modal').style.display = 'none';
}
function closeModal(e) {
  if (e.target === document.getElementById('share-modal')) closeShareModal();
}
function sendInvite() {
  const email = document.getElementById('share-email').value;
  if (email) alert(`Đã gửi lời mời đến ${email}`);
}
function copyLink() {
  navigator.clipboard.writeText(window.location.href).catch(() => {});
  alert('Đã sao chép link tài liệu!');
}

// ─── Dropdown menu handler ───
function toggleDownloadMenu(e) {
  e.stopPropagation(); // Prevent closing immediately from window click listener
  const menu = document.getElementById('download-menu');
  if (menu) {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
}

// Close dropdown when clicking anywhere outside of it
window.addEventListener('click', () => {
  const menu = document.getElementById('download-menu');
  if (menu) {
    menu.style.display = 'none';
  }
});

// ─── Exporters ───
async function exportDocx() {
  if (!currentDocId) {
    await triggerSave();
  }
  
  if (currentDocId) {
    window.location.href = `/api/documents/${currentDocId}/export/docx/`;
  } else {
    alert('Không thể xuất tệp: Tài liệu chưa được khởi tạo thành công.');
  }
}

function exportPdf() {
  // Directly trigger native print dialog
  // The CSS media print query in editor.css will handle A4 formatting automatically
  window.print();
}

// =========================================================================
// HÀM SOẠN THẢO BIỂU MẪU TỰ ĐỘNG (Từ sidebar AI Chat)
// =========================================================================

// Hàm nạp biểu mẫu đã chọn thẳng vào Canvas soạn thảo
async function loadSelectedTemplateInEditor(fileName) {
  if (!fileName) return;
  
  // Tạo loading indicator mờ ảo toàn bộ (Glassmorphism loader)
  const body = document.body;
  const loader = document.createElement('div');
  loader.id = 'global-editor-loader';
  loader.style = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 9999; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    color: white; font-family: var(--font-sans); font-size: 15px; font-weight: 500;
  `;
  loader.innerHTML = `
    <svg class="spinner" width="36" height="36" viewBox="0 0 50 50" style="animation:rotate 1.5s linear infinite; color:#10b981;">
      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite;"></circle>
    </svg>
    <span>Đang tải và chuẩn hóa định dạng biểu mẫu hành chính...</span>
  `;
  body.appendChild(loader);
  
  try {
    const response = await fetch('/api/search/get-document/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file_name: fileName })
    });
    
    const data = await response.json();
    loader.remove();
    
    if (data.success) {
      // 1. Phân tích văn bản gốc sang Premium HTML thể thức Nghị định 30 không viền
      const parsedHTML = parseMarkdownToPremiumHTML(data.full_text);
      
      // 2. Điền tiêu đề và nội dung vào canvas soạn thảo
      document.getElementById('doc-title').value = data.title;
      document.getElementById('editor').innerHTML = parsedHTML;
      
      // Cập nhật đếm số từ
      updateWordCount();
      
      // 3. Tự động kích hoạt auto-save để đồng bộ hóa Bản thảo với database ngay lập tức
      triggerSave();
      
      // 4. In thông báo xác nhận thành công rực rỡ vào khung chat
      const messages = document.getElementById('search-chat-messages');
      if (messages) {
        messages.innerHTML += `
          <div class="chat-msg assistant">
            <div class="chat-bubble" style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534;">
              ✓ Đã nạp thành công biểu mẫu <strong>${data.title}</strong> vào khung soạn thảo! Bạn có thể bắt đầu chỉnh sửa trực tiếp phía bên trái.
            </div>
          </div>
        `;
        messages.scrollTop = messages.scrollHeight;
      }
    } else {
      alert('Không thể tải toàn văn văn bản gốc: ' + data.error);
    }
  } catch (err) {
    console.error(err);
    if (document.getElementById('global-editor-loader')) {
      document.getElementById('global-editor-loader').remove();
    }
    alert('Lỗi kết nối mạng khi tải biểu mẫu.');
  }
}

// Tự động phát hiện và tái cấu trúc khung tiêu đề Quốc hiệu bị gãy hoặc nhiễu ký tự từ markdown thô trên TOÀN BỘ văn bản
function reconstructBrokenHeader(text) {
  if (!text) return "";
  
  let lines = text.split("\n");
  let resultLines = [];
  
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    
    // Phát hiện dòng chứa từ khóa Quốc hiệu hoặc Tiêu ngữ bất kỳ lúc nào xuất hiện
    if (line.includes("CỘNG HÒA XÃ HỘI") || line.includes("ĐỘC LẬP - TỰ DO") || line.includes("Độc lập - Tự do")) {
      let leftSide = [];
      let rightSide = [];
      
      // 1. Quét lùi (Lookback) tối đa 4 dòng để thu gom tên cơ quan/đơn vị ban hành ở bên trái
      let lookBackCount = 0;
      while (resultLines.length > 0 && lookBackCount < 4) {
        let lastLine = resultLines[resultLines.length - 1].trim();
        // Dừng quét lùi nếu gặp dòng trắng, thẻ HTML, tiêu đề lớn
        if (!lastLine || lastLine.startsWith("<table") || lastLine.startsWith("#") || lastLine === "TỜ TRÌNH" || lastLine === "BÁO CÁO" || lastLine === "QUYẾT ĐỊNH" || lastLine === "THÔNG BÁO") {
          break;
        }
        // Bỏ qua dòng phân cách bảng trong quá trình quét lùi
        if (lastLine.includes("---") || lastLine.includes("===") || /^[-\s_|]+$/.test(lastLine)) {
          resultLines.pop();
          continue;
        }
        
        let cleaned = lastLine.replace(/^[\s|_-]+|[\s|_-]+$/g, "").trim();
        if (cleaned) {
          leftSide.unshift(cleaned);
        }
        resultLines.pop(); // Xóa khỏi danh sách kết quả chung vì sẽ được gộp vào bảng
        lookBackCount++;
      }
      
      // 2. Quét tiến (Lookforward) tối đa 6 dòng để thu gom toàn bộ Quốc hiệu, Tiêu ngữ và ngày tháng năm
      let lookForwardCount = 0;
      while (i < lines.length && lookForwardCount < 6) {
        let currentLine = lines[i].trim();
        i++;
        lookForwardCount++;
        
        if (!currentLine) continue;
        
        // Dừng quét tiến nếu bắt đầu tiêu đề chính hoặc tiêu đề lớn
        if (currentLine.startsWith("#") || currentLine === "TỜ TRÌNH" || currentLine === "BÁO CÁO" || currentLine === "QUYẾT ĐỊNH" || currentLine === "THÔNG BÁO" || currentLine === "ĐƠN XIN NGHỈ PHÉP" || currentLine.startsWith("TỜ TRÌNH") || currentLine.startsWith("QUYẾT ĐỊNH")) {
          i--; // Trả lại dòng tiêu đề để vòng lặp chính xử lý tiếp
          break;
        }
        
        // Bỏ qua dòng kẻ phân cách
        if (currentLine.includes("---") || currentLine.includes("===") || /^[-\s_|]+$/.test(currentLine)) {
          continue;
        }
        
        let cleaned = currentLine.replace(/^[\s|_-]+|[\s|_-]+$/g, "").trim();
        if (!cleaned) continue;
        
        // Phân nhóm cột trái (Đơn vị/Số hiệu) và cột phải (Quốc hiệu/Tiêu ngữ/Ngày tháng)
        if (cleaned.includes("CỘNG HÒA") || cleaned.includes("Độc lập") || cleaned.includes("Hạnh phúc") || cleaned.includes("Kính gửi") || cleaned.includes("kính gửi") || /ngày\s+\d+|ngày\s+...|tháng|năm/i.test(cleaned)) {
          rightSide.push(cleaned);
        } else {
          leftSide.push(cleaned);
        }
      }
      
      // 3. Biên dựng bảng hành chính song song không viền, căn giữa hoàn mỹ
      if (leftSide.length > 0 || rightSide.length > 0) {
        let leftHTML = leftSide.map(line => {
          if (line.includes("BỘ") || line.includes("SỞ") || line.includes("ỦY BAN") || line.includes("ĐƠN VỊ") || line.includes("TỔNG CÔNG TY") || line.includes("TRÌNH")) {
            return `<strong>${line}</strong>`;
          }
          return line;
        }).join("<br>");
        
        let rightHTML = rightSide.map(line => {
          if (line.includes("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM") || line.includes("Độc lập - Tự do - Hạnh phúc") || line.includes("ĐỘC LẬP - TỰ DO - HẠNH PHÚC")) {
            return `<strong>${line}</strong>`;
          }
          return line;
        }).join("<br>");
        
        // Thêm gạch chân tiêu ngữ hành chính tiêu chuẩn
        rightHTML = rightHTML.replace(
          "<strong>Độc lập - Tự do - Hạnh phúc</strong>",
          "<strong>Độc lập - Tự do - Hạnh phúc</strong><br><span style='display:inline-block; width:130px; border-top:1.5px solid #222; margin-top:2px; margin-bottom:2px;'></span>"
        );
        rightHTML = rightHTML.replace(
          "<strong>ĐỘC LẬP - TỰ DO - HẠNH PHÚC</strong>",
          "<strong>ĐỘC LẬP - TỰ DO - HẠNH PHÚC</strong><br><span style='display:inline-block; width:130px; border-top:1.5px solid #222; margin-top:2px; margin-bottom:2px;'></span>"
        );
        
        // Thêm gạch chân Đơn vị trình nếu có
        if (leftHTML.includes("<strong>[ĐƠN VỊ TRÌNH]</strong>")) {
          leftHTML = leftHTML.replace(
            "<strong>[ĐƠN VỊ TRÌNH]</strong>",
            "<strong>[ĐƠN VỊ TRÌNH]</strong><br><span style='display:inline-block; width:70px; border-top:1.5px solid #222; margin-top:2px; margin-bottom:2px;'></span>"
          );
        }
        
        let tableHTML = `<table class="admin-header-table" style="width:100%; border-collapse:collapse; margin-bottom:24px; border:none;"><tr style="border:none;"><td style="width:50%; border:none; padding:4px 12px; vertical-align:top; text-align:center; font-size:14px; line-height:1.5; font-family:\'Times New Roman\', Times, serif;">${leftHTML}</td><td style="width:50%; border:none; padding:4px 12px; vertical-align:top; text-align:center; font-size:14px; line-height:1.5; font-family:\'Times New Roman\', Times, serif;">${rightHTML}</td></tr></table>`;
        resultLines.push(tableHTML);
      }
      
    } else {
      // Dòng văn bản bình thường, đưa trực tiếp vào kết quả
      resultLines.push(line);
      i++;
    }
  }
  
  return resultLines.join("\n");
}

// Các hàm bổ trợ nhận diện và xử lý chữ ký hành chính chuẩn thể thức
function isSignatureHeader(line) {
  if (!line) return false;
  const clean = line.replace(/[|\s_*\-#:]+/g, "").toLowerCase();
  const keywords = [
    "ngườilàmđơn", "nguoilamdon", "ngườikhai", "nguoikhai", 
    "thủtrưởng", "thutruong", "giámdốc", "giamdoc", 
    "kếtoántrưởng", "ketoantruong", "ngườilậpbiểu", "nguoilapbieu", 
    "phêduyệt", "pheduyet", "ýkiến", "ykien", "bangiámdốc", "bangiamdoc", 
    "đạidiện", "daidien", "chủtịch", "chutich", "ngườibáocáo", "nguoibaocao", 
    "ngườiđềnghị", "nguoidenghi", "ngườilậpphiếu", "nguoilapphieu"
  ];
  
  if (line.length > 100) return false;
  return keywords.some(kw => clean.includes(kw));
}

function isSignatureLine(line) {
  if (!line) return true;
  const clean = line.toLowerCase();
  if (clean.includes("chữ ký") || clean.includes("chu ky") || clean.includes("ký") || clean.includes("ky") || clean.includes("họ và tên") || clean.includes("ho va ten") || clean.includes("ghi rõ") || clean.includes("ghi ro") || clean.includes("đóng dấu") || clean.includes("dong dau")) {
    return true;
  }
  if (line.length < 45) {
    return true;
  }
  return false;
}

function buildSignatureHTML(sigLines) {
  let hasSplit = sigLines.some(l => l.includes("|"));
  
  if (hasSplit) {
    // 2 chữ ký: Trái và Phải
    let leftCols = [];
    let rightCols = [];
    
    for (let line of sigLines) {
      let cleanL = line.replace(/^[\s|_-]+|[\s|_-]+$/g, "").trim();
      if (cleanL.includes("|")) {
        let parts = cleanL.split("|");
        leftCols.push(parts[0].trim());
        rightCols.push(parts[1].trim());
      } else {
        leftCols.push(cleanL);
        rightCols.push(cleanL);
      }
    }
    
    let leftHTML = leftCols.map((l, idx) => {
      if (!l) return "";
      let formatted = formatInlineMarkdown(l);
      if (idx === 0) return `<strong style="font-size:14.5px; text-transform:uppercase;">${formatted}</strong>`;
      if (l.includes("(") && l.includes(")")) return `<span style="font-style:italic; font-size:12.5px; color:var(--text-secondary);">${formatted}</span>`;
      return `<span style="font-size:14.5px; font-weight:600; display:inline-block; margin-top:36px;">${formatted}</span>`;
    }).filter(x => x).join("<br>");
    
    let rightHTML = rightCols.map((r, idx) => {
      if (!r) return "";
      let formatted = formatInlineMarkdown(r);
      if (idx === 0) return `<strong style="font-size:14.5px; text-transform:uppercase;">${formatted}</strong>`;
      if (r.includes("(") && r.includes(")")) return `<span style="font-style:italic; font-size:12.5px; color:var(--text-secondary);">${formatted}</span>`;
      return `<span style="font-size:14.5px; font-weight:600; display:inline-block; margin-top:36px;">${formatted}</span>`;
    }).filter(x => x).join("<br>");
    
    return `
      <table class="admin-signature-table" style="width:100%; border-collapse:collapse; margin-top:32px; margin-bottom:24px; border:none;">
        <tr style="border:none;">
          <td style="width:50%; border:none; padding:8px 12px; vertical-align:top; text-align:center; line-height:1.6; font-family:'Times New Roman', Times, serif;">
            ${leftHTML}
          </td>
          <td style="width:50%; border:none; padding:8px 12px; vertical-align:top; text-align:center; line-height:1.6; font-family:'Times New Roman', Times, serif;">
            ${rightHTML}
          </td>
        </tr>
      </table>
    `;
  } else {
    // Chỉ có 1 chữ ký: Mặc định nằm ở bên PHẢI
    let rightCols = sigLines.map(l => l.replace(/^[\s|_-]+|[\s|_-]+$/g, "").trim()).filter(l => l);
    
    let rightHTML = rightCols.map((r, idx) => {
      let formatted = formatInlineMarkdown(r);
      if (idx === 0) return `<strong style="font-size:14.5px; text-transform:uppercase;">${formatted}</strong>`;
      if (r.includes("(") && r.includes(")")) return `<span style="font-style:italic; font-size:12.5px; color:var(--text-secondary);">${formatted}</span>`;
      return `<span style="font-size:14.5px; font-weight:600; display:inline-block; margin-top:36px;">${formatted}</span>`;
    }).join("<br>");
    
    return `
      <table class="admin-signature-table" style="width:100%; border-collapse:collapse; margin-top:32px; margin-bottom:24px; border:none;">
        <tr style="border:none;">
          <td style="width:50%; border:none;"></td>
          <td style="width:50%; border:none; padding:8px 12px; vertical-align:top; text-align:center; line-height:1.6; font-family:'Times New Roman', Times, serif;">
            ${rightHTML}
          </td>
        </tr>
      </table>
    `;
  }
}

// Hàm chuyển đổi Markdown hành chính sang HTML dạng văn bản gốc cực đẹp
function parseMarkdownToPremiumHTML(text) {
  if (!text) return "";
  
  // 0. Tái thiết cấu trúc tiêu đề bị phân mảnh gãy dòng
  let preprocessedText = reconstructBrokenHeader(text);
  
  // 1. Chuẩn hóa xuống dòng và ghép các dòng bảng Markdown bị gãy
  let linesRaw = preprocessedText.replace(/\r\n/g, "\n").split("\n");
  let processedLines = [];
  
  for (let i = 0; i < linesRaw.length; i++) {
    let current = linesRaw[i].trim();
    // Phát hiện dòng bảng bị gãy dòng (bắt đầu bằng | nhưng không kết thúc bằng |)
    if (current.startsWith("|") && !current.endsWith("|") && i + 1 < linesRaw.length) {
      let next = linesRaw[i + 1].trim();
      if (next.endsWith("|") && !next.startsWith("|")) {
        current = current + " " + next;
        i++; // Bỏ qua dòng tiếp theo đã gộp
      }
    }
    processedLines.push(current);
  }
  
  // 2. Định dạng mẫu số nghiêng đặc biệt ở góc trên bên phải nếu có
  let joinedText = processedLines.join("\n");
  joinedText = joinedText.replace(/^(Mẫu số\s+\w+[\s\S]*?)$/m, '<div style="text-align: right; font-style: italic; font-weight: 500; font-size: 13px; margin-bottom: 16px;">$1</div>');
  
  const lines = joinedText.split("\n");
  let result = [];
  let inTable = false;
  let tableRows = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let trimmed = line.trim();
    if (!trimmed) {
      if (!inTable) {
        result.push("<br>");
      }
      continue;
    }
    
    // Nếu dòng đã là mã HTML tự sinh (như bảng Quốc hiệu đã dựng sẵn) thì giữ nguyên, không bọc thẻ <p>
    if (trimmed.startsWith("<table") || trimmed.startsWith("<div") || trimmed.startsWith("<h") || trimmed.startsWith("<style")) {
      result.push(trimmed);
      continue;
    }
    
    // 3. Phát hiện và nhóm toàn bộ chữ ký để căn lề song song hoặc đẩy phải thông minh
    if (isSignatureHeader(trimmed)) {
      let sigLines = [];
      sigLines.push(trimmed);
      let j = i + 1;
      while (j < lines.length) {
        let nextTrimmed = lines[j].trim();
        // Dừng thu thập nếu gặp ghi chú, điều khoản hoặc dòng không liên quan
        if (nextTrimmed.startsWith("Ghi chú:") || nextTrimmed.startsWith("Điều ") || nextTrimmed.length > 80 || (nextTrimmed && !isSignatureLine(nextTrimmed))) {
          break;
        }
        sigLines.push(nextTrimmed);
        j++;
      }
      
      // Đóng bảng dở dang nếu có trước khi dựng chữ ký
      if (inTable && tableRows.length > 0) {
        result.push(buildHTMLTable(tableRows));
        inTable = false;
        tableRows = [];
      }
      
      i = j - 1;
      result.push(buildSignatureHTML(sigLines));
      continue;
    }
    
    // Phát hiện dòng bảng Markdown (bao gồm cả dòng không có | ở đầu/cuối nhưng có | bên trong và là một chuỗi dòng liên tục)
    const isTableLine = trimmed.includes("|") && (
      trimmed.includes("---") || 
      (i > 0 && lines[i-1].includes("|")) || 
      (i + 1 < lines.length && lines[i+1].includes("|")) || 
      (trimmed.startsWith("|") && trimmed.endsWith("|"))
    );
    
    if (isTableLine) {
      inTable = true;
      let normLine = trimmed;
      if (!normLine.startsWith("|")) normLine = "|" + normLine;
      if (!normLine.endsWith("|")) normLine = normLine + "|";
      
      let cols = normLine.split("|").map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Bỏ qua dòng phân cách bảng | --- | --- |
      if (normLine.includes("---")) {
        continue;
      }
      
      tableRows.push(cols);
      continue;
    } else {
      // Nếu kết thúc bảng, xuất bảng HTML
      if (inTable && tableRows.length > 0) {
        result.push(buildHTMLTable(tableRows));
        inTable = false;
        tableRows = [];
      }
    }
    
    // Xử lý tiêu đề
    if (trimmed.startsWith("###")) {
      result.push(`<h3 style="font-size:14.5px; font-weight:bold; margin:16px 0 8px; color:var(--text-primary);">${formatInlineMarkdown(trimmed.substring(3).trim())}</h3>`);
    } else if (trimmed.startsWith("##")) {
      result.push(`<h2 style="font-size:15.5px; font-weight:bold; margin:18px 0 8px; text-align:center; color:var(--text-primary);">${formatInlineMarkdown(trimmed.substring(2).trim())}</h2>`);
    } else if (trimmed.startsWith("#")) {
      result.push(`<h1 style="font-size:17.5px; font-weight:bold; margin:20px 0 8px; text-align:center; color:var(--text-primary);">${formatInlineMarkdown(trimmed.substring(1).trim())}</h1>`);
    } else {
      // Dòng văn bản thường
      let cleanedLine = trimmed;
      if (cleanedLine.startsWith("|")) cleanedLine = cleanedLine.slice(1).trim();
      if (cleanedLine.endsWith("|")) cleanedLine = cleanedLine.slice(0, -1).trim();
      
      if (/^[-\s_|]+$/.test(cleanedLine)) {
        continue;
      }
      
      let formattedLine = formatInlineMarkdown(cleanedLine);
      
      if (cleanedLine === "TỜ TRÌNH" || cleanedLine === "BÁO CÁO" || cleanedLine === "QUYẾT ĐỊNH" || cleanedLine === "THÔNG BÁO" || cleanedLine === "ĐƠN XIN NGHỈ PHÉP") {
        result.push(`<div style="text-align:center; font-size:17px; font-weight:bold; margin-top:20px; margin-bottom:6px; letter-spacing:1px; color:var(--text-primary);">${formattedLine}</div>`);
      } else if (cleanedLine.startsWith("Kế hoạch") || cleanedLine.startsWith("Về việc") || (cleanedLine.length < 100 && (cleanedLine.includes("kính gửi") || cleanedLine.includes("Kính gửi")))) {
        if (cleanedLine.includes("kính gửi") || cleanedLine.includes("Kính gửi")) {
          result.push(`<div style="text-align:center; font-size:14.5px; margin:12px 0 16px;">${formattedLine}</div>`);
        } else {
          result.push(`<div style="text-align:center; font-weight:bold; font-size:15px; margin-bottom:16px; color:var(--text-primary);">${formattedLine}</div>`);
        }
      } else {
        result.push(`<p style="margin-bottom:8px; text-indent:28px; text-align:justify; font-size:14.5px;">${formattedLine}</p>`);
      }
    }
  }
  
  if (inTable && tableRows.length > 0) {
    result.push(buildHTMLTable(tableRows));
  }
  
  return result.join("\n");
}

function buildHTMLTable(rows) {
  if (!rows || rows.length === 0) return "";
  const firstRowStr = rows[0].join(" ");
  const isHeaderTable = rows[0].length === 2 && 
    (firstRowStr.includes("CỘNG HÒA") || 
     firstRowStr.includes("Độc lập") || 
     firstRowStr.includes("Số:") || 
     firstRowStr.includes("ĐƠN VỊ") || 
     firstRowStr.includes("CƠ QUAN") || 
     firstRowStr.includes("Kính gửi"));
     
  if (isHeaderTable) {
    return buildHTMLHeaderTable(rows);
  } else {
    return buildHTMLDataTable(rows);
  }
}

function buildHTMLDataTable(rows) {
  let tableHTML = '<table class="admin-data-table" style="width:100%; border-collapse:collapse; margin:16px 0; border:1px solid #cbd5e1; font-size:13.5px; line-height:1.5; font-family:inherit;">';
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const isHeader = (i === 0);
    
    tableHTML += `<tr style="${isHeader ? 'background:rgba(0,0,0,0.03); border-bottom:2px solid #94a3b8;' : 'border-bottom:1px solid #e2e8f0;'}">`;
    
    for (let col of row) {
      let formattedCol = formatInlineMarkdown(col);
      
      if (isHeader) {
        tableHTML += `<th style="border:1px solid #cbd5e1; padding:8px 12px; font-weight:600; text-align:center; color:var(--text-primary);">${formattedCol}</th>`;
      } else {
        let align = 'left';
        const colClean = col.trim();
        if (/^\d+$/.test(colClean) || /^[A-Z,a-z]$/.test(colClean) || /^[I,V,X]+$/.test(colClean) || (colClean.startsWith('[') && colClean.endsWith(']')) || colClean === "=" || colClean === "+") {
          align = 'center';
        }
        tableHTML += `<td style="border:1px solid #cbd5e1; padding:8px 12px; text-align:${align}; color:var(--text-secondary);">${formattedCol}</td>`;
      }
    }
    tableHTML += '</tr>';
  }
  
  tableHTML += '</table>';
  return tableHTML;
}

function buildHTMLHeaderTable(rows) {
  let tableHTML = '<table class="admin-header-table" style="width:100%; border-collapse:collapse; margin-bottom:24px; border:none;">';
  for (let row of rows) {
    tableHTML += '<tr style="border:none;">';
    for (let col of row) {
      let formattedCol = formatInlineMarkdown(col);
      formattedCol = formatAdministrativePhrases(formattedCol);
      tableHTML += `<td style="width:50%; border:none; padding:4px 12px; vertical-align:top; text-align:center; font-size:14px; line-height:1.5;">${formattedCol}</td>`;
    }
    tableHTML += '</tr>';
  }
  tableHTML += '</table>';
  return tableHTML;
}

function formatAdministrativePhrases(cellText) {
  let formatted = cellText;
  if (formatted.includes("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM")) {
    formatted = formatted.replace(
      "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 
      "<strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>"
    );
  }
  if (formatted.includes("Độc lập - Tự do - Hạnh phúc")) {
    formatted = formatted.replace(
      "Độc lập - Tự do - Hạnh phúc", 
      "<strong>Độc lập - Tự do - Hạnh phúc</strong><br><span style='display:inline-block; width:130px; border-top:1.5px solid #222; margin-top:2px; margin-bottom:2px;'></span>"
    );
  }
  if (formatted.includes("[ĐƠN VỊ TRÌNH]")) {
    formatted = formatted.replace(
      "[ĐƠN VỊ TRÌNH]",
      "<strong>[ĐƠN VỊ TRÌNH]</strong><br><span style='display:inline-block; width:70px; border-top:1.5px solid #222; margin-top:2px; margin-bottom:2px;'></span>"
    );
  }
  return formatted;
}

function formatInlineMarkdown(text) {
  if (!text) return "";
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
  return formatted;
}

// Trạng thái biểu mẫu đang xem thử toàn cục
let lastPreviewedFileName = '';
let lastPreviewedTitle = '';
let lastPreviewedCardEl = null;

// Hàm tải xem thử biểu mẫu vào Editor bên trái khi người dùng nhấp chọn trên Card gợi ý
async function previewSelectedTemplate(fileName, title, cardEl) {
  if (!fileName) return;
  
  // Thiết lập phong cách Active nổi bật cho Card được chọn, bỏ các Card khác
  document.querySelectorAll('.chat-template-card').forEach(c => {
    c.style.borderColor = 'var(--border-default)';
    c.style.background = 'var(--white)';
    const actText = c.querySelector('.card-action-text');
    if (actText) {
      actText.textContent = '👁️ Nhấp để xem thử \u2192';
      actText.style.color = 'var(--blue-600)';
    }
  });
  
  cardEl.style.borderColor = 'var(--blue-500)';
  cardEl.style.background = 'var(--blue-50)';
  const actText = cardEl.querySelector('.card-action-text');
  if (actText) {
    actText.textContent = '👀 Đang xem thử...';
    actText.style.color = 'var(--blue-600)';
  }
  
  // Lưu trạng thái xem thử
  lastPreviewedFileName = fileName;
  lastPreviewedTitle = title;
  lastPreviewedCardEl = cardEl;
  
  // Tạo loading indicator mờ ảo toàn bộ (Glassmorphism loader)
  const body = document.body;
  const loader = document.createElement('div');
  loader.id = 'global-editor-loader';
  loader.style = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 9999; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    color: white; font-family: var(--font-sans); font-size: 15px; font-weight: 500;
  `;
  loader.innerHTML = `
    <svg class="spinner" width="36" height="36" viewBox="0 0 50 50" style="animation:rotate 1.5s linear infinite; color:#10b981;">
      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite;"></circle>
    </svg>
    <span>Đang tải xem thử biểu mẫu...</span>
  `;
  body.appendChild(loader);
  
  try {
    const response = await fetch('/api/search/get-document/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file_name: fileName })
    });
    
    const data = await response.json();
    loader.remove();
    
    if (data.success) {
      // 1. Phân tích văn bản gốc sang Premium HTML thể thức Nghị định 30 không viền
      const parsedHTML = parseMarkdownToPremiumHTML(data.full_text);
      
      // 2. Điền tiêu đề và nội dung vào canvas soạn thảo (chỉ để người dùng xem thử)
      document.getElementById('doc-title').value = data.title;
      document.getElementById('editor').innerHTML = parsedHTML;
      
      // Cập nhật số từ
      updateWordCount();
      
      // 3. Hiển thị khối Xác nhận sử dụng ở chân hòm chat
      const confirmArea = document.getElementById('confirm-use-area');
      const confirmText = document.getElementById('confirm-use-text');
      if (confirmArea && confirmText) {
        confirmArea.style.display = 'flex';
        confirmText.innerHTML = `Bạn đang xem thử mẫu: <strong>${data.title}</strong>. Nếu ưng ý, hãy nhấn nút bên dưới để áp dụng Bản thảo chính thức:`;
      }
    } else {
      alert('Không thể tải toàn văn văn bản gốc: ' + data.error);
    }
  } catch (err) {
    console.error(err);
    if (document.getElementById('global-editor-loader')) {
      document.getElementById('global-editor-loader').remove();
    }
    alert('Lỗi kết nối mạng khi tải xem thử biểu mẫu.');
  }
}

// Hàm xác nhận sử dụng chính thức biểu mẫu (Chỉ chạy khi người dùng bấm nút xác nhận)
async function confirmUseTemplate() {
  if (!lastPreviewedFileName || !lastPreviewedTitle) {
    alert('Vui lòng chọn một biểu mẫu bên trên để xem thử trước.');
    return;
  }
  
  const btn = document.getElementById('btn-confirm-use');
  const oldText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Đang lưu bản thảo...';
  
  try {
    // Lưu chính thức vào cơ sở dữ liệu qua hàm triggerSave có sẵn của editor.js
    await triggerSave();
    
    // In thông báo màu xanh lá nạp thành công chính thức
    const messages = document.getElementById('search-chat-messages');
    if (messages) {
      messages.innerHTML += `
        <div class="chat-msg assistant">
          <div class="chat-bubble" style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; font-size:12px; line-height:1.6; margin-top:8px;">
            ✓ Đã nạp thành công biểu mẫu <strong>${lastPreviewedTitle}</strong> vào khung soạn thảo! Bạn có thể bắt đầu chỉnh sửa trực tiếp phía bên trái.
          </div>
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
    }
    
    // Áp dụng viền xanh lá (✓ Đang áp dụng) cho card vừa được xác nhận sử dụng
    if (lastPreviewedCardEl) {
      lastPreviewedCardEl.style.borderColor = 'var(--green-500)';
      lastPreviewedCardEl.style.background = 'var(--green-50)';
      const actText = lastPreviewedCardEl.querySelector('.card-action-text');
      if (actText) {
        actText.textContent = '✓ Đang áp dụng';
        actText.style.color = 'var(--green-600)';
      }
    }
    
    // Ẩn vùng xác nhận đi sau khi đã khóa lựa chọn thành công
    const confirmArea = document.getElementById('confirm-use-area');
    if (confirmArea) {
      confirmArea.style.display = 'none';
    }
    
    // Reset trạng thái xem thử
    lastPreviewedFileName = '';
    lastPreviewedTitle = '';
    lastPreviewedCardEl = null;
    
  } catch (err) {
    console.error(err);
    alert('Có lỗi xảy ra khi lưu chính thức bản thảo mới.');
    btn.disabled = false;
    btn.innerHTML = oldText;
  }
}

// ─── AI Auto-Fill / Soạn thảo nhanh biểu mẫu hành chính trích xuất ───
function startAiAutoFill() {
  const messages = document.getElementById('search-chat-messages');
  if (!messages) return;
  
  // Ẩn bảng xác nhận hiện tại để nhường chỗ cho ô nhập thông tin
  const confirmArea = document.getElementById('confirm-use-area');
  if (confirmArea) {
    confirmArea.style.display = 'none';
  }
  
  const fillInputId = 'ai-fill-input-' + Date.now();
  const fillBtnId = 'ai-fill-btn-' + Date.now();
  
  messages.innerHTML += `
    <div class="chat-msg assistant">
      <div class="chat-bubble" style="display:flex; flex-direction:column; gap:8px; background:var(--blue-50); border:1px solid var(--blue-100); width: 100%; border-radius:var(--radius-lg); padding:12px;">
        <span style="font-weight:600; font-size:12px; color:var(--blue-900);">✨ Trợ lý AI sẵn sàng điền mẫu "${lastPreviewedTitle}":</span>
        <span style="font-size:10.5px; color:var(--text-secondary); line-height:1.4;">Nhập các thông tin cậu muốn điền (Ví dụ: tên Nguyễn Văn A, phòng hành chính, xin nghỉ từ 1/6 đến 5/6 để đi du lịch...)</span>
        <div style="display:flex; gap:6px; margin-top:4px;">
          <input type="text" id="${fillInputId}" class="input" placeholder="Nhập thông tin hoặc yêu cầu..." style="flex:1; height:30px; font-size:11.5px; padding:0 8px; border-radius:4px; border:1px solid var(--border-default);" />
          <button id="${fillBtnId}" class="btn btn-primary btn-sm" style="height:30px; font-size:11px; padding:0 12px; border-radius:4px; font-weight:600; color:white; background:var(--blue-600); border:none; cursor:pointer;" onclick="submitAiAutoFill('${fillInputId}', '${fillBtnId}')">Gửi</button>
        </div>
      </div>
    </div>
  `;
  messages.scrollTop = messages.scrollHeight;
  const inp = document.getElementById(fillInputId);
  if (inp) inp.focus();
}

async function submitAiAutoFill(inputId, btnId) {
  const inputEl = document.getElementById(inputId);
  const btnEl = document.getElementById(btnId);
  if (!inputEl || !btnEl) return;
  
  const userText = inputEl.value.trim();
  if (!userText) return;
  
  inputEl.disabled = true;
  btnEl.disabled = true;
  const oldBtnHTML = btnEl.innerHTML;
  btnEl.innerHTML = '⏳...';
  
  const messages = document.getElementById('search-chat-messages');
  
  // Hiển thị tin nhắn người dùng nhập vào
  messages.innerHTML += `
    <div class="chat-msg user">
      <div class="chat-bubble">${userText}</div>
    </div>
  `;
  messages.scrollTop = messages.scrollHeight;
  
  // Hiển thị vòng xoay spinner loading RAG
  const loaderId = 'ai-fill-loader-' + Date.now();
  messages.innerHTML += `
    <div class="chat-msg assistant" id="${loaderId}">
      <div class="chat-bubble" style="display:flex; align-items:center; gap:8px; font-size:11.5px; color:var(--text-secondary);">
        <svg class="spinner" width="14" height="14" viewBox="0 0 50 50" style="animation:rotate 1.5s linear infinite; color:var(--blue-500);">
          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite;"></circle>
        </svg>
        AI đang nạp mẫu trích xuất và soạn thảo văn bản điền sẵn...
      </div>
    </div>
  `;
  messages.scrollTop = messages.scrollHeight;
  
  try {
    const response = await fetch('/api/search/generate-template/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        option_title: lastPreviewedTitle,
        original_query: userText
      })
    });
    
    const data = await response.json();
    const loaderEl = document.getElementById(loaderId);
    if (loaderEl) loaderEl.remove();
    
    if (data.success) {
      // 1. Nạp thẳng nội dung HTML cao cấp được AI soạn thảo vào editor
      document.getElementById('editor').innerHTML = data.content;
      updateWordCount();
      
      // 2. Kích hoạt lưu bản thảo live
      await triggerSave();
      
      messages.innerHTML += `
        <div class="chat-msg assistant">
          <div class="chat-bubble" style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; font-size:12px; line-height:1.6; margin-top:8px;">
            ✓ Tuyệt vời! AI đã điền biểu mẫu <strong>${data.title}</strong> thành công dựa trên thông tin của cậu và nạp trực tiếp vào canvas bên trái.
          </div>
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
      
      // 3. Highlight màu xanh lá cho card biểu mẫu đã sử dụng
      if (lastPreviewedCardEl) {
        lastPreviewedCardEl.style.borderColor = 'var(--green-500)';
        lastPreviewedCardEl.style.background = 'var(--green-50)';
        const actText = lastPreviewedCardEl.querySelector('.card-action-text');
        if (actText) {
          actText.textContent = '✓ Đang áp dụng';
          actText.style.color = 'var(--green-600)';
        }
      }
      
      // Reset trạng thái xem thử
      lastPreviewedFileName = '';
      lastPreviewedTitle = '';
      lastPreviewedCardEl = null;
      
    } else {
      messages.innerHTML += `
        <div class="chat-msg assistant">
          <div class="chat-bubble">Lỗi từ máy chủ AI: ${data.error}</div>
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
      btnEl.disabled = false;
      btnEl.innerHTML = oldBtnHTML;
    }
  } catch (err) {
    console.error(err);
    const loaderEl = document.getElementById(loaderId);
    if (loaderEl) loaderEl.remove();
    alert('Lỗi kết nối mạng khi gọi trợ lý AI điền mẫu.');
    btnEl.disabled = false;
    btnEl.innerHTML = oldBtnHTML;
  }
}

// =========================================================================
// DYNAMIC INTEGRATION: SAVE EDITOR TO KNOWLEDGE BASE
// =========================================================================

function showSaveToKBModal() {
  const modal = document.getElementById('save-to-kb-modal');
  const select = document.getElementById('save-kb-select');
  const titleInput = document.getElementById('save-kb-title-input');
  
  if (!modal || !select || !titleInput) return;
  
  const docTitle = document.querySelector('.bc-current')?.textContent?.trim() || 'Tài liệu Soạn thảo';
  titleInput.value = docTitle;
  
  select.innerHTML = '<option value="">⏳ Đang tải các kho tri thức...</option>';
  modal.style.display = 'flex';
  
  fetch('/api/kb/')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.knowledge_bases.length > 0) {
        select.innerHTML = data.knowledge_bases.map(kb => 
          `<option value="${kb.id}">📂 ${kb.name} (${kb.doc_count} tài liệu)</option>`
        ).join('');
      } else {
        select.innerHTML = '<option value="">❌ Bạn chưa có kho tri thức nào. Vui lòng tạo tại trang Kho Tri Thức.</option>';
      }
    })
    .catch(err => {
      console.error(err);
      select.innerHTML = '<option value="">❌ Lỗi kết nối máy chủ.</option>';
    });
}

function closeSaveToKBModal(e) {
  if (!e || e.target === document.getElementById('save-to-kb-modal') || e.target.tagName === 'BUTTON') {
    document.getElementById('save-to-kb-modal').style.display = 'none';
  }
}

async function submitSaveToKB() {
  const select = document.getElementById('save-kb-select');
  const titleInput = document.getElementById('save-kb-title-input');
  const btn = document.getElementById('btn-confirm-save-kb');
  
  if (!select || !titleInput || !btn) return;
  
  const kbId = select.value;
  const title = titleInput.value.trim();
  const content = document.getElementById('editor').innerHTML;
  
  if (!kbId) {
    alert('Vui lòng chọn một Kho tri thức để lưu.');
    return;
  }
  if (!title) {
    alert('Vui lòng nhập tiêu đề lưu trữ.');
    return;
  }
  
  const oldBtnText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Đang phân tích & Index...';
  
  try {
    const res = await fetch(`/api/kb/${kbId}/save-draft/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify({ title, content })
    });
    const data = await res.json();
    
    btn.disabled = false;
    btn.innerHTML = oldBtnText;
    
    if (data.success) {
      document.getElementById('save-to-kb-modal').style.display = 'none';
      alert(`✓ Thành công!\nTài liệu "${title}" đã được lưu và nhúng vector vào kho tri thức của bạn thành công.`);
    } else {
      alert('Lỗi: ' + data.error);
    }
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.innerHTML = oldBtnText;
    alert('Lỗi kết nối máy chủ khi lưu tài liệu.');
  }
}

function toggleInlineCreateKB(e) {
  if (e) e.preventDefault();
  const form = document.getElementById('inline-create-kb-form');
  if (!form) return;
  
  if (form.style.display === 'none') {
    form.style.display = 'block';
    const input = document.getElementById('inline-kb-name');
    if (input) {
      input.value = '';
      input.focus();
    }
  } else {
    form.style.display = 'none';
  }
}

async function submitInlineCreateKB() {
  const input = document.getElementById('inline-kb-name');
  if (!input) return;
  
  const name = input.value.trim();
  if (!name) {
    alert('Vui lòng nhập tên kho tri thức mới.');
    return;
  }
  
  try {
    const res = await fetch('/api/kb/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify({ name, description: 'Được tạo nhanh từ Trình soạn thảo' })
    });
    const data = await res.json();
    
    if (data.success) {
      document.getElementById('inline-create-kb-form').style.display = 'none';
      
      const select = document.getElementById('save-kb-select');
      if (select) {
        select.innerHTML = '<option value="">⏳ Đang cập nhật danh sách kho...</option>';
        
        const kbRes = await fetch('/api/kb/');
        const kbData = await kbRes.json();
        
        if (kbData.success && kbData.knowledge_bases.length > 0) {
          select.innerHTML = kbData.knowledge_bases.map(kb => 
            `<option value="${kb.id}">📂 ${kb.name} (${kb.doc_count} tài liệu)</option>`
          ).join('');
          
          select.value = data.kb.id;
        } else {
          select.innerHTML = '<option value="">❌ Không thể cập nhật danh sách kho.</option>';
        }
      }
    } else {
      alert('Lỗi: ' + data.error);
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi kết nối máy chủ khi tạo nhanh kho tri thức.');
  }
}

async function loadKnowledgeDocumentInEditor(kbDocId) {
  if (!kbDocId) return;
  
  const editorEl = document.getElementById('editor');
  const titleInput = document.getElementById('doc-title');
  if (editorEl) editorEl.innerHTML = '<p>⏳ Đang nạp tài liệu tri thức vào trình soạn thảo...</p>';
  
  try {
    const res = await fetch(`/api/kb/document/${kbDocId}/content/`);
    const data = await res.json();
    
    if (data.success) {
      if (titleInput) titleInput.value = data.title;
      
      const cleanContent = data.content || '';
      const formattedHTML = cleanContent.split('\n\n').map(p => {
        if (!p.trim()) return '';
        return `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`;
      }).join('');
      
      if (editorEl) {
        editorEl.innerHTML = formattedHTML || '<p><br></p>';
      }
      
      const breadcrumb = document.querySelector('.bc-current');
      if (breadcrumb) breadcrumb.textContent = data.title;
      
      updateWordCount();
      
      setTimeout(async () => {
        await triggerSave();
      }, 500);
      
    } else {
      if (editorEl) editorEl.innerHTML = `<p style="color:var(--red-500)">❌ Lỗi nạp tài liệu: ${data.error}</p>`;
    }
  } catch (err) {
    console.error(err);
    if (editorEl) editorEl.innerHTML = '<p style="color:var(--red-500)">❌ Lỗi kết nối khi nạp tài liệu tri thức.</p>';
  }
}

// ─── Tự động điền Hồ sơ cá nhân (Auto-fill profile) ───
function autoFillProfile() {
  const editor = document.getElementById('editor');
  if (!editor) return;
  
  const profile = window.currentUserProfile;
  if (!profile) {
    alert('Không tìm thấy thông tin tài khoản của bạn.');
    return;
  }
  
  let html = editor.innerHTML;
  let count = 0;
  
  // Define mapping of regex pattern to replace empty dots/lines after target keywords
  const replacements = [
    { key: 'Tôi tên là', value: profile.fullName },
    { key: 'Họ tên', value: profile.fullName },
    { key: 'Họ và tên', value: profile.fullName },
    { key: 'Chức vụ', value: profile.title },
    { key: 'Chức danh', value: profile.title },
    { key: 'Phòng/Ban', value: profile.department },
    { key: 'Phòng ban', value: profile.department },
    { key: 'Bộ phận', value: profile.department },
    { key: 'Số điện thoại', value: profile.phoneNumber },
    { key: 'Điện thoại', value: profile.phoneNumber },
    { key: 'SĐT', value: profile.phoneNumber },
    { key: 'Email', value: profile.email },
    { key: 'Ngày sinh', value: profile.birthDate },
    { key: 'Sinh ngày', value: profile.birthDate }
  ];
  
  replacements.forEach(r => {
    if (!r.value) return;
    
    // 1. Escape key to support any sequence of spaces, &nbsp;, or \u00a0 in the label
    const escapedKey = r.key.replace(/\s+/g, '(?:\\s|&nbsp;|\\u00a0)+');
    
    // 2. Build safe dots group that only matches specific safe inline styling tags or dots/spaces/nbsp
    const inlineTagsPattern = '<\\/?(?:strong|span|em|b|i|u|s|strike|font|br)\\b[^>]*>';
    const dotsAndSpacesPattern = '[\\.\\_\\-\\s]|\\u2026|&nbsp;|\\u00a0';
    
    // Combine them inside a group matching 1 or more characters
    const dotsGroup = `(?:${inlineTagsPattern}|${dotsAndSpacesPattern})+`;
    
    // Pattern to match key (with flexible spaces), optional spaces/colons/spaces, followed by the dots group
    const pattern = new RegExp(`(${escapedKey}(?:\\s|&nbsp;|\\u00a0)*[:：](?:\\s|&nbsp;|\\u00a0)*)(${dotsGroup})`, 'gi');
    
    html = html.replace(pattern, (match, p1, p2) => {
      const dotCount = (p2.match(/[\.\_\-\u2026]/g) || []).length;
      if (dotCount >= 3) {
        count++;
        return `${p1}<strong>${r.value}</strong>`;
      }
      return match;
    });
  });
  
  if (count > 0) {
    editor.innerHTML = html;
    updateWordCount();
    triggerSave();
    
    // Toast notification
    const toast = document.createElement('div');
    toast.style = `
      position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
      background: #10b981; color: white; padding: 10px 22px; border-radius: 30px;
      box-shadow: var(--shadow-lg); font-family: var(--font-sans);
      font-size: 13px; font-weight: 600; z-index: 99999;
      animation: tooltipFadeIn 0.3s;
    `;
    toast.innerHTML = `<span>👤 Đã tự động điền thành công <strong>${count} trường thông tin</strong> của bạn!</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  } else {
    alert('Không tìm thấy trường thông tin trống nào phù hợp để điền trong văn bản này.');
  }
}

