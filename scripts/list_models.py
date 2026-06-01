import os
import sys
from pathlib import Path
try:
    from dotenv import load_dotenv
    BASE_DIR = Path(__file__).resolve().parent.parent
    load_dotenv(dotenv_path=BASE_DIR / '.env')
except ImportError:
    pass

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

print("🔍 Đang truy vấn danh sách mô hình khả dụng từ Google AI Studio...")
try:
    models = genai.list_models()
    embed_models = []
    for m in models:
        if 'embedContent' in m.supported_generation_methods:
            embed_models.append(m)
            print(f"- Tên mô hình: {m.name}")
            print(f"  Mô tả: {m.description}")
            print(f"  Supported methods: {m.supported_generation_methods}")
            print(f"  Input token limit: {m.input_token_limit}")
            print(f"  Output token limit: {m.output_token_limit}\n")
            
    if not embed_models:
        print("❌ Không tìm thấy mô hình nào hỗ trợ nhúng vector (embedContent)!")
except Exception as e:
    print(f"❌ Lỗi khi truy vấn API: {e}")
