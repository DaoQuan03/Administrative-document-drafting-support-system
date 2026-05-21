# -*- coding: utf-8 -*-
"""
Module: chunk_pipeline.py
Description: Script phân đoạn văn bản thông minh (Hybrid Semantic-Aware Structural Chunking).
Hoạt động 100% offline, chống crash tuyệt đối, hỗ trợ checkpoint phục hồi tiến trình,
bảo toàn cấu trúc bảng biểu Markdown và đoạn văn, gắn metadata liên kết lân cận cùng doc_id.
Tác giả: Antigravity AI
"""

import os
import sys
import json
import re
import time
from datetime import datetime

# Cấu hình các thư mục
CLEANED_DIR = "data/cleaned"
CHUNKED_DIR = "data/chunked"

CHECKPOINT_FILE = "logs/chunked_done.txt"
FAILED_FILE = "logs/chunk_failed_files.json"
LOG_FILE = "logs/chunking_log.txt"

# Cấu hình tham số phân đoạn (Ký tự tiếng Việt)
MAX_CHUNK_SIZE = 1000  # Ngưỡng ký tự tối ưu cho 1 chunk (~250 từ)
OVERLAP_SIZE = 200     # Độ gối đầu giữa các chunk lân cận (~50 từ)


def log_message(message):
    """Ghi log ra màn hình console và file log"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_msg = f"[{timestamp}] {message}"
    print(formatted_msg)
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(formatted_msg + "\n")


def load_checkpoints():
    """Tải danh sách các file cleaned đã phân đoạn thành công"""
    if not os.path.exists(CHECKPOINT_FILE):
        return set()
    with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
        return set(f.read().splitlines())


def save_checkpoint(file_rel_path):
    """Lưu vết tệp cleaned đã hoàn thành phân đoạn"""
    os.makedirs(os.path.dirname(CHECKPOINT_FILE), exist_ok=True)
    with open(CHECKPOINT_FILE, "a", encoding="utf-8") as f:
        f.write(file_rel_path + "\n")


def load_failed_files():
    """Tải danh sách file lỗi phân đoạn"""
    if not os.path.exists(FAILED_FILE):
        return {}
    try:
        with open(FAILED_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_failed_file(file_rel_path, error_msg):
    """Lưu tệp bị lỗi phân đoạn và nguyên nhân"""
    failed_dict = load_failed_files()
    failed_dict[file_rel_path] = {
        "error": error_msg,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    os.makedirs(os.path.dirname(FAILED_FILE), exist_ok=True)
    with open(FAILED_FILE, "w", encoding="utf-8") as f:
        json.dump(failed_dict, f, ensure_ascii=False, indent=4)


def clean_id_string(s):
    """Làm sạch chuỗi để sinh ID an toàn"""
    s = re.sub(r'[^a-zA-Z0-9_\-]', '_', s)
    return re.sub(r'_+', '_', s).strip('_')


def split_sentences(text):
    """Tách đoạn văn thành các câu độc lập để cắt nhỏ nếu đoạn quá dài"""
    # Tách câu dựa trên dấu chấm, hỏi, than kèm khoảng trắng
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


def segment_text_hybrid(text, max_size=MAX_CHUNK_SIZE, overlap=OVERLAP_SIZE):
    """
    Thuật toán Hybrid Semantic-Aware Structural Chunking:
    1. Tách văn bản dựa trên ranh giới tự nhiên xuống dòng kép (\n\n) để giữ nguyên vẹn đoạn văn/bảng biểu.
    2. Nếu một đoạn văn/bảng biểu riêng lẻ quá lớn vượt quá max_size, ta chia nhỏ nó theo câu.
    3. Gom các khối nhỏ (blocks) này lại thành từng chunk có độ dài tối ưu, bảo toàn nguyên vẹn block.
    4. Sinh phần trùng lặp (overlap) thông minh ở ranh giới cắt.
    """
    if not text:
        return []

    # Bước 1: Tách theo ranh giới xuống dòng kép tự nhiên
    raw_blocks = text.split("\n\n")
    refined_blocks = []

    # Bước 2: Chuẩn hóa khối. Nếu block đơn lẻ > max_size và không phải bảng Markdown, tách theo câu
    for block in raw_blocks:
        block = block.strip()
        if not block:
            continue
        
        # Nếu block là bảng biểu Markdown, giữ nguyên vẹn block bảng biểu để tránh vỡ cấu trúc
        if block.startswith("|") and len(block) > max_size:
            refined_blocks.append(block)
        elif len(block) > max_size:
            # Tách nhỏ đoạn văn quá dài thành các câu
            sentences = split_sentences(block)
            temp_sub_block = ""
            for sent in sentences:
                if len(temp_sub_block) + len(sent) + 1 <= max_size:
                    temp_sub_block = f"{temp_sub_block} {sent}".strip()
                else:
                    if temp_sub_block:
                        refined_blocks.append(temp_sub_block)
                    if len(sent) > max_size:
                        # Trường hợp câu quá dị biệt (dài hơn max_size), cắt cưỡng bức theo ký tự
                        for i in range(0, len(sent), max_size - 100):
                            refined_blocks.append(sent[i:i + max_size - 100])
                        temp_sub_block = ""
                    else:
                        temp_sub_block = sent
            if temp_sub_block:
                refined_blocks.append(temp_sub_block)
        else:
            refined_blocks.append(block)

    # Bước 3 & 4: Gom blocks thành các chunks và tính toán overlap
    chunks_text = []
    current_chunk_blocks = []
    current_length = 0

    for block in refined_blocks:
        block_len = len(block)
        
        # Nếu thêm block này vào vượt quá giới hạn
        if current_length + block_len + (2 if current_chunk_blocks else 0) > max_size:
            if current_chunk_blocks:
                # Gom chunk hiện tại
                chunk_str = "\n\n".join(current_chunk_blocks)
                chunks_text.append(chunk_str)
                
                # Tính toán overlap cho chunk tiếp theo
                # Lấy văn bản cuối của chunk hiện tại dài tối đa 'overlap' ký tự
                overlap_source = chunk_str[-overlap:] if len(chunk_str) > overlap else chunk_str
                # Tìm ranh giới từ/câu để tránh cắt ngang từ ở đầu chunk sau
                space_idx = overlap_source.find(" ")
                if space_idx != -1:
                    overlap_prefix = overlap_source[space_idx:].strip()
                else:
                    overlap_prefix = overlap_source
                
                current_chunk_blocks = []
                if overlap_prefix:
                    current_chunk_blocks.append(overlap_prefix)
                    current_length = len(overlap_prefix)
                else:
                    current_length = 0
            
            # Thêm block hiện tại
            current_chunk_blocks.append(block)
            current_length += block_len + (2 if current_length > 0 else 0)
        else:
            current_chunk_blocks.append(block)
            current_length += block_len + (2 if current_length > 0 else 0)

    # Gom nốt chunk cuối cùng
    if current_chunk_blocks:
        chunk_str = "\n\n".join(current_chunk_blocks)
        chunks_text.append(chunk_str)

    return chunks_text


def process_clean_file(src_rel_path):
    """
    Đọc tệp JSON sạch, phân đoạn thành các chunks thông minh,
    gắn metadata liên kết lân cận (cùng doc_id) và xuất ra file JSON mới trong data_chunked/.
    """
    src_abs_path = os.path.abspath(src_rel_path)
    file_name = os.path.basename(src_rel_path)
    rel_to_cleaned = os.path.relpath(src_rel_path, CLEANED_DIR)
    folder = os.path.normpath(rel_to_cleaned).split(os.sep)[0]
    base_name, _ = os.path.splitext(file_name)

    # Đọc dữ liệu văn bản sạch đã chuẩn hóa Unicode
    with open(src_abs_path, "r", encoding="utf-8") as f:
        doc_data = json.load(f)

    text_content = doc_data.get("content", "")
    orig_metadata = doc_data.get("metadata", {})

    # Sinh mã doc_id duy nhất và ổn định cho tài liệu gốc
    doc_id = f"{folder}_{clean_id_string(base_name)}"

    # Phân đoạn văn bản sạch bằng thuật toán Hybrid
    chunks_text_list = segment_text_hybrid(text_content, MAX_CHUNK_SIZE, OVERLAP_SIZE)
    total_chunks = len(chunks_text_list)

    chunks_output = []
    
    # Duyệt qua từng chunk để gắn ID lân cận
    for idx, chunk_text in enumerate(chunks_text_list):
        chunk_id = f"{doc_id}_chunk_{idx + 1:04d}"
        
        # Xác định ID của chunk lân cận
        prev_chunk_id = f"{doc_id}_chunk_{idx:04d}" if idx > 0 else None
        next_chunk_id = f"{doc_id}_chunk_{idx + 2:04d}" if idx < total_chunks - 1 else None

        chunk_data = {
            "chunk_id": chunk_id,
            "doc_id": doc_id,
            "text": chunk_text,
            "metadata": {
                "chunk_index": idx + 1,
                "total_chunks": total_chunks,
                "prev_chunk_id": prev_chunk_id,
                "next_chunk_id": next_chunk_id,
                "char_count": len(chunk_text),
                # Kế thừa siêu dữ liệu quản lý gốc của tài liệu
                "source_file": orig_metadata.get("source_file"),
                "file_name": orig_metadata.get("file_name"),
                "folder": orig_metadata.get("folder"),
                "original_extension": orig_metadata.get("original_extension"),
                "cleaned_at": orig_metadata.get("cleaned_at"),
                "chunked_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
            }
        }
        chunks_output.append(chunk_data)

    # Đường dẫn xuất file JSON kết quả phân đoạn
    dest_rel_path = os.path.join(CHUNKED_DIR, folder, f"{base_name}_chunks.json")
    dest_abs_path = os.path.abspath(dest_rel_path)
    os.makedirs(os.path.dirname(dest_abs_path), exist_ok=True)

    # Lưu tệp JSON phân đoạn chi tiết
    with open(dest_abs_path, "w", encoding="utf-8") as f:
        json.dump(chunks_output, f, ensure_ascii=False, indent=4)

    return total_chunks, dest_rel_path


def main():
    log_message("=== KHỞI ĐỘNG PIPELINE PHÂN ĐOẠN VĂN BẢN THÔNG MINH (HYBRID CHUNKER) ===")
    
    # 1. Thu thập toàn bộ danh sách tệp sạch (.json) trong data_cleaned/
    all_cleaned_files = []
    if not os.path.exists(CLEANED_DIR):
        log_message(f"Lỗi: Thư mục dữ liệu sạch '{CLEANED_DIR}' không tồn tại. Hãy chạy clean_pipeline.py trước!")
        sys.exit(1)

    for root, dirs, files in os.walk(CLEANED_DIR):
        for file in files:
            if file.endswith(".json"):
                all_cleaned_files.append(os.path.join(root, file))

    total_files = len(all_cleaned_files)
    log_message(f"Tìm thấy tổng cộng: {total_files} file văn bản sạch cần phân đoạn.")

    # 2. Checkpoint resume
    done_set = load_checkpoints()
    files_to_process = [f for f in all_cleaned_files if f not in done_set]
    already_done = len(done_set)
    log_message(f"Tiến trình Checkpoint: Đã phân đoạn xong {already_done}/{total_files} file. Còn lại {len(files_to_process)} file cần xử lý.")

    if not files_to_process:
        log_message("Tuyệt vời! Toàn bộ tệp tin sạch đã được phân đoạn hoàn tất.")
        return

    success_count = 0
    error_count = 0
    total_generated_chunks = 0
    start_time = time.time()

    # 3. Tiến hành phân đoạn
    for index, file_path in enumerate(files_to_process):
        try:
            num_chunks, dest_path = process_clean_file(file_path)
            
            # Ghi checkpoint thành công
            save_checkpoint(file_path)
            success_count += 1
            total_generated_chunks += num_chunks
            
            # Log thông tin nhanh (để tránh tràn console, in log định kỳ hoặc nhanh gọn)
            if index < 10 or (index + 1) % 100 == 0 or (index + 1) == len(files_to_process):
                log_message(f"[{index + 1}/{len(files_to_process)}] Đã phân đoạn: {file_path} -> {num_chunks} chunks.")
            
        except Exception as e:
            error_count += 1
            error_str = str(e)
            log_message(f" -> [THẤT BẠI] Lỗi phân đoạn tại file {file_path}: {error_str}")
            save_failed_file(file_path, error_str)

    # 4. Tổng kết
    elapsed_time = time.time() - start_time
    log_message("=== TỔNG KẾT QUY TRÌNH PHÂN ĐOẠN (CHUNKING COMPLETE) ===")
    log_message(f"Thành công: {success_count} file JSON")
    log_message(f"Thất bại: {error_count} file (Chi tiết lỗi tại {FAILED_FILE})")
    log_message(f"Tổng số chunks đã được sinh ra: {total_generated_chunks} chunks")
    log_message(f"Thời gian thực hiện: {elapsed_time:.2f} giây (~{elapsed_time/60:.2f} phút)")


if __name__ == "__main__":
    main()
