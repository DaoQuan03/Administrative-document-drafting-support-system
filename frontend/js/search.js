/* ===== SEARCH.JS ===== */

const MOCK_ANSWERS = {
  default: 'Theo các văn bản trong kho tri thức, quy trình phê duyệt văn bản hành chính tại UBND Quận 1 bao gồm **4 bước chính**: (1) Cán bộ soạn thảo dự thảo văn bản theo đúng thể thức; (2) Trưởng phòng chuyên môn kiểm tra nội dung và ký nháy; (3) Chánh văn phòng thẩm định thể thức trình ký; (4) Lãnh đạo có thẩm quyền ký ban hành. Thời gian xử lý tối đa là **5 ngày làm việc** đối với văn bản thông thường.',
  khoach: 'Theo Kế hoạch số 142/KH-UBND, chỉ tiêu Quý II/2025 bao gồm: tổng doanh thu đạt **42–45 tỷ đồng**, giải quyết **≥1.800 hồ sơ**, tỷ lệ đúng hạn **≥97%**, và chỉ số hài lòng người dân **≥90%**.',
  mau: 'Biểu mẫu công văn hành chính chuẩn theo Nghị định 30/2020/NĐ-CP bao gồm: Quốc hiệu, tiêu ngữ; Tên cơ quan ban hành; Số hiệu văn bản; Địa danh, ngày tháng; Tên loại và trích yếu; Nội dung; Quyền hạn, chức vụ người ký; Nơi nhận.',
};

const MOCK_SOURCES = [
  { badge: 'badge-blue', type: 'PDF', name: 'QC-lam-viec-2025.pdf · tr.12', score: '96%', text: '...quy trình phê duyệt văn bản thực hiện theo Quyết định số 15/QĐ-UBND ngày 10/01/2025...' },
  { badge: 'badge-gray', type: 'DOCX', name: 'Huong-dan-soan-thao.docx', score: '91%', text: '...thể thức và kỹ thuật trình bày văn bản hành chính theo Nghị định 30/2020/NĐ-CP...' },
  { badge: 'badge-blue', type: 'PDF', name: 'NQ-18-HDND.pdf · tr.3', score: '87%', text: '...thẩm quyền ký ban hành văn bản thuộc từng cấp lãnh đạo được quy định tại Điều 5...' },
  { badge: 'badge-amber', type: 'URL', name: 'portal.gov.vn', score: '82%', text: '...hướng dẫn cập nhật về cải cách hành chính và số hóa quy trình xử lý văn bản...' },
];

function doSearch() {
  const q = document.getElementById('search-input').value.trim();
  if (!q) return;
  showResults(q);
}

function loadHistory(q) {
  document.getElementById('search-input').value = q;
  showResults(q);
}

function showResults(q) {
  document.getElementById('search-hero').style.display = 'none';
  const resultsEl = document.getElementById('search-results');
  resultsEl.style.display = 'block';
  document.getElementById('results-query').textContent = `"${q}"`;

  // AI answer
  const answerEl = document.getElementById('ai-answer-body');
  answerEl.innerHTML = '';
  const key = q.includes('kế hoạch') || q.includes('Q2') ? 'khoach' : q.includes('mẫu') || q.includes('công văn') ? 'mau' : 'default';
  const text = MOCK_ANSWERS[key];
  typeAnswer(answerEl, text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'), 0);

  // Sources pills
  const srcEl = document.getElementById('ai-answer-sources');
  srcEl.innerHTML = MOCK_SOURCES.slice(0,3).map(s =>
    `<span class="rag-source">📄 ${s.name.split('·')[0].trim()}</span>`
  ).join('');

  // Chunks
  const grid = document.getElementById('chunks-grid');
  grid.innerHTML = MOCK_SOURCES.map(s => `
    <div class="chunk-card">
      <div class="chunk-card-header">
        <span class="badge ${s.badge}">${s.type}</span>
        <span class="chunk-filename">${s.name}</span>
        <span class="chunk-score">${s.score}</span>
      </div>
      <p class="chunk-text">${s.text}</p>
    </div>
  `).join('');
}

function typeAnswer(el, html, i) {
  const stripped = html.replace(/<[^>]+>/g, '');
  let raw = 0, display = 0;
  const result = [];
  for (let j = 0; j < html.length; j++) {
    if (html[j] === '<') {
      while (j < html.length && html[j] !== '>') j++;
    }
    result.push(html.slice(0, j+1));
  }
  let step = 0;
  const timer = setInterval(() => {
    step = Math.min(step + 4, html.length);
    el.innerHTML = html.slice(0, step) + (step < html.length ? '<span class="cursor"></span>' : '');
    if (step >= html.length) clearInterval(timer);
  }, 16);
}

function clearSearch() {
  document.getElementById('search-results').style.display = 'none';
  document.getElementById('search-hero').style.display = 'block';
  document.getElementById('search-input').value = '';
  document.getElementById('search-input').focus();
}

function copyAnswer() {
  const text = document.getElementById('ai-answer-body').textContent;
  navigator.clipboard.writeText(text).catch(()=>{});
  alert('Đã sao chép câu trả lời!');
}

function rate(val) {
  alert(val ? 'Cảm ơn phản hồi tích cực!' : 'Cảm ơn! Chúng tôi sẽ cải thiện kết quả.');
}
