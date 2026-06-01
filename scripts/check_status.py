import os
import sys
from pathlib import Path
import chromadb

# Thiết lập encoding UTF-8
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

DB_PATH = os.path.join(Path(__file__).resolve().parent.parent, "data", "vector_db")

class NoneEmbeddingFunction:
    name = "NoneEmbeddingFunction"
    def name(self) -> str:
        return "NoneEmbeddingFunction"
    def __call__(self, input):
        return []

try:
    chroma_client = chromadb.PersistentClient(path=DB_PATH)
    collection = chroma_client.get_or_create_collection(
        name="knowledge_base",
        embedding_function=NoneEmbeddingFunction()
    )
    count = collection.count()
    total = 21919
    percent = (count / total) * 100
    if percent > 100:
        percent = 100.0
    
    # Vẽ progress bar
    filled = int(20 * percent / 100)
    bar = "█" * filled + "░" * (20 - filled)
    
    print(f"📊 [BÁO CÁO TIẾN TRÌNH CHROMADB]")
    print(f"📁 Đường dẫn Vector DB: {DB_PATH}")
    print(f"💾 Số lượng vector hiện tại: {count:,} / {total:,} chunks")
    print(f"📈 Tiến độ thực tế: [{bar}] {percent:.2f}%")
except Exception as e:
    print(f"❌ Không thể đọc database ChromaDB: {e}")
