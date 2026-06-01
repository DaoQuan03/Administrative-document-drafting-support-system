/* ===== SEARCH.JS ===== */

// Trạng thái tìm kiếm toàn cục
let originalQuery = '';
let currentTemplateTitle = '';
let currentTemplateContent = '';
let activeSuggestions = [];
let currentSearchMode = 'template'; // Mặc định tìm mẫu văn bản
let lastOpenedDocTitle = '';
let lastOpenedDocHTML = '';


// Hàm chuyển đổi giữa các luồng tìm kiếm (Tab)
function setSearchMode(mode) {
  currentSearchMode = mode;
  
  // Cập nhật trạng thái active trên giao diện
  const tabTemplate = document.getElementById('tab-template');
  const tabLegal = document.getElementById('tab-legal');
  
  if (mode === 'template') {
    tabTemplate.classList.add('active');
    tabLegal.classList.remove('active');
    document.getElementById('search-input').placeholder = "Ví dụ: Tờ trình xin kinh phí, Đơn xin nghỉ phép, Quyết định bổ nhiệm...";
  } else {
    tabTemplate.classList.remove('active');
    tabLegal.classList.add('active');
    document.getElementById('search-input').placeholder = "Ví dụ: Quy định về ký nháy, Thể thức văn bản theo Nghị định 30, Điều 12...";
  }
  
  // Nếu đang hiển thị kết quả, tự động tìm kiếm lại theo luồng mới
  const inputVal = document.getElementById('search-input').value.trim();
  if (inputVal && document.getElementById('search-results').style.display === 'block') {
    executeSearch(inputVal);
  }
}

function doSearch() {
  const q = document.getElementById('search-input').value.trim();
  if (!q) return;
  
  originalQuery = q;
  executeSearch(q);
}

function loadHistory(q) {
  document.getElementById('search-input').value = q;
  originalQuery = q;
  executeSearch(q);
}

async function executeSearch(q) {
  // Ẩn màn hình chào ban đầu và hiển thị khu vực kết quả
  document.getElementById('search-hero').style.display = 'none';
  const resultsEl = document.getElementById('search-results');
  resultsEl.style.display = 'block';
  document.getElementById('results-query').textContent = `"${q}"`;

  // Ẩn tất cả các khu vực kết quả để chuẩn bị tải mới
  document.getElementById('template-suggestions-section').style.display = 'none';
  document.getElementById('template-preview-card').style.display = 'none';
  
  const aiCard = document.querySelector('.ai-answer-card');
  const sourceChunks = document.getElementById('source-chunks');
  aiCard.style.display = 'none';
  sourceChunks.style.display = 'none';

  // Reset grid layout mode
  const gridEl = document.getElementById('chunks-grid');
  if (gridEl) {
    gridEl.classList.remove('laws-list-mode');
  }

  // Hiển thị hộp thoại AI đang suy nghĩ
  aiCard.style.display = 'block';
  const answerEl = document.getElementById('ai-answer-body');
  answerEl.innerHTML = '<div style="display:flex;align-items:center;gap:8px;color:var(--text-secondary);font-size:13.5px;"><svg class="spinner" width="16" height="16" viewBox="0 0 50 50" style="animation:rotate 1.5s linear infinite;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite;"></circle></svg> Trợ lý ảo AI đang kết nối vector DB và tìm kiếm thông tin...</div>';
  
  // Tự động chèn CSS cho vòng xoay loading nếu chưa có
  if (!document.getElementById('spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'spinner-styles';
    style.innerHTML = `
      @keyframes rotate { 100% { transform: rotate(360deg); } }
      @keyframes dash {
        0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
        50% { stroke-dasharray: 89, 200; stroke-dashoffset: -35px; }
        100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124px; }
      }
      .spinner { color: var(--blue-500); }
    `;
    document.head.appendChild(style);
  }

  try {
    const response = await fetch('/api/search/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: q, search_mode: currentSearchMode })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // ==========================================
      // LUỒNG 1: HIỂN THỊ MẪU VĂN BẢN (TEMPLATE)
      // ==========================================
      if (data.search_mode === 'template') {
        // Ẩn hộp thoại câu trả lời AI
        aiCard.style.display = 'none';
        
        // Hiển thị khu vực gợi ý biểu mẫu đa dạng
        const suggestionsSec = document.getElementById('template-suggestions-section');
        suggestionsSec.style.display = 'block';
        
        // Cập nhật tiêu đề gợi ý sinh động
        document.querySelector('#template-suggestions-section h3').innerHTML = '📋 Danh sách 5 Biểu mẫu Hành chính phù hợp nhất';
        document.querySelector('#template-suggestions-section p').textContent = 'Nhấp vào một biểu mẫu để xem trước toàn văn văn bản gốc và bắt đầu soạn thảo tức thì:';
        
        const grid = document.getElementById('template-options-grid');
        const userSection = document.getElementById('user-templates-section');
        const userGrid = document.getElementById('user-template-options-grid');
        
        if (data.templates && data.templates.length > 0) {
          grid.innerHTML = data.templates.map(opt => `
            <div class="template-option-card" onclick="viewFullDocument('${opt.file_name}')">
              <span class="template-option-title">${opt.title}</span>
              <span class="template-option-desc">${opt.snippet || 'Nhấp để xem trước và phục hồi toàn văn tài liệu mẫu hành chính.'}</span>
              <div style="display: flex; gap: 8px; margin-top: auto; border-top: 1px dashed var(--border-subtle); padding-top: 12px; align-items: center;">
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); viewFullDocument('${opt.file_name}')" style="flex: 1; font-size: 11px; padding: 5px 8px; font-weight: 500; height: 28px; line-height: 1;">👁️ Xem chi tiết</button>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); useDirectlyAsTemplate('${opt.file_name}')" style="flex: 1; font-size: 11px; padding: 5px 8px; font-weight: 600; height: 28px; line-height: 1; background: #10b981; border-color: #10b981; color: white;">✏️ Soạn thảo mẫu</button>
              </div>
            </div>
          `).join('');
        } else {
          grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-tertiary);font-size:13px;padding:24px;">Không tìm thấy biểu mẫu hành chính nào phù hợp trong cơ sở dữ liệu tri thức.</div>';
        }
        
        // Render tài liệu/biểu mẫu cá nhân
        if (data.user_templates && data.user_templates.length > 0) {
          userSection.style.display = 'block';
          userGrid.innerHTML = data.user_templates.map(opt => `
            <div class="template-option-card" onclick="viewFullDocument('${opt.file_name}')" style="border: 1px solid rgba(16, 185, 129, 0.15); background: rgba(16, 185, 129, 0.01);">
              <span class="template-option-title" style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:14px;">📂</span> ${opt.title}
              </span>
              <span class="template-option-desc">${opt.snippet || 'Tài liệu cá nhân trong kho tri thức của bạn.'}</span>
              <div style="display: flex; gap: 8px; margin-top: auto; border-top: 1px dashed rgba(16, 185, 129, 0.15); padding-top: 12px; align-items: center;">
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); viewFullDocument('${opt.file_name}')" style="flex: 1; font-size: 11px; padding: 5px 8px; font-weight: 500; height: 28px; line-height: 1;">👁️ Xem chi tiết</button>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); useDirectlyAsTemplate('${opt.file_name}')" style="flex: 1; font-size: 11px; padding: 5px 8px; font-weight: 600; height: 28px; line-height: 1; background: #10b981; border-color: #10b981; color: white;">✏️ Soạn thảo mẫu</button>
              </div>
            </div>
          `).join('');
        } else {
          userSection.style.display = 'none';
          userGrid.innerHTML = '';
        }
        
      } 
      // ==========================================
      // LUỒNG 2: HIỂN THỊ LUẬT & NGHỊ ĐỊNH (LEGAL)
      // ==========================================
      else {
        // Ý định QA: Hiển thị bảng trả lời từ RAG và các đoạn văn tham chiếu
        aiCard.style.display = 'block';
        sourceChunks.style.display = 'block';
        
        // Thay đổi tiêu đề phần tham khảo
        document.querySelector('#source-chunks h3').innerHTML = '⚖️ Top 10 Luật & Nghị định liên quan hàng đầu';
        
        // Hiển thị nguồn dẫn rút gọn dưới câu trả lời AI
        const srcEl = document.getElementById('ai-answer-sources');
        if (data.sources && data.sources.length > 0) {
          srcEl.style.display = 'flex';
          srcEl.innerHTML = data.sources.map(s =>
            `<span class="rag-source" style="cursor:pointer;" onclick="viewFullDocument('${s.file_name}')" title="Xem toàn văn ${s.name}">📄 ${s.name} (${s.score})</span>`
          ).join('');
        } else {
          srcEl.style.display = 'none';
        }

        // Hiển thị chi tiết 10 văn bản luật liên quan dạng trích dẫn pháp lý chuyên nghiệp
        const grid = document.getElementById('chunks-grid');
        if (grid) {
          grid.classList.add('laws-list-mode');
        }
        if (data.laws && data.laws.length > 0) {
          grid.innerHTML = data.laws.map(opt => `
            <div class="chunk-card" onclick="viewFullDocument('${opt.file_name}')" style="display:flex;flex-direction:column;gap:12px;min-height:160px;">
              <div class="chunk-card-header">
                <span class="badge badge-gray">PHÁP LÝ</span>
                <span class="chunk-filename" style="font-weight:600;color:var(--blue-700);font-size:12.5px;">${opt.title}</span>
                <span class="chunk-score">${opt.score}</span>
              </div>
              <div class="chunk-text" style="font-size:12.5px;color:var(--text-secondary);flex:1;line-height:1.6;">
                ${formatLegalCitation(opt)}
              </div>
              <div style="font-size:11.5px;font-weight:600;color:var(--blue-600);display:flex;align-items:center;gap:4px;margin-top:4px;border-top:1px dashed var(--border-subtle);padding-top:6px;">
                👁️ Xem toàn văn văn bản &rarr;
              </div>
            </div>
          `).join('');
        } else {
          grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-tertiary);font-size:13px;padding:24px;">Không tìm thấy văn bản quy phạm pháp luật nào phù hợp.</div>';
        }

        // Tạo hiệu ứng chữ gõ trực quan cho câu trả lời từ AI
        answerEl.innerHTML = '';
        typeAnswer(answerEl, data.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'), 0);
      }
    } else {
      answerEl.innerHTML = renderFriendlyErrorCard(data.error);
    }
  } catch (err) {
    console.error(err);
    answerEl.innerHTML = renderFriendlyErrorCard('Mất kết nối tới máy chủ hoặc dịch vụ AI gặp sự cố. Vui lòng kiểm tra lại đường truyền mạng.');
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
  
  // Xử lý Bold **text**
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Xử lý Italic *text* hoặc _text_
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
  
  return formatted;
}

// Hàm mở Modal xem toàn văn tài liệu từ database
async function viewFullDocument(fileName) {
  if (!fileName) return;
  
  const modal = document.getElementById('document-modal');
  const titleEl = document.getElementById('modal-doc-title');
  const bodyEl = document.getElementById('modal-doc-body');
  
  // Hiển thị modal và trạng thái loading
  modal.style.display = 'flex';
  titleEl.textContent = cleanFileNameForDisplay(fileName);
  bodyEl.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;height:240px;color:var(--text-secondary);font-size:14px;">
      <svg class="spinner" width="24" height="24" viewBox="0 0 50 50" style="animation:rotate 1.5s linear infinite;">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite;"></circle>
      </svg>
      Đang liên kết các mảnh tri thức và tái tạo toàn văn văn bản gốc...
    </div>
  `;
  
  try {
    const response = await fetch('/api/search/get-document/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file_name: fileName })
    });
    
    const data = await response.json();
    
    if (data.success) {
      titleEl.textContent = data.title;
      lastOpenedDocTitle = data.title;
      lastOpenedDocHTML = parseMarkdownToPremiumHTML(data.full_text);
      bodyEl.innerHTML = lastOpenedDocHTML;
      
      const btnUse = document.getElementById('btn-use-doc-template');
      if (btnUse) {
        btnUse.style.display = 'inline-block';
      }
    } else {
      bodyEl.innerHTML = `<div style="color:red;padding:20px;">Lỗi: ${data.error}</div>`;
      const btnUse = document.getElementById('btn-use-doc-template');
      if (btnUse) btnUse.style.display = 'none';
    }

  } catch (err) {
    console.error(err);
    bodyEl.innerHTML = `<div style="color:red;padding:20px;">Không thể kết nối đến máy chủ để giải nén toàn văn tài liệu.</div>`;
  }
}

function closeDocumentModal(event) {
  // Đóng modal khi click ra ngoài hoặc bấm nút X
  if (!event || event.target === document.getElementById('document-modal') || event.target.classList.contains('document-modal-close') || event.target.tagName === 'BUTTON') {
    document.getElementById('document-modal').style.display = 'none';
  }
}

function copyModalContent() {
  const text = document.getElementById('modal-doc-body').textContent;
  navigator.clipboard.writeText(text)
    .then(() => alert('Đã sao chép toàn bộ nội dung văn bản vào bộ nhớ tạm!'))
    .catch(() => alert('Không thể sao chép văn bản. Vui lòng chọn và copy thủ công.'));
}

// Hàm khởi tạo và lưu tài liệu mới trực tiếp từ mẫu văn bản đã tìm thấy
async function useOpenedDocumentAsTemplate() {
  if (!lastOpenedDocTitle || !lastOpenedDocHTML) {
    alert('Không tìm thấy nội dung mẫu văn bản.');
    return;
  }
  
  const btn = document.getElementById('btn-use-doc-template');
  const oldText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Đang tạo bản thảo...';
  
  try {
    const response = await fetch('/api/documents/save/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify({
        title: lastOpenedDocTitle,
        content: lastOpenedDocHTML,
        status: 'DRAFT',
        doc_date: new Date().toISOString().split('T')[0]
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Chuyển hướng người dùng thẳng tới trình soạn thảo hành chính để bắt đầu chỉnh sửa
      window.location.href = `/html/editor.html?id=${data.document_id}`;
    } else {
      alert('Có lỗi xảy ra khi khởi tạo tài liệu từ mẫu: ' + data.error);
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi kết nối mạng khi cố gắng khởi tạo tài liệu mới.');
    btn.disabled = false;
    btn.innerHTML = oldText;
  }
}

// Hàm khởi tạo và lưu tài liệu trực tiếp từ nút "Soạn thảo mẫu" trên Grid gợi ý mà không cần mở modal
async function useDirectlyAsTemplate(fileName) {
  if (!fileName) return;
  
  // Tạo loading overlay mờ ảo (Glassmorphism overlay)
  const body = document.body;
  const loader = document.createElement('div');
  loader.id = 'global-template-loader';
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
    <span>Đang liên kết dữ liệu và thiết lập biểu mẫu soạn thảo...</span>
  `;
  body.appendChild(loader);
  
  try {
    // 1. Tải toàn văn biểu mẫu từ db
    const getResponse = await fetch('/api/search/get-document/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file_name: fileName })
    });
    
    const getData = await getResponse.json();
    
    if (getData.success) {
      const parsedHTML = parseMarkdownToPremiumHTML(getData.full_text);
      
      // 2. Lưu vào danh sách tài liệu mới (Draft)
      const saveResponse = await fetch('/api/documents/save/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
          title: getData.title,
          content: parsedHTML,
          status: 'DRAFT',
          doc_date: new Date().toISOString().split('T')[0]
        })
      });
      
      const saveData = await saveResponse.json();
      
      if (saveData.success) {
        // Chuyển hướng thẳng đến editor
        window.location.href = `/html/editor.html?id=${saveData.document_id}`;
      } else {
        alert('Lỗi tạo biểu mẫu: ' + saveData.error);
        loader.remove();
      }
    } else {
      alert('Lỗi tải văn bản gốc: ' + getData.error);
      loader.remove();
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi kết nối mạng khi tải biểu mẫu.');
    loader.remove();
  }
}

function cleanFileNameForDisplay(filename) {
  if (!filename) return "Tài liệu";
  let title = filename.split('.')[0];
  if (title.endsWith("_chunks")) title = title.substring(0, title.length - 7);
  return title.replace(/[-_]/g, ' ');
}

// ==========================================
// CÁC HÀM CŨ ĐỂ KHÔNG LÀM HỎNG TÍNH NĂNG KHÁC
// ==========================================

async function previewTemplate(cardEl, optionTitle) {
  // Ẩn lưới gợi ý và hiện hộp xem trước live preview
  document.getElementById('template-suggestions-section').style.display = 'none';
  const previewCard = document.getElementById('template-preview-card');
  previewCard.style.display = 'flex';
  
  document.getElementById('preview-title').textContent = `Xem trước biểu mẫu: ${optionTitle}`;
  const bodyEl = document.getElementById('preview-body');
  
  bodyEl.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;height:240px;color:var(--text-secondary);font-size:14px;font-family:var(--font-sans)">
      <svg class="spinner" width="24" height="24" viewBox="0 0 50 50" style="animation:rotate 1.5s linear infinite;">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" style="stroke-dasharray:1,200;stroke-dashoffset:0;stroke-linecap:round;animation:dash 1.5s ease-in-out infinite;"></circle>
      </svg>
      Trợ lý ảo AI đang soạn thảo mẫu tài liệu chuẩn thể thức Nghị định 30...
    </div>
  `;
  
  try {
    const response = await fetch('/api/search/generate-template/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        option_title: optionTitle,
        original_query: originalQuery
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      currentTemplateTitle = data.title;
      currentTemplateContent = data.content;
      bodyEl.innerHTML = data.content;
    } else {
      bodyEl.innerHTML = renderFriendlyErrorCard(data.error);
    }
  } catch (err) {
    console.error(err);
    bodyEl.innerHTML = renderFriendlyErrorCard('Không thể kết nối tới dịch vụ soạn thảo AI. Vui lòng kiểm tra lại đường truyền mạng.');
  }
}

function backToSuggestions() {
  document.getElementById('template-preview-card').style.display = 'none';
  document.getElementById('template-suggestions-section').style.display = 'block';
}

async function useGeneratedTemplate() {
  if (!currentTemplateTitle || !currentTemplateContent) {
    alert('Không tìm thấy nội dung mẫu văn bản.');
    return;
  }
  
  try {
    const response = await fetch('/api/documents/save/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify({
        title: currentTemplateTitle,
        content: currentTemplateContent,
        status: 'DRAFT',
        doc_date: new Date().toISOString().split('T')[0]
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      window.location.href = `/html/editor.html?id=${data.document_id}`;
    } else {
      alert('Có lỗi xảy ra khi tạo văn bản: ' + data.error);
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi kết nối mạng khi cố gắng khởi tạo tài liệu mới.');
  }
}

function typeAnswer(el, html, i) {
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

// Hàm đọc Cookie CSRF
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

// HÀM CHUYỂN ĐỔI LỖI THÀNH THÔNG BÁO THÂN THIỆN
function getFriendlyErrorMessage(errText) {
  if (!errText) return "Đã xảy ra lỗi không xác định.";
  
  const errLower = errText.toLowerCase();
  
  if (errLower.includes('quota exceeded') || errLower.includes('429') || errLower.includes('resourceexhausted') || errLower.includes('rate limit')) {
    return "Dịch vụ AI đang bận do số lượng yêu cầu truy cập vượt quá hạn mức miễn phí tạm thời. Hệ thống đang cố gắng tự động điều tiết kết nối, bạn vui lòng thử lại sau vài giây.";
  }
  if (errLower.includes('charmap') || errLower.includes('codec') || errLower.includes('unicode')) {
    return "Hệ thống gặp sự cố xử lý mã hóa ký tự đặc biệt trên máy chủ Windows. Vui lòng thử lại với từ khóa tìm kiếm ngắn gọn, sử dụng ký tự tiếng Việt chuẩn thông thường.";
  }
  if (errLower.includes('404') || errLower.includes('not found') || errLower.includes('model')) {
    return "Mô hình ngôn ngữ trí tuệ nhân tạo (Gemini) cấu hình trong hệ thống tạm thời không phản hồi hoặc đã bị nhà cung cấp thay đổi. Vui lòng báo cáo quản trị viên để cập nhật cài đặt.";
  }
  if (errLower.includes('api key') || errLower.includes('api_key') || errLower.includes('khóa api')) {
    return "Khóa API của dịch vụ AI bị thiếu hoặc không chính xác. Vui lòng liên hệ với bộ phận kỹ thuật để cấu hình lại.";
  }
  if (errLower.includes('connect') || errLower.includes('mất kết nối') || errLower.includes('network') || errLower.includes('fetch')) {
    return "Đường truyền mạng của bạn hoặc máy chủ AI đang gặp sự cố gián đoạn. Vui lòng kiểm tra lại kết nối Internet và tải lại trang.";
  }
  
  return `Yêu cầu không thể hoàn tất do lỗi kỹ thuật phát sinh từ máy chủ.`;
}

// HÀM HIỂN THỊ THẺ LỖI THÂN THIỆN DẠNG GLASSMORPHISM
function renderFriendlyErrorCard(errText) {
  const friendlyMsg = getFriendlyErrorMessage(errText);
  return `
    <div class="friendly-error-card">
      <div class="friendly-error-header">
        <div class="friendly-error-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="friendly-error-title">
          <h4>Dịch vụ tìm kiếm gặp sự cố gián đoạn</h4>
          <p class="friendly-error-desc">${friendlyMsg}</p>
        </div>
      </div>
      
      <div class="friendly-error-expander" onclick="this.classList.toggle('active')">
        <span class="expander-label">🔍 Xem chi tiết mã lỗi kỹ thuật</span>
        <span class="expander-icon">▼</span>
        <div class="friendly-error-raw">
          <code>${errText}</code>
        </div>
      </div>
    </div>
  `;
}

// Hàm định dạng trích dẫn pháp lý chuyên nghiệp và mượt mà cho thẻ card luật
function formatLegalCitation(opt) {
  let snippet = opt.snippet.trim();
  
  // 1. Dọn sạch các ký tự phân cách bảng thừa hoặc chuỗi chéo trống hay gặp trong biểu mẫu điền
  snippet = snippet.replace(/[\|\\\/_\-\s]{3,}/g, ' '); // Thay thế chuỗi 3 ký tự rác trở lên bằng 1 khoảng trắng
  snippet = snippet.replace(/\s+/g, ' '); // Chuẩn hóa khoảng trắng liên tục
  
  // Dọn sạch dấu ba chấm ở đầu và cuối
  if (snippet.startsWith("...")) snippet = snippet.substring(3);
  if (snippet.endsWith("...")) snippet = snippet.substring(0, snippet.length - 3);
  snippet = snippet.trim();
  
  // Trích xuất "Điều [Số]" để đưa vào câu dẫn dắt
  let articlePart = "";
  const match = snippet.match(/(Điều\s+\d+|điều\s+\d+)/i);
  if (match) {
    articlePart = ` tại <strong>${match[1]}</strong>`;
  }
  
  return `Theo quy định${articlePart} của <strong>${opt.title}</strong>:<br><div style="margin-top:8px; padding-left:12px; border-left:3px solid var(--blue-500); font-family:var(--font-sans); font-size:13.5px; line-height:1.7; color:var(--text-primary); text-align:justify;">"${snippet}"</div>`;
}
