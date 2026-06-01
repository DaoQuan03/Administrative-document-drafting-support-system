import os
import sys
import time
from pathlib import Path

# Thiết lập encoding UTF-8 cho console để hiển thị mượt mà trên Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

import chromadb

# Thư mục Vector DB
DB_PATH = os.path.join(Path(__file__).resolve().parent.parent, "data", "vector_db")

# Định nghĩa hàm nhúng rỗng để khởi chạy ChromaDB siêu tốc
class NoneEmbeddingFunction:
    name = "NoneEmbeddingFunction"
    def name(self) -> str:
        return "NoneEmbeddingFunction"
    def __call__(self, input):
        return []

def draw_progress_bar(percent, width=40):
    """Vẽ thanh tiến trình ASCII tuyệt đẹp"""
    filled_width = int(width * percent / 100)
    bar = "█" * filled_width + "░" * (width - filled_width)
    return f"[{bar}]"

def monitor():
    print("🔍 Đang kết nối tới ChromaDB...")
    try:
        chroma_client = chromadb.PersistentClient(path=DB_PATH)
        collection = chroma_client.get_or_create_collection(
            name="knowledge_base",
            embedding_function=NoneEmbeddingFunction()
        )
    except Exception as e:
        print(f"❌ Không thể kết nối tới ChromaDB: {e}")
        return

    total_chunks = 21919 # Tổng số chunk mục tiêu của dự án
    
    print("\n=======================================================")
    print("📊 BẢNG THEO DÕI TIẾN TRÌNH NHÚNG & LƯU VECTOR CHROMADB 📊")
    print("=======================================================")
    print("Nhấn Ctrl + C để dừng theo dõi bất kỳ lúc nào.\n")
    
    # Biến lưu trữ lịch sử để tính tốc độ
    last_count = collection.count()
    last_time = time.time()
    
    # Danh sách để tính tốc độ trung bình mượt mà (moving average)
    speeds = []
    
    try:
        while True:
            current_time = time.time()
            current_count = collection.count()
            
            # Tính toán tiến độ
            percent = (current_count / total_chunks) * 100
            if percent > 100:
                percent = 100.0
                
            # Tính toán tốc độ (chunks/giây)
            elapsed = current_time - last_time
            diff = current_count - last_count
            
            speed = 0.0
            if elapsed > 0:
                speed = diff / elapsed
                
            # Gom tốc độ vào danh sách để lấy trung bình mượt mà
            if diff > 0 or not speeds:
                speeds.append(speed)
                if len(speeds) > 5:
                    speeds.pop(0)
            
            avg_speed = sum(speeds) / len(speeds) if speeds else 0.0
            
            # Tính thời gian hoàn thành ước tính (ETA)
            remaining_chunks = total_chunks - current_count
            eta_str = "Đang tính..."
            if avg_speed > 0 and remaining_chunks > 0:
                eta_seconds = remaining_chunks / avg_speed
                if eta_seconds > 3600:
                    eta_str = f"{int(eta_seconds // 3600)} giờ {int((eta_seconds % 3600) // 60)} phút"
                elif eta_seconds > 60:
                    eta_str = f"{int(eta_seconds // 60)} phút {int(eta_seconds % 60)} giây"
                else:
                    eta_str = f"{int(eta_seconds)} giây"
            elif remaining_chunks <= 0:
                eta_str = "Đã hoàn thành! 🎉"

            # Di chuyển con trỏ lên đầu và in đè dữ liệu (hiệu ứng Dashboard thời gian thực)
            sys.stdout.write("\033[H\033[J") # Xóa màn hình console
            print("=======================================================")
            print("📊 BẢNG THEO DÕI TIẾN TRÌNH NHÚNG & LƯU VECTOR CHROMADB 📊")
            print("=======================================================")
            print(f"📁 Thư mục DB: {DB_PATH}")
            print(f"🎯 Tổng số chunk mục tiêu: {total_chunks:,} chunks")
            print(f"💾 Số chunk đã lưu hiện tại: {current_count:,} chunks")
            print(f"⏳ Số chunk còn lại: {max(0, remaining_chunks):,} chunks")
            print("-------------------------------------------------------")
            print(f"📈 Tiến độ: {draw_progress_bar(percent)} {percent:.2f}%")
            print("-------------------------------------------------------")
            if current_count < total_chunks:
                print(f"⚡ Tốc độ nhúng hiện tại: {avg_speed:.2f} chunks/giây")
                print(f"⏱️ Thời gian hoàn thành ước tính (ETA): {eta_str}")
            else:
                print("🎉 Trạng thái: Toàn bộ kho tri thức đã được nhúng thành công!")
            print("=======================================================")
            print("👉 Mẹo: Để xem chi tiết log của API Gemini, cậu chạy lệnh:")
            print("   Get-Content -Path [Đường_dẫn_file_log] -Wait -Tail 10")
            print("=======================================================")
            
            # Cập nhật biến lịch sử cho chu kỳ sau
            last_count = current_count
            last_time = current_time
            
            # Nghỉ 3 giây trước khi quét lại
            time.sleep(3)
            
    except KeyboardInterrupt:
        print("\n👋 Đã dừng theo dõi tiến trình.")

if __name__ == "__main__":
    monitor()
