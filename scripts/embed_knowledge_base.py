import os
import json
import time
import glob
import re
import sys
from pathlib import Path
try:
    from dotenv import load_dotenv
    # Tìm file .env ở thư mục gốc của dự án
    BASE_DIR = Path(__file__).resolve().parent.parent
    load_dotenv(dotenv_path=BASE_DIR / '.env')
except ImportError:
    pass

# Thiết lập encoding UTF-8 cho console để hiển thị mượt mà trên Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# Ép ghi đệm (flush) ngay lập tức cho tất cả các hàm print để hiển thị log thời gian thực khi chạy ngầm
import builtins
def print(*args, **kwargs):
    kwargs['flush'] = True
    builtins.print(*args, **kwargs)

from sentence_transformers import SentenceTransformer
import chromadb

# Khởi tạo mô hình nhúng cục bộ intfloat/multilingual-e5-small (tải một lần đầu tiên khoảng 100MB)
print("⏳ Đang tải và khởi tạo mô hình nhúng cục bộ (Local CPU: intfloat/multilingual-e5-small)...")
try:
    model = SentenceTransformer('intfloat/multilingual-e5-small')
    print("✅ Khởi tạo thành công mô hình nhúng offline!")
except Exception as e:
    print(f"❌ Lỗi tải mô hình nhúng cục bộ: {e}")
    model = None

# Thư mục Vector DB
DB_PATH = os.path.join(Path(__file__).resolve().parent.parent, "data", "vector_db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# TỐI ƯU HÓA: Định nghĩa một class nhúng rỗng (None Embedding Function)
# Vì chúng ta tự nhúng thủ công và truyền vector vào collection.add(),
# việc gán hàm nhúng rỗng này giúp loại bỏ hoàn toàn việc ChromaDB cố gắng kết nối
# internet để tải mô hình mặc định 90MB (all-MiniLM-L6-v2) từ HuggingFace, giúp khởi chạy ngay lập tức!
class NoneEmbeddingFunction:
    def name(self) -> str:
        return "NoneEmbeddingFunction"
        
    def __call__(self, input):
        # Trả về danh sách rỗng vì chúng ta tự xử lý embedding thủ công
        return []

# Khởi tạo ChromaDB
try:
    chroma_client = chromadb.PersistentClient(path=DB_PATH)
    
    # Tự động phát hiện và xóa collection cũ nếu là từ mô hình cũ sang E5 Local (384 chiều)
    need_reset = False
    try:
        # Lấy collection hiện tại nếu có
        existing_col = chroma_client.get_collection(
            name="knowledge_base",
            embedding_function=NoneEmbeddingFunction()
        )
        count = existing_col.count()
        if count > 0:
            # Lấy thử 1 bản ghi bằng peek để xem chiều vector thực tế
            sample = existing_col.peek(limit=1)
            if sample is not None and sample.get("embeddings") is not None:
                embeddings = sample["embeddings"]
                if len(embeddings) > 0:
                    dim = len(embeddings[0])
                    if dim != 384:
                        print(f"⚠️ Phát hiện Collection cũ có số chiều vector là {dim} (không phải E5 Local 384 chiều).")
                        need_reset = True
        else:
            print("📊 Collection hiện tại đang trống. Không cần reset.")
    except Exception:
        # Chưa tồn tại collection
        pass

    if need_reset:
        print("🧹 Đang xóa Collection cũ để đồng bộ sang E5 Local 384 chiều...")
        try:
            chroma_client.delete_collection("knowledge_base")
            print("✅ Đã xóa Collection cũ thành công!")
        except Exception as delete_err:
            print(f"❌ Không thể xóa Collection: {delete_err}")

    # Lấy hoặc tạo mới collection với hàm nhúng rỗng
    collection = chroma_client.get_or_create_collection(
        name="knowledge_base",
        embedding_function=NoneEmbeddingFunction()
    )
    print(f"✅ Khởi tạo thành công ChromaDB tại: {DB_PATH}")
    print(f"📊 Số lượng chunk hiện có trong DB: {collection.count()}")
except Exception as e:
    print(f"❌ Lỗi khởi tạo ChromaDB: {e}")
    collection = None

def clean_text(text):
    """Làm sạch các thẻ HTML rác và chuẩn hóa khoảng trắng"""
    if not text:
        return ""
    # Thay thế các thẻ xuống dòng HTML
    text = text.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")
    # Thay thế ký tự khoảng trắng đặc biệt (non-breaking space)
    text = re.sub(r'\xa0', ' ', text)
    # Thay thế các tab hoặc xuống dòng liên tục
    text = re.sub(r'\n+', '\n', text)
    # Chuẩn hóa các khoảng trắng liên tục thành 1 khoảng trắng duy nhất
    text = re.sub(r' +', ' ', text)
    return text.strip()

def wait_for_internet():
    """Kiểm tra kết nối Internet, nếu mất mạng thì dừng lại đợi cho đến khi có mạng trở lại"""
    import socket
    first_time = True
    while True:
        try:
            # Thử kết nối với DNS Google
            socket.create_connection(("8.8.8.8", 53), timeout=3)
            if not first_time:
                print("📶 ĐÃ KẾT NỐI LẠI INTERNET! Tiếp tục quá trình embedding...")
            return True
        except OSError:
            if first_time:
                print("\n📶 MẤT KẾT NỐI INTERNET! Tự động tạm dừng tiến trình...")
                print("⏳ Tiến trình sẽ ngủ và tự động khôi phục ngay khi mạng hoạt động trở lại. Đừng tắt terminal!")
                first_time = False
            time.sleep(10)

def embed_and_save(texts, enhanced_texts, metadatas, ids):
    """Nhúng vector bằng mô hình local intfloat/multilingual-e5-small và lưu vào ChromaDB"""
    global model
    
    if not collection:
        print("❌ Lỗi: ChromaDB Collection chưa được khởi tạo!")
        return False
        
    if not model:
        print("❌ LỖI: Mô hình nhúng cục bộ chưa được tải!")
        return False

    try:
        # Tiền tố "passage: " là bắt buộc đối với mô hình E5 để đạt hiệu năng tìm kiếm RAG tối ưu nhất
        passages = ["passage: " + text for text in enhanced_texts]
        
        # Thực hiện tính toán vector nhúng offline hoàn toàn trên CPU
        embeddings = model.encode(passages, batch_size=len(ids), show_progress_bar=False).tolist()
        
        # Chuẩn hóa metadata để ChromaDB chấp nhận
        cleaned_metadatas = []
        for meta in metadatas:
            cleaned_meta = {}
            for k, v in meta.items():
                if isinstance(v, (str, int, float, bool)):
                    cleaned_meta[k] = v
                elif v is None:
                    cleaned_meta[k] = ""
                else:
                    cleaned_meta[k] = str(v)
            cleaned_metadatas.append(cleaned_meta)

        # Lưu vào ChromaDB
        collection.add(
            embeddings=embeddings,
            documents=texts,
            metadatas=cleaned_metadatas,
            ids=ids
        )
        return True
        
    except Exception as e:
        print(f"❌ Gặp lỗi trong quá trình nhúng cục bộ offline: {e}")
        return False

def process_all_chunks():
    """Hàm chính quét toàn bộ thư mục chunks, làm sạch, nhúng vector và lưu vào DB"""
    if not collection:
        print("❌ Khởi động thất bại do lỗi database.")
        return
        
    BASE_DIR = Path(__file__).resolve().parent.parent
    chunked_dir = BASE_DIR / "data" / "chunked"
    
    if not chunked_dir.exists():
        print(f"❌ Thư mục chunked không tồn tại: {chunked_dir}")
        return
        
    # Tìm kiếm đệ quy tất cả các file JSON chunk
    print("⏳ Đang quét ổ đĩa đệ quy để tìm tất cả các file JSON chunked (quá trình này có thể tốn 1-2 phút)...")
    search_pattern = str(chunked_dir / "**" / "*_chunks.json")
    json_files = glob.glob(search_pattern, recursive=True)
    
    total_files = len(json_files)
    print(f"📂 Tìm thấy {total_files} file JSON chunked trong các thư mục con.")
    
    if total_files == 0:
        print("ℹ️ Không tìm thấy file JSON nào để xử lý.")
        return

    # TỐI ƯU HÓA HIỆU NĂNG CỰC ĐẠI:
    # Bước 1: Nạp nhanh toàn bộ chunks từ đĩa vào RAM (chỉ tốn ~10MB RAM)
    print("⏳ Bước 1: Đang tải nhanh cấu trúc chunks từ đĩa cứng vào bộ nhớ RAM...")
    start_load_time = time.time()
    
    all_chunks_list = []
    for idx, file_path in enumerate(json_files, 1):
        rel_path = os.path.relpath(file_path, chunked_dir)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                chunks = json.load(f)
                for chunk in chunks:
                    all_chunks_list.append(chunk)
        except Exception as e:
            print(f"❌ Không thể đọc file: {rel_path} ({e})")
            
        if idx % 1000 == 0 or idx == total_files:
            print(f"   -> Đang nạp: {idx}/{total_files} files (Đã gom {len(all_chunks_list)} chunks)...")
            
    end_load_time = time.time()
    print(f"✅ Đã nạp thành công {len(all_chunks_list)} chunks từ ổ đĩa trong {end_load_time - start_load_time:.2f} giây.")

    # Bước 2: Chia nhỏ tất cả các chunks thành các batch 128 để kiểm tra checkpoint và nhúng
    print("\n🚀 Bước 2: Bắt đầu nhúng vector và lưu vào database theo lô 128...")
    
    batch_size = 128  # Tối ưu lô lên 128 chunks cho SentenceTransformer Local CPU
    total_chunks = len(all_chunks_list)
    total_processed_chunks = 0
    total_skipped_chunks = 0
    
    start_time = time.time()
    
    for i in range(0, total_chunks, batch_size):
        chunk_batch = all_chunks_list[i:i + batch_size]
        
        # Lấy danh sách ID của batch này
        batch_ids = [c.get("chunk_id") for c in chunk_batch if c.get("chunk_id")]
        
        # TỐI ƯU HÓA CHECKPOINT: Gọi collection.get MỘT LẦN cho cả batch 128 thay vì 128 lần đơn lẻ!
        existing_ids = set()
        try:
            existing = collection.get(ids=batch_ids)
            if existing and existing["ids"]:
                existing_ids = set(existing["ids"])
        except Exception:
            pass
            
        # Lọc ra các chunk chưa được nhúng
        chunks_to_embed = []
        for chunk in chunk_batch:
            cid = chunk.get("chunk_id")
            if cid in existing_ids:
                total_skipped_chunks += 1
            else:
                chunks_to_embed.append(chunk)
                
        # Nếu lô này đã được nhúng toàn bộ, bỏ qua
        if not chunks_to_embed:
            if (i + batch_size) % 1000 == 0 or (i + batch_size) >= total_chunks:
                print(f"⏭️ Tiến độ: {min(i + batch_size, total_chunks)}/{total_chunks} chunks | Lô này đã nhúng đầy đủ (Đã bỏ qua: {total_skipped_chunks})")
            continue
            
        # Chuẩn bị dữ liệu nhúng cho các chunk chưa có trong DB
        batch_texts = []
        batch_enhanced_texts = []
        batch_metadatas = []
        batch_embed_ids = []
        
        for chunk in chunks_to_embed:
            text_cleaned = clean_text(chunk.get("text", ""))
            metadata = chunk.get("metadata", {})
            chunk_id = chunk.get("chunk_id")
            
            # Tăng cường ngữ cảnh thể loại
            folder_type = metadata.get("folder", "tai-lieu-khac")
            enhanced_text = f"Thể loại văn bản: {folder_type}. Nội dung: {text_cleaned}"
            
            batch_texts.append(text_cleaned)
            batch_enhanced_texts.append(enhanced_text)
            batch_metadatas.append(metadata)
            batch_embed_ids.append(chunk_id)
            
        # Thực hiện gọi API nhúng và ghi vào DB (bọc trong vòng lặp thử lại vĩnh viễn cho đến khi thành công)
        success = False
        retry_count = 0
        while not success:
            success = embed_and_save(batch_texts, batch_enhanced_texts, batch_metadatas, batch_embed_ids)
            if success:
                total_processed_chunks += len(batch_embed_ids)
                percent = (min(i + batch_size, total_chunks) / total_chunks) * 100
                print(f"✨ Tiến độ: {min(i + batch_size, total_chunks)}/{total_chunks} ({percent:.1f}%) | Nhúng thành công thêm: {len(batch_embed_ids)} chunks | Đã bỏ qua: {total_skipped_chunks}")
            else:
                retry_count += 1
                sleep_time = min(5 * retry_count, 30) # Mô hình cục bộ bị lỗi thì thử lại nhanh sau 5 giây
                print(f"⚠️ Thất bại khi nhúng lô gồm {len(batch_embed_ids)} chunks (Lần thử {retry_count}).")
                print(f"⏳ Tiến trình đang tạm dừng {sleep_time} giây trước khi thử lại lô này...")
                time.sleep(sleep_time)
            
    end_time = time.time()
    elapsed_time = end_time - start_time
    
    print("\n=======================================================")
    print("🎉 HOÀN THÀNH QUÁ TRÌNH MIGRATION & EMBEDDING CHUNKS 🎉")
    print(f"⏱️ Tổng thời gian chạy nhúng: {elapsed_time:.1f} giây (~{elapsed_time/60:.2f} phút)")
    print(f"📊 Tổng số chunk mới được nhúng thành công: {total_processed_chunks}")
    print(f"📊 Tổng số chunk đã có sẵn từ trước (Skipped): {total_skipped_chunks}")
    if collection:
        print(f"📊 Tổng số chunk hiện tại lưu trong ChromaDB: {collection.count()}")
    print("=======================================================")

if __name__ == "__main__":
    process_all_chunks()
