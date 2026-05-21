# -*- coding: utf-8 -*-
"""
Module: clean_pipeline.py
Description: Pipeline chính thực hiện quét, chuyển đổi định dạng, trích xuất 
và làm sạch toàn bộ 6.600+ văn bản pháp luật của dự án.
Thiết kế bền bỉ: Chống đơ, chống crash, tự giải thoát khi treo Office, 
checkpointing cho phép dừng/chạy tiếp tục, xuất file JSON kèm siêu dữ liệu (metadata).
Tác giả: Antigravity AI
"""

import os
import sys
import json
import time
import subprocess
import shutil
import re
from datetime import datetime

# Nhập các module tiện ích đã xây dựng
from utils_extractor import extract_docx_content, extract_xlsx_content

# Cấu hình các thư mục
SOURCE_FOLDERS = [
    "data/raw/totrinh", "data/raw/tokhai", "data/raw/thongbao", 
    "data/raw/mauphieu", "data/raw/maubaocao", "data/raw/Maudon", 
    "data/raw/files"
]
CONVERTED_DIR = "data/converted"
CLEANED_DIR = "data/cleaned"

CHECKPOINT_FILE = "logs/cleaned_done.txt"
FAILED_FILE = "logs/failed_files.json"
LOG_FILE = "logs/cleaning_log.txt"

# Cấu hình giới hạn thời gian xử lý 1 file (giây) để chống treo
TIMEOUT_SECONDS = 20
BATCH_SIZE_RESET = 50  # Reset tiến trình Office sau mỗi 50 file để giải phóng RAM


def log_message(message):
    """Ghi log ra màn hình console và file log"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_msg = f"[{timestamp}] {message}"
    print(formatted_msg)
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(formatted_msg + "\n")


def force_kill_office_processes(extension=None):
    """Cưỡng bức tắt các tiến trình MS Word hoặc MS Excel bị đơ"""
    try:
        if extension is None or extension.lower() in [".doc", ".docx"]:
            # log_message("Cưỡng bức dọn dẹp các tiến trình Word chạy ngầm...")
            subprocess.run(["taskkill", "/f", "/im", "WINWORD.EXE"], capture_output=True)
        if extension is None or extension.lower() in [".xls", ".xlsx"]:
            # log_message("Cưỡng bức dọn dẹp các tiến trình Excel chạy ngầm...")
            subprocess.run(["taskkill", "/f", "/im", "EXCEL.EXE"], capture_output=True)
    except Exception as e:
        log_message(f"Không thể tắt tiến trình Office: {e}")


def load_checkpoints():
    """Tải danh sách các file đã xử lý thành công để tránh làm lại"""
    if not os.path.exists(CHECKPOINT_FILE):
        return set()
    with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
        return set(f.read().splitlines())


def save_checkpoint(file_rel_path):
    """Lưu tệp đã hoàn thành vào checkpoint"""
    os.makedirs(os.path.dirname(CHECKPOINT_FILE), exist_ok=True)
    with open(CHECKPOINT_FILE, "a", encoding="utf-8") as f:
        f.write(file_rel_path + "\n")


def load_failed_files():
    """Tải danh sách các file bị lỗi"""
    if not os.path.exists(FAILED_FILE):
        return {}
    try:
        with open(FAILED_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_failed_file(file_rel_path, error_msg):
    """Lưu vết file bị lỗi và nguyên nhân"""
    failed_dict = load_failed_files()
    failed_dict[file_rel_path] = {
        "error": error_msg,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    os.makedirs(os.path.dirname(FAILED_FILE), exist_ok=True)
    with open(FAILED_FILE, "w", encoding="utf-8") as f:
        json.dump(failed_dict, f, ensure_ascii=False, indent=4)


def clean_text(text):
    """
    Hàm làm sạch văn bản thô đặc thù cho tài liệu pháp luật:
    1. Loại bỏ quảng cáo từ thuvienphapluat.vn (Website, Hotline, Bản quyền)
    2. Thu gọn dải dấu chấm điền thông tin dài (placeholders) để tiết kiệm token
    3. Chuẩn hóa khoảng trắng và dấu xuống dòng thừa
    """
    if not text:
        return ""
    
    # 1. Loại bỏ các dòng chứa quảng cáo/thông tin liên hệ của nguồn cào
    ads_patterns = [
        r"(?i)thuvienphapluat\.vn",
        r"(?i)thư viện pháp luật",
        r"(?i)hotline:\s*028\.\d{4}\.\d{4}",
        r"(?i)website:\s*thuvienphapluat\.vn",
        r"(?i)chỉ\s+dùng\s+cho\s+mục\s+đích\s+tra\s+cứu",
        r"(?i)tải\s+từ\s+Thư\s+Viện\s+Pháp\s+Luật",
        r"(?i)bản\s+quyền\s+thuộc\s+về\s+Thư\s+Viện\s+Pháp\s+Luật",
        r"(?i)email:\s*info\s*@\s*thuvienphapluat\.vn"
    ]
    
    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        is_ad = False
        for pat in ads_patterns:
            if re.search(pat, line):
                is_ad = True
                break
        if not is_ad:
            cleaned_lines.append(line)
            
    cleaned_text = "\n".join(cleaned_lines)
    
    # 2. Thu gọn dấu chấm placeholders (từ 4 dấu chấm/gạch ngang liên tục -> 3 dấu)
    cleaned_text = re.sub(r'\.{4,}', '...', cleaned_text)
    cleaned_text = re.sub(r'_{4,}', '___', cleaned_text)
    
    # 3. Chuẩn hóa khoảng trắng thừa cuối dòng và dòng trống liên tiếp
    # Cắt khoảng trắng thừa ở cuối mỗi dòng
    cleaned_text = "\n".join(line.rstrip() for line in cleaned_text.split("\n"))
    # Thay thế cụm xuống dòng liên tục (3 trở lên) thành tối đa 2 dòng trống (\n\n)
    cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
    
    return cleaned_text.strip()


def run_single_conversion(src_abs_path, dest_abs_path, ext):
    """
    Chạy chuyển đổi file đơn lẻ thông qua Subprocess gọi convert_helper.py.
    Áp dụng giới hạn thời gian (TIMEOUT_SECONDS).
    Nếu quá thời gian, tiến trình Word/Excel sẽ bị cưỡng bức tắt để giải cứu hệ thống.
    """
    helper_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "convert_helper.py")
    cmd = [sys.executable, helper_path, src_abs_path, dest_abs_path]
    try:
        # Chạy subprocess và giới hạn thời gian timeout
        result = subprocess.run(
            cmd, 
            timeout=TIMEOUT_SECONDS, 
            capture_output=True, 
            text=True, 
            encoding="utf-8"
        )
        if result.returncode == 0:
            return True
        else:
            err_msg = result.stderr.strip() if result.stderr else "Lỗi không xác định trong convert_helper."
            raise Exception(f"Chuyển đổi thất bại (Mã lỗi: {result.returncode}): {err_msg}")
            
    except subprocess.TimeoutExpired:
        # Xử lý sự cố treo: Word/Excel bị đơ không phản hồi
        log_message(f"[CẢNH BÁO TIMEOUT] Phát hiện tiến trình bị treo khi xử lý: {os.path.basename(src_abs_path)}")
        # Cưỡng bức tắt Word/Excel ngay lập tức để giải phóng tài nguyên
        force_kill_office_processes(ext)
        raise TimeoutError(f"Tiến trình bị treo và vượt quá {TIMEOUT_SECONDS} giây.")
        
    except Exception as e:
        raise e


def process_file(src_rel_path):
    """
    Quy trình xử lý một tệp tin:
    1. Xác định loại tệp và đường dẫn tương ứng
    2. Chuyển đổi sang .docx/.xlsx nếu là .doc/.xls (có cơ chế Subprocess Timeout)
    3. Trích xuất text sạch và bảng biểu Markdown
    4. Làm sạch văn bản (Ads, Placeholders...)
    5. Lưu kết quả thành JSON kèm siêu dữ liệu
    """
    src_abs_path = os.path.abspath(src_rel_path)
    file_name = os.path.basename(src_rel_path)
    rel_to_raw = os.path.relpath(src_rel_path, "data/raw")
    folder = os.path.normpath(rel_to_raw).split(os.sep)[0]
    base_name, ext = os.path.splitext(file_name)
    ext = ext.lower()
    
    # 1. Xác định đường dẫn file chuyển đổi trung gian và file JSON đích
    if ext in [".doc", ".docx"]:
        converted_ext = ".docx"
    elif ext in [".xls", ".xlsx"]:
        converted_ext = ".xlsx"
    else:
        raise ValueError(f"Định dạng tệp không được hỗ trợ: {ext}")
        
    converted_rel_path = os.path.join(CONVERTED_DIR, folder, base_name + converted_ext)
    converted_abs_path = os.path.abspath(converted_rel_path)
    
    cleaned_rel_path = os.path.join(CLEANED_DIR, folder, base_name + ".json")
    cleaned_abs_path = os.path.abspath(cleaned_rel_path)
    
    os.makedirs(os.path.dirname(converted_abs_path), exist_ok=True)
    os.makedirs(os.path.dirname(cleaned_abs_path), exist_ok=True)
    
    # 2. Thực hiện chuyển đổi nếu là file định dạng cũ (.doc, .xls)
    if ext in [".doc", ".xls"]:
        # Chạy chuyển đổi thông qua helper an toàn chống treo
        run_single_conversion(src_abs_path, converted_abs_path, ext)
    else:
        # Nếu đã là file định dạng mới (.docx, .xlsx), chỉ cần copy sang thư mục converted
        shutil.copy2(src_abs_path, converted_abs_path)
        
    # 3 & 4. Trích xuất cấu trúc văn bản và bảng biểu + làm sạch
    if converted_ext == ".docx":
        raw_text = extract_docx_content(converted_abs_path)
    else:  # .xlsx
        raw_text = extract_xlsx_content(converted_abs_path)
        
    cleaned_text = clean_text(raw_text)
    
    # 5. Đóng gói JSON kèm metadata
    document_data = {
        "content": cleaned_text,
        "metadata": {
            "source_file": src_rel_path.replace(os.sep, "/"),
            "file_name": file_name,
            "folder": folder,
            "original_extension": ext,
            "cleaned_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        }
    }
    
    # Lưu file JSON dạng UTF-8 đẹp đẽ
    with open(cleaned_abs_path, "w", encoding="utf-8") as f:
        json.dump(document_data, f, ensure_ascii=False, indent=4)


def main(max_files_to_process=None):
    """
    Hàm điều khiển toàn bộ Pipeline.
    max_files_to_process: Giới hạn số file xử lý (dùng để Dry-run hoặc test thử nghiệm).
    """
    log_message("=== KHỞI ĐỘNG PIPELINE LÀM SẠCH VÀ TIỀN XỬ LÝ VĂN BẢN HÀNG LOẠT ===")
    
    # 1. Thu thập toàn bộ danh sách tệp nguồn trong dự án
    all_files = []
    for folder in SOURCE_FOLDERS:
        if not os.path.exists(folder):
            continue
        for root, dirs, files in os.walk(folder):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in [".doc", ".docx", ".xls", ".xlsx"]:
                    # Loại bỏ các file tạm của Word (bắt đầu bằng ~$)
                    if not file.startswith("~$"):
                        all_files.append(os.path.join(root, file))
                        
    total_files = len(all_files)
    log_message(f"Tìm thấy tổng cộng: {total_files} file văn bản trong các thư mục nguồn.")
    
    # 2. Tải checkpoints đã hoàn thành
    done_set = load_checkpoints()
    files_to_process = [f for f in all_files if f not in done_set]
    already_done = len(done_set)
    log_message(f"Tiến trình Checkpoint: Đã hoàn thành {already_done}/{total_files} file. Còn lại {len(files_to_process)} file cần xử lý.")
    
    # Nếu giới hạn số file (Dry-run)
    if max_files_to_process is not None:
        files_to_process = files_to_process[:max_files_to_process]
        log_message(f"[DRY-RUN] Giới hạn xử lý thử nghiệm: {len(files_to_process)} file.")
        
    if not files_to_process:
        log_message("Tuyệt vời! Không còn file nào cần xử lý hoặc toàn bộ đã hoàn tất.")
        return
        
    # Đảm bảo tắt mọi tiến trình Office mồ côi trước khi chạy
    force_kill_office_processes()
    
    success_count = 0
    error_count = 0
    start_time = time.time()
    
    # 3. Lặp qua từng file để xử lý
    for index, file_path in enumerate(files_to_process):
        log_message(f"[{index + 1}/{len(files_to_process)}] Đang xử lý: {file_path}")
        
        # Reset tiến trình Office định kỳ để tránh rò rỉ RAM
        if index > 0 and index % BATCH_SIZE_RESET == 0:
            log_message("[COM RESET] Tiến hành dọn dẹp bộ nhớ và giải phóng RAM Office...")
            force_kill_office_processes()
            time.sleep(2)
            
        try:
            # Xử lý tệp đơn lẻ
            process_file(file_path)
            
            # Ghi checkpoint thành công
            save_checkpoint(file_path)
            success_count += 1
            log_message(f" -> THÀNH CÔNG: Đã lưu JSON sạch.")
            
        except Exception as e:
            error_count += 1
            error_str = str(e)
            log_message(f" -> [THẤT BẠI] Lỗi tại file {file_path}: {error_str}")
            save_failed_file(file_path, error_str)
            
            # Nếu gặp lỗi treo nghiêm trọng, cưỡng bức tắt để tiếp tục file tiếp theo
            if "treo" in error_str.lower() or "timeout" in error_str.lower():
                _, ext = os.path.splitext(file_path)
                force_kill_office_processes(ext)
                time.sleep(2)
                
    # 4. Tổng kết
    elapsed_time = time.time() - start_time
    log_message("=== TỔNG KẾT QUY TRÌNH HÀN LOẠT ===")
    log_message(f"Tổng số file đã duyệt: {len(files_to_process)}")
    log_message(f"Thành công: {success_count}")
    log_message(f"Thất bại: {error_count} (Xem chi tiết tại {FAILED_FILE})")
    log_message(f"Thời gian thực hiện: {elapsed_time:.2f} giây (~{elapsed_time/60:.2f} phút)")
    
    # Tắt sạch các tiến trình sau khi chạy xong
    force_kill_office_processes()


if __name__ == "__main__":
    # Nhận tham số dòng lệnh nếu muốn giới hạn số lượng file chạy thử
    max_run = None
    if len(sys.argv) > 1:
        try:
            max_run = int(sys.argv[1])
        except ValueError:
            pass
            
    main(max_run)
