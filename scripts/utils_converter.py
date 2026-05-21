# -*- coding: utf-8 -*-
"""
Module: utils_converter.py
Description: Bộ chuyển đổi bảng mã tiếng Việt cổ (TCVN3, VNI_WIN) sang Unicode UTF-8.
Tác giả: Antigravity AI
"""

import re

# Các biểu thức chính quy (Regex) để tự động nhận dạng bảng mã của chuỗi
PATTERNS = {
    "TCVN3": [r'\w­[¬íêîëì]|®[¸µ¹¶·Ê¾»Æ¼½ÌÑÎÏªÕÒÖÓÔÝ×ÞØÜãßäáâ«èåéæç¬íêîëìóïôñòøõùö]', 0],
    "VNI_WIN": [r'[öô][ùøïûõ]|oa[ëùøïûõ]|ñ[aoeuôö][äàáåãùøïûõ]', re.IGNORECASE],
    "UNICODE": [r'[Ạ-ỹ]', 0]
}

# Danh sách ký tự TCVN3 (ABC) tương ứng 1-1 với danh sách UNICODE bên dưới
TCVN3_CHARS = [
    "Aµ", "A¸", "¢" , "A·", "EÌ", "EÐ", "£" , "I×", "IÝ", "Oß",
    "Oã", "¤" , "Oâ", "Uï", "Uó", "Yý", "µ" , "¸" , "©" , "·" ,
    "Ì" , "Ð" , "ª" , "×" , "Ý" , "ß" , "ã" , "«" , "â" , "ï" ,
    "ó" , "ý" , "¡" , "¨" , "§" , "®" , "IÜ", "Ü" , "Uò", "ò" ,
    "¥" , "¬" , "¦" , "­"  , "A¹", "¹" , "A¶", "¶" , "¢Ê", "Ê" ,
    "¢Ç", "Ç" , "¢È", "È" , "¢É", "É" , "¢Ë", "Ë" , "¡¾", "¾" ,
    "¡»", "»" , "¡¼", "¼" , "¡½", "½" , "¡Æ", "Æ" , "EÑ", "Ñ" ,
    "EÎ", "Î" , "EÏ", "Ï" , "£Õ", "Õ" , "£Ò", "Ò" , "£Ó", "Ó" ,
    "£Ô", "Ô" , "£Ö", "Ö" , "IØ", "Ø" , "IÞ", "Þ" , "Oä", "ä" ,
    "Oá", "á" , "¤è", "è" , "¤å", "å" , "¤æ", "æ" , "¤ç", "ç" ,
    "¤é", "é" , "¥í", "í" , "¥ê", "ê" , "¥ë", "ë" , "¥ì", "ì" ,
    "¥î", "î" , "Uô", "ô" , "Uñ", "ñ" , "¦ø", "ø" , "¦õ", "õ" ,
    "¦ö", "ö" , "¦÷", "÷" , "¦ù", "ù" , "Yú", "ú" , "Yþ", "þ" ,
    "Yû", "û" , "Yü", "ü", "."
]

# Danh sách ký tự VNI Windows tương ứng 1-1 với danh sách UNICODE bên dưới
VNI_WIN_CHARS = [
    "AØ", "AÙ", "AÂ", "AÕ", "EØ", "EÙ", "EÂ", "Ì" , "Í" , "OØ",
    "OÙ", "OÂ", "OÕ", "UØ", "UÙ", "YÙ", "aø", "aù", "aâ", "aõ",
    "eø", "eù", "eâ", "ì" , "í" , "oø", "où", "oâ", "oõ", "uø",
    "uù", "yù", "AÊ", "aê", "Ñ" , "ñ" , "Ó" , "ó" , "UÕ", "uõ",
    "Ô" , "ô" , "Ö" , "ö" , "AÏ", "aï", "AÛ", "aû", "AÁ", "aá",
    "AÀ", "aà", "AÅ", "aå", "AÃ", "aã", "AÄ", "aä", "AÉ", "aé",
    "AÈ", "aè", "AÚ", "aú", "AÜ", "aü", "AË", "aë", "EÏ", "eï",
    "EÛ", "eû", "EÕ", "eõ", "EÁ", "eá", "EÀ", "eà", "EÅ", "eå",
    "EÃ", "eã", "EÄ", "eä", "Æ" , "æ" , "Ò" , "ò" , "OÏ", "oï",
    "OÛ", "oû", "OÁ", "oá", "OÀ", "oà", "OÅ", "oå", "OÃ", "oã",
    "OÄ", "oä", "ÔÙ", "ôù", "ÔØ", "ôø", "ÔÛ", "ôû", "ÔÕ", "ôõ",
    "ÔÏ", "ôï", "UÏ", "uï", "UÛ", "uû", "ÖÙ", "öù", "ÖØ", "öø",
    "ÖÛ", "öû", "ÖÕ", "öõ", "ÖÏ", "öï", "YØ", "yø", "Î" , "î" ,
    "YÛ", "yû", "YÕ", "yõ", "."
]

# Danh sách ký tự Unicode tương ứng
UNICODE_CHARS = [
    "À", "Á", "Â", "Ã", "È", "É", "Ê", "Ì", "Í", "Ò",
    "Ó", "Ô", "Õ", "Ù", "Ú", "Ý", "à", "á", "â", "ã",
    "è", "é", "ê", "ì", "í", "ò", "ó", "ô", "õ", "ù",
    "ú", "ý", "Ă", "ă", "Đ", "đ", "Ĩ", "ĩ", "Ũ", "ũ",
    "Ơ", "ơ", "Ư", "ư", "Ạ", "ạ", "Ả", "ả", "Ấ", "ấ",
    "Ầ", "ầ", "Ẩ", "ẩ", "Ẫ", "ẫ", "Ậ", "ậ", "Ắ", "ắ",
    "Ằ", "ằ", "Ẳ", "ẳ", "Ẵ", "ẵ", "Ặ", "ặ", "Ẹ", "ẹ",
    "Ẻ", "ẻ", "Ẽ", "ẽ", "Ế", "ế", "Ề", "ề", "Ể", "ể",
    "Ễ", "ễ", "Ệ", "ệ", "Ỉ", "ỉ", "Ị", "ị", "Ọ", "ọ",
    "Ỏ", "ỏ", "Ố", "ố", "Ồ", "ồ", "Ổ", "ổ", "Ỗ", "ỗ",
    "Ộ", "ộ", "Ớ", "ớ", "Ờ", "ờ", "Ở", "ở", "Ỡ", "ỡ",
    "Ợ", "ợ", "Ụ", "ụ", "Ủ", "ủ", "Ứ", "ứ", "Ừ", "ừ",
    "Ử", "ử", "Ữ", "ữ", "Ự", "ự", "Ỳ", "ỳ", "Ỵ", "ỵ",
    "Ỷ", "ỷ", "Ỹ", "ỹ", "."
]


def detect_charset(text):
    """
    Tự động nhận dạng bảng mã của chuỗi văn bản đầu vào.
    Trả về: 'TCVN3', 'VNI_WIN', 'UNICODE' hoặc None nếu không nhận dạng được.
    """
    if not text:
        return None
    for charset, (pattern, flags) in PATTERNS.items():
        if re.search(pattern, text, flags):
            return charset
    return None


def convert_to_unicode(text, source_charset=None):
    """
    Chuyển đổi chuỗi văn bản từ bảng mã nguồn sang Unicode chuẩn.
    Nếu không truyền source_charset, hàm sẽ tự động nhận diện.
    Sử dụng thuật toán 2 bước (Two-pass) để chống trùng lặp ký tự khi thay thế.
    """
    if not text:
        return text
    
    # 1. Tự động phát hiện bảng mã nếu chưa có
    if source_charset is None:
        source_charset = detect_charset(text)
        
    # Nếu là Unicode sẵn hoặc không nhận dạng được thì trả về nguyên bản
    if source_charset == "UNICODE" or source_charset is None:
        return text

    # Chọn bảng mã nguồn tương ứng
    if source_charset == "TCVN3":
        source_list = TCVN3_CHARS
    elif source_charset == "VNI_WIN":
        source_list = VNI_WIN_CHARS
    else:
        # Nếu là các bảng mã không hỗ trợ
        return text

    # Sử dụng thuật toán 2 bước để chống xung đột ký tự khi thay thế
    map_length = len(source_list)
    # Sắp xếp các chỉ số theo độ dài của chuỗi nguồn giảm dần để tránh thay thế chuỗi con trước (Maximal Munch)
    sorted_indices = sorted(range(map_length), key=lambda idx: len(source_list[idx]), reverse=True)


    # Bước 1: Thay thế các ký tự nguồn bằng các token giữ chỗ ::index:: theo thứ tự chiều dài giảm dần
    temp_text = text
    for i in sorted_indices:
        if source_list[i] in temp_text:
            temp_text = temp_text.replace(source_list[i], f"::{i}::")

    # Bước 2: Thay thế các token giữ chỗ bằng ký tự Unicode đích tương ứng
    for i in range(map_length):
        placeholder = f"::{i}::"
        if placeholder in temp_text:
            temp_text = temp_text.replace(placeholder, UNICODE_CHARS[i])

    return temp_text



# --- PHẦN THỬ NGHIỆM TỰ ĐỘNG (UNIT TESTS) ---
if __name__ == "__main__":
    print("--- Chạy thử nghiệm bộ chuyển đổi bảng mã ---")
    
    # Test case 1: TCVN3
    tcvn3_sample = "Tr\xadêng TiÓu häc B×nh Minh"  # Trường Tiểu học Bình Minh trong TCVN3
    detected_1 = detect_charset(tcvn3_sample)
    converted_1 = convert_to_unicode(tcvn3_sample)
    print(f"Mẫu TCVN3: '{tcvn3_sample}'")
    print(f" -> Nhận dạng: {detected_1}")
    print(f" -> Chuyển đổi: '{converted_1}'")
    assert "Trường Tiểu học Bình Minh" in converted_1, "Lỗi chuyển đổi TCVN3!"


    # Test case 2: VNI Windows
    vni_sample = "Tröôøng Tieåu hoïc Binh Minh"  # Trường Tiểu học Bình Minh trong VNI
    detected_2 = detect_charset(vni_sample)
    converted_2 = convert_to_unicode(vni_sample)
    print(f"\nMẫu VNI_WIN: '{vni_sample}'")
    print(f" -> Nhận dạng: {detected_2}")
    print(f" -> Chuyển đổi: '{converted_2}'")
    
    # Test case 3: Unicode chuẩn
    unicode_sample = "Trường Tiểu học Bình Minh"
    detected_3 = detect_charset(unicode_sample)
    converted_3 = convert_to_unicode(unicode_sample)
    print(f"\nMẫu UNICODE: '{unicode_sample}'")
    print(f" -> Nhận dạng: {detected_3}")
    print(f" -> Chuyển đổi: '{converted_3}'")
    assert unicode_sample == converted_3, "Lỗi giữ nguyên Unicode chuẩn!"

    print("\n[OK] Tất cả testcases thử nghiệm thành công!")
