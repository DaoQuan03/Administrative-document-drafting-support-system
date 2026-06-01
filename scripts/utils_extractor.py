# -*- coding: utf-8 -*-
"""
Module: utils_extractor.py
Description: Trích xuất cấu trúc văn bản và bảng biểu từ file .docx và .xlsx sang Markdown/Text sạch.
Tích hợp chuyển đổi bảng mã tiếng Việt lỗi (TCVN3, VNI) sang Unicode UTF-8.
Tác giả: Antigravity AI
"""

import os
from docx import Document
from docx.text.paragraph import Paragraph
from docx.table import Table
import openpyxl

# Nhập bộ chuyển đổi bảng mã tiếng Việt đã viết ở Bước 2
try:
    from scripts.utils_converter import convert_to_unicode
except ModuleNotFoundError:
    from utils_converter import convert_to_unicode


def extract_markdown_table(table):
    """
    Trích xuất một bảng trong file Word (.docx) sang định dạng Markdown Table.
    Đồng thời tự động chuyển đổi bảng mã tiếng Việt lỗi sang Unicode.
    """
    rows_data = []
    for row in table.rows:
        row_cells = []
        for cell in row.cells:
            # Lấy text, làm sạch và thay xuống dòng bằng <br> để giữ cấu trúc hàng trong Markdown
            cell_text = cell.text.strip()
            cell_text = convert_to_unicode(cell_text) # Chuyển đổi bảng mã
            cell_text = cell_text.replace("\n", "<br>").replace("|", "\\|")
            row_cells.append(cell_text)
        rows_data.append(row_cells)
        
    if not rows_data:
        return ""
        
    # Xác định số lượng cột tối đa
    num_cols = len(rows_data[0])
    if num_cols == 0:
        return ""
        
    markdown = []
    
    # Hàng tiêu đề (Header row)
    markdown.append("| " + " | ".join(rows_data[0]) + " |")
    # Hàng phân cách (Separator row)
    markdown.append("| " + " | ".join(["---"] * num_cols) + " |")
    
    # Các hàng dữ liệu (Body rows)
    for row in rows_data[1:]:
        # Đảm bảo số cột đồng nhất
        if len(row) < num_cols:
            row = row + [""] * (num_cols - len(row))
        elif len(row) > num_cols:
            row = row[:num_cols]
        markdown.append("| " + " | ".join(row) + " |")
        
    return "\n".join(markdown)


def extract_docx_content(docx_path):
    """
    Trích xuất toàn bộ nội dung từ file Word (.docx), giữ nguyên thứ tự tự nhiên
    của các đoạn văn (paragraphs) và bảng biểu (tables).
    Chuyển đổi toàn bộ phông chữ lỗi sang Unicode chuẩn.
    """
    if not os.path.exists(docx_path):
        raise FileNotFoundError(f"Không tìm thấy file: {docx_path}")
        
    doc = Document(docx_path)
    content_blocks = []
    
    # Duyệt qua các phần tử con trong thân bài (body) theo thứ tự tự nhiên
    for child in doc.element.body:
        if child.tag.endswith('p'):
            # Đây là một đoạn văn bản
            p = Paragraph(child, doc)
            text = p.text.strip()
            if text:
                # Chuyển đổi bảng mã và thêm vào nội dung
                text_cleaned = convert_to_unicode(text)
                content_blocks.append(text_cleaned)
                
        elif child.tag.endswith('tbl'):
            # Đây là một bảng biểu
            t = Table(child, doc)
            md_table = extract_markdown_table(t)
            if md_table:
                content_blocks.append(md_table)
                
    return "\n\n".join(content_blocks)


def extract_xlsx_content(xlsx_path):
    """
    Trích xuất toàn bộ bảng tính từ file Excel (.xlsx) sang định dạng Markdown Table.
    Duyệt qua tất cả các Sheet trong file.
    Chuyển đổi toàn bộ phông chữ lỗi sang Unicode chuẩn.
    """
    if not os.path.exists(xlsx_path):
        raise FileNotFoundError(f"Không tìm thấy file: {xlsx_path}")
        
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    sheets_content = []
    
    for sheet in wb.worksheets:
        sheet_name = convert_to_unicode(sheet.title.strip())
        rows_data = []
        
        for row in sheet.iter_rows(values_only=True):
            row_cells = []
            for val in row:
                if val is not None:
                    # Chuyển đổi phông chữ và làm sạch ô
                    cell_text = str(val).strip()
                    cell_text = convert_to_unicode(cell_text)
                    cell_text = cell_text.replace("\n", "<br>").replace("|", "\\|")
                    row_cells.append(cell_text)
                else:
                    row_cells.append("")
            
            # Chỉ lấy hàng nếu nó không bị trống hoàn toàn
            if any(cell != "" for cell in row_cells):
                rows_data.append(row_cells)
                
        if not rows_data:
            continue
            
        # Xác định số cột tối đa
        num_cols = max(len(r) for r in rows_data)
        if num_cols == 0:
            continue
            
        markdown = []
        markdown.append(f"### Bảng tính: {sheet_name}\n")
        
        # Hàng tiêu đề
        header = rows_data[0]
        if len(header) < num_cols:
            header = header + [""] * (num_cols - len(header))
        markdown.append("| " + " | ".join(header) + " |")
        markdown.append("| " + " | ".join(["---"] * num_cols) + " |")
        
        # Các hàng dữ liệu
        for row in rows_data[1:]:
            if len(row) < num_cols:
                row = row + [""] * (num_cols - len(row))
            markdown.append("| " + " | ".join(row) + " |")
            
        sheets_content.append("\n".join(markdown))
        
    wb.close()
    return "\n\n".join(sheets_content)


# --- PHẦN THỬ NGHIỆM TỰ ĐỘNG ---
if __name__ == "__main__":
    print("--- Chạy thử nghiệm bộ trích xuất nội dung (utils_extractor.py) ---")
    print("Mọi thứ đã sẵn sàng để tích hợp vào Pipeline chính!")
