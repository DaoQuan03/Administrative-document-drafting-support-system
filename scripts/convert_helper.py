# -*- coding: utf-8 -*-
"""
Module: convert_helper.py
Description: Script phụ để thực hiện chuyển đổi định dạng (.doc -> .docx và .xls -> .xlsx) 
qua cổng COM của MS Word/Excel.
Được chạy dưới dạng Subprocess độc lập từ Pipeline chính để đảm bảo:
- Nếu MS Word/Excel bị treo hoặc crash, luồng chính vẫn không bị ảnh hưởng.
- Dễ dàng kiểm soát Timeout và tự động tắt tiến trình bị đơ.
Tác giả: Antigravity AI
"""

import sys
import os
import win32com.client as win32


def convert_doc_to_docx(doc_path, docx_path):
    """Chuyển đổi file .doc sang .docx sử dụng MS Word COM"""
    word = None
    doc = None
    try:
        # Khởi tạo hoặc kết nối COM ẩn
        word = win32.Dispatch('Word.Application')
        word.Visible = False
        word.DisplayAlerts = 0  # wdAlertsNone = 0 (Tắt tất cả hộp thoại cảnh báo)
        
        # Mở file .doc ở chế độ ReadOnly, không hiển thị hộp thoại chuyển đổi
        doc = word.Documents.Open(
            doc_path, 
            ConfirmConversions=False, 
            ReadOnly=True, 
            AddToRecentFiles=False
        )
        
        # Lưu dưới dạng .docx (FileFormat=16)
        doc.SaveAs2(docx_path, FileFormat=16)
        return True
    except Exception as e:
        print(f"Lỗi COM Word: {e}", file=sys.stderr)
        return False
    finally:
        try:
            if doc:
                doc.Close(SaveChanges=0)  # wdDoNotSaveChanges = 0
        except Exception:
            pass
        try:
            if word:
                word.Quit()
        except Exception:
            pass


def convert_xls_to_xlsx(xls_path, xlsx_path):
    """Chuyển đổi file .xls sang .xlsx sử dụng MS Excel COM"""
    excel = None
    wb = None
    try:
        # Khởi tạo hoặc kết nối COM ẩn
        excel = win32.Dispatch('Excel.Application')
        excel.Visible = False
        excel.DisplayAlerts = False  # Tắt tất cả cảnh báo
        
        # Mở file .xls ở chế độ ReadOnly, không cập nhật liên kết ngoài
        wb = excel.Workbooks.Open(
            xls_path, 
            ReadOnly=True, 
            UpdateLinks=False
        )
        
        # Lưu dưới dạng .xlsx (FileFormat=51)
        wb.SaveAs(xlsx_path, FileFormat=51)
        return True
    except Exception as e:
        print(f"Lỗi COM Excel: {e}", file=sys.stderr)
        return False
    finally:
        try:
            if wb:
                wb.Close(SaveChanges=False)
        except Exception:
            pass
        try:
            if excel:
                excel.Quit()
        except Exception:
            pass


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Sử dụng: convert_helper.py [input_path] [output_path]", file=sys.stderr)
        sys.exit(1)
        
    input_path = os.path.abspath(sys.argv[1])
    output_path = os.path.abspath(sys.argv[2])
    
    ext = os.path.splitext(input_path)[1].lower()
    
    # Tạo thư mục đích nếu chưa có
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    if ext == ".doc":
        success = convert_doc_to_docx(input_path, output_path)
    elif ext == ".xls":
        success = convert_xls_to_xlsx(input_path, output_path)
    else:
        print(f"Định dạng không hỗ trợ: {ext}", file=sys.stderr)
        sys.exit(2)
        
    sys.exit(0 if success else 3)
