/* ===== EDITOR.JS ===== */

// ─── Auto-save ───
let saveTimer = null;
let wordCountTimer = null;

function onEditorInput() {
  const status = document.getElementById('save-status');
  if (status) { status.textContent = 'Đang lưu...'; status.className = 'save-status saving'; }

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (status) { status.textContent = '✓ Đã lưu'; status.className = 'save-status'; }
  }, 1500);

  clearTimeout(wordCountTimer);
  wordCountTimer = setTimeout(updateWordCount, 300);
}

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

// ─── Keyboard shortcuts ───
function onEditorKeydown(e) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'b') { e.preventDefault(); fmt('bold'); }
    if (e.key === 'i') { e.preventDefault(); fmt('italic'); }
    if (e.key === 'u') { e.preventDefault(); fmt('underline'); }
    if (e.key === 's') { e.preventDefault(); triggerSave(); }
  }
}

function triggerSave() {
  const status = document.getElementById('save-status');
  if (status) { status.textContent = 'Đang lưu...'; status.className = 'save-status saving'; }
  setTimeout(() => {
    if (status) { status.textContent = '✓ Đã lưu'; status.className = 'save-status'; }
  }, 600);
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
  ['rag','chat','settings'].forEach(id => {
    const el = document.getElementById('tab-' + id);
    if (el) el.style.display = id === tab ? 'flex' : 'none';
  });
}

// ─── AI actions ───
const AI_SAMPLES = {
  write: 'Bên cạnh đó, đơn vị đã triển khai hiệu quả nhiều chương trình cải cách hành chính, đặc biệt là việc số hóa toàn bộ quy trình tiếp nhận và trả kết quả hồ sơ. Điều này giúp rút ngắn thời gian xử lý trung bình từ 7 ngày xuống còn 4,5 ngày làm việc, đồng thời nâng cao sự hài lòng của người dân lên mức 92,4% theo khảo sát tháng 6/2025.',
  improve: 'Trong Quý II năm 2025, đơn vị đã hoàn thành xuất sắc 95,3% các chỉ tiêu kế hoạch đề ra, vượt mức so với cùng kỳ năm trước. Tổng doanh thu đạt 42,7 tỷ đồng, tương đương mức tăng trưởng 12,4% so với Quý I/2025.',
  summarize: 'Tóm tắt: Báo cáo Q2/2025 ghi nhận kết quả tích cực với 95,3% chỉ tiêu hoàn thành, doanh thu 42,7 tỷ đồng (+12,4%), và 1.842 hồ sơ được giải quyết với tỷ lệ đúng hạn 98,1%. Đề xuất tiếp tục duy trì các biện pháp cải cách trong Q3.',
  translate: 'In Q2 2025, the department successfully completed 95.3% of its planned targets, surpassing the same period last year. Total revenue reached VND 42.7 billion, reflecting a 12.4% growth compared to Q1.'
};

function aiAction(type) {
  const sugg = document.getElementById('ai-suggestion');
  const text = document.getElementById('ai-sugg-text');
  if (!sugg || !text) return;

  text.textContent = 'Đang xử lý...';
  sugg.style.display = 'block';
  sugg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Simulate streaming
  setTimeout(() => {
    const content = AI_SAMPLES[type] || 'Nội dung gợi ý từ AI dựa trên kho tri thức...';
    typeText(text, content, 0);
  }, 800);
}

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

// ─── Emoji picker (simple) ───
const EMOJIS = ['📋','📄','📊','📝','📑','🗂️','📁','🗃️','💼','📌'];
let emojiIndex = 0;
function changeEmoji() {
  emojiIndex = (emojiIndex + 1) % EMOJIS.length;
  document.getElementById('doc-emoji').textContent = EMOJIS[emojiIndex];
}

// ─── Chat ───
function chatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  if (!input || !messages) return;
  const msg = input.value.trim();
  if (!msg) return;

  // User message
  messages.innerHTML += `<div class="chat-msg user"><div class="chat-bubble">${msg}</div></div>`;
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  // AI response
  setTimeout(() => {
    const responses = [
      'Dựa trên kho tri thức, tôi tìm thấy thông tin liên quan trong **KH-Q2-2025.pdf**. Mục tiêu Q2 là hoàn thành ≥95% chỉ tiêu kế hoạch.',
      'Theo Quyết định phân công nhiệm vụ, phòng Hành chính chịu trách nhiệm chính về báo cáo này.',
      'Tôi có thể giúp bạn mở rộng phần III hoặc thêm số liệu cụ thể từ các tài liệu trong kho tri thức.',
    ];
    const r = responses[Math.floor(Math.random() * responses.length)];
    const div = document.createElement('div');
    div.className = 'chat-msg assistant';
    div.innerHTML = `<div class="chat-bubble">${r}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }, 900);
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
  navigator.clipboard.writeText('https://vanbanai.vn/d/abc123').catch(() => {});
  alert('Đã sao chép link!');
}

function exportDoc() {
  alert('Đang xuất tài liệu ra PDF...\n(Tính năng đầy đủ trong phiên bản production)');
}
