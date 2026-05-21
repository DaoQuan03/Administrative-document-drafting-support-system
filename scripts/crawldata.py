# ==============================================================
# CHƯƠNG TRÌNH TỰ ĐỘNG CÀO DỮ LIỆU TỪ THUVIENPHAPLUAT.VN
# Mục tiêu: Thu thập và tải xuống các biểu mẫu/phiếu dưới dạng file
# ==============================================================

# ===== PHẦN 1: IMPORT THƯ VIỆN =====

import undetected_chromedriver as uc
# undetected_chromedriver: thư viện điều khiển Chrome nhưng "ẩn mình"
# tránh bị các hệ thống chống bot (như Cloudflare) phát hiện

from selenium.webdriver.common.by import By
# By: dùng để chỉ định cách tìm kiếm phần tử trên trang web
# Ví dụ: By.XPATH, By.TAG_NAME, By.ID...

import time
# time: thư viện xử lý thời gian — dùng để tạm dừng (sleep) giữa các thao tác
# giúp tránh gửi quá nhiều request liên tục, dễ bị block

import random
# random: tạo số ngẫu nhiên — dùng để tạo thời gian chờ ngẫu nhiên
# (thay vì chờ đúng 5s mỗi lần, sẽ chờ 4-7s ngẫu nhiên → trông tự nhiên hơn)

import requests
# requests: thư viện gửi HTTP request — dùng để tải file trực tiếp
# (không cần mở trình duyệt, nhanh hơn Selenium)

import os
# os: thư viện làm việc với hệ điều hành — kiểm tra file/folder tồn tại,
# tạo thư mục, ghép đường dẫn...

from urllib.parse import urlparse, parse_qs, unquote
# urlparse: phân tích cấu trúc URL (scheme, netloc, path, query...)
# parse_qs: phân tích chuỗi query string thành dict (vd: "url=abc" → {"url": ["abc"]})
# unquote: giải mã URL encoding (vd: "%20" → " ", "%2F" → "/")


# ===== PHẦN 2: CẤU HÌNH TRÌNH DUYỆT =====

options = uc.ChromeOptions()
# Tạo đối tượng cấu hình cho Chrome
# undetected_chromedriver tự động thêm các cài đặt để giả lập người dùng thật
# nên không cần thêm tay các argument như "--disable-blink-features=AutomationControlled"

driver = uc.Chrome(options=options, version_main=147)
# Khởi tạo trình duyệt Chrome "tàng hình"
# version_main=147: chỉ định phiên bản Chrome đang cài trên máy (phải khớp)
# Nếu sai version, driver sẽ không chạy được

driver.maximize_window()
# Phóng to cửa sổ trình duyệt lên toàn màn hình
# Một số trang web ẩn nội dung nếu cửa sổ quá nhỏ


# ===== PHẦN 3: HẰNG SỐ (CÁC GIÁ TRỊ CỐ ĐỊNH) =====

BASE_URL = "https://thuvienphapluat.vn/bieumau?q=&type=6&page="
# URL gốc của trang danh sách biểu mẫu
# Mỗi trang sẽ nối thêm số trang vào cuối: ...&page=1, ...&page=2, ...

SAVE_FOLDER = "data/raw/maubaocao"
# Tên thư mục để lưu các file tải xuống
# Thư mục này sẽ được tạo tự động nếu chưa tồn tại

DONE_FILE = "logs/done5.txt"
# File text lưu danh sách các link đã cào xong thành công
# Mỗi link chiếm 1 dòng — dùng để tiếp tục từ chỗ dở nếu chương trình bị dừng

SKIP_FILE = "logs/skipped.txt"
# File text lưu danh sách các link bị lỗi / không truy cập được
# Sau khi chạy xong, có thể kiểm tra file này để xử lý thủ công


# ===== PHẦN 4: CÁC HÀM HỖ TRỢ =====

def load_done():
    """
    Đọc danh sách các link đã hoàn thành từ file DONE_FILE.
    Trả về: set() — tập hợp các link đã làm (tra cứu nhanh O(1))
    Mục đích: Khi chạy lại chương trình, bỏ qua những link đã cào rồi
    """
    if not os.path.exists(DONE_FILE):
        # Nếu file chưa tồn tại (lần đầu chạy), trả về tập rỗng
        return set()
    with open(DONE_FILE, "r", encoding="utf-8") as f:
        # Đọc toàn bộ nội dung file, tách theo dòng, bỏ dòng trống
        return set(f.read().splitlines())


def save_done(link):
    """
    Ghi một link đã hoàn thành vào file DONE_FILE.
    Tham số: link — URL của trang vừa cào xong thành công
    Dùng chế độ "a" (append) để không ghi đè dữ liệu cũ
    """
    os.makedirs(os.path.dirname(DONE_FILE), exist_ok=True)
    with open(DONE_FILE, "a", encoding="utf-8") as f:
        f.write(link + "\n")  # Ghi link + xuống dòng để mỗi link nằm 1 hàng


def save_skipped(link):
    """
    Ghi một link bị lỗi vào file SKIP_FILE để theo dõi.
    Tham số: link — URL của trang bị bỏ qua do lỗi hoặc không có file
    Mục đích: Lưu lại để có thể kiểm tra/xử lý thủ công sau
    """
    os.makedirs(os.path.dirname(SKIP_FILE), exist_ok=True)
    with open(SKIP_FILE, "a", encoding="utf-8") as f:
        f.write(link + "\n")  # Ghi link + xuống dòng


def is_blocked():
    """
    Kiểm tra xem trang hiện tại có đang bị Cloudflare chặn không.
    Trả về: True nếu bị chặn, False nếu trang bình thường
    Cách hoạt động: Đọc nội dung HTML trang, tìm các cụm từ đặc trưng của Cloudflare
    """
    page = driver.page_source.lower()
    # Lấy toàn bộ mã HTML trang hiện tại, chuyển về chữ thường để so sánh không phân biệt hoa/thường

    if "just a moment" in page or "verify you are human" in page:
        # "just a moment..." và "verify you are human" là chữ xuất hiện trên trang Cloudflare challenge
        print("\n[!!!] Bị Cloudflare phát hiện!")
        input("👉 Hãy bật/tắt chế độ máy bay trên điện thoại, ĐỢI CÓ MẠNG LẠI rồi nhấn phím ENTER để tiếp tục...")
        # Dừng hoàn toàn chương trình, chờ người dùng đổi IP (bật/tắt máy bay)
        # và nhấn Enter để chạy tiếp — đây là cách vượt Cloudflare thủ công
        return True  # Báo hiệu: đang bị chặn

    return False  # Trang bình thường, không bị chặn


# ===== HÀM CHÍNH 1: Thu thập tất cả link biểu mẫu =====

def get_all_links(max_page=332):
    """
    Duyệt qua tất cả các trang danh sách và thu thập link của từng biểu mẫu.
    Tham số: max_page — số trang tối đa cần duyệt (mặc định 109)
    Trả về: list các link đã sắp xếp theo thứ tự alphabet
    """
    all_links = set()
    # Dùng set() thay vì list để tự động loại bỏ link trùng lặp

    for page in range(1, max_page + 1):
        # Lặp từ trang 1 đến trang max_page (bao gồm cả trang cuối)
        url = BASE_URL + str(page)
        # Ghép URL đầy đủ: BASE_URL + số trang → vd: "...&page=5"
        print("Đang crawl page:", page)

        driver.get(url)
        # Ra lệnh cho trình duyệt mở URL này
        time.sleep(random.uniform(4, 7))
        # Chờ 4-7 giây ngẫu nhiên để trang load xong và tránh bị detect là bot

        # Nếu bị Cloudflare chặn, chờ người dùng đổi IP rồi tải lại trang
        while is_blocked():
            print("Đang tải lại trang...")
            driver.get(url)   # Tải lại trang sau khi đổi IP
            time.sleep(5)     # Chờ 5 giây

        elements = driver.find_elements(By.XPATH, "//a[contains(@href,'/bieumau/')]")
        # Tìm tất cả thẻ <a> có href chứa "/bieumau/" trên trang
        # XPATH "//a[contains(@href,'/bieumau/')]" nghĩa là:
        #   //a       → tìm tất cả thẻ <a> trong toàn bộ trang
        #   [contains(@href,'/bieumau/')] → lọc chỉ những thẻ có href chứa "/bieumau/"
        print("Số link tìm được:", len(elements))

        for e in elements:
            href = e.get_attribute("href")
            # Lấy giá trị thuộc tính href của mỗi thẻ <a>
            if href and "/bieumau/" in href:
                # Kiểm tra href không rỗng và thực sự chứa "/bieumau/"
                all_links.add(href)
                # Thêm vào set (nếu đã có rồi thì set tự bỏ qua, không thêm trùng)

    return sorted(list(all_links))
    # Chuyển set → list → sắp xếp theo thứ tự → trả về


# ===== HÀM CHÍNH 2: Lấy link file thực từ trang chi tiết =====

def get_file_link(link):
    """
    Mở trang chi tiết của một biểu mẫu và trích xuất link file thực để tải.
    Tham số: link — URL trang chi tiết biểu mẫu
    Trả về: URL trực tiếp của file (docx/pdf/...) hoặc None nếu không tìm thấy
    Cơ chế: File được nhúng qua Google Docs Viewer (iframe), lấy URL từ tham số "url" trong src của iframe
    """
    try:
        driver.get(link)
        # Mở trang chi tiết biểu mẫu
        time.sleep(random.uniform(4, 7))
        # Chờ trang load (4-7 giây ngẫu nhiên)

        # Xử lý nếu bị Cloudflare chặn
        while is_blocked():
            print("Đang tải lại trang chi tiết...")
            driver.get(link)  # Tải lại sau khi đổi IP
            time.sleep(5)

        iframes = driver.find_elements(By.TAG_NAME, "iframe")
        # Tìm tất cả thẻ <iframe> trong trang
        # File biểu mẫu thường được nhúng qua Google Docs Viewer dưới dạng iframe

        for iframe in iframes:
            src = iframe.get_attribute("src")
            # Lấy thuộc tính src của iframe (URL của viewer)

            if src and "docs.google.com" in src:
                # Chỉ xử lý iframe của Google Docs Viewer
                # src có dạng: https://docs.google.com/viewer?url=https%3A%2F%2F...

                parsed = urlparse(src)
                # Phân tích URL thành các phần: scheme, netloc, path, query...
                # Ví dụ: parsed.query = "url=https%3A%2F%2Fexample.com%2Ffile.docx"

                query = parse_qs(parsed.query)
                # Chuyển query string thành dict
                # Ví dụ: {"url": ["https://example.com/file.docx"]}

                if "url" in query:
                    return unquote(query["url"][0])
                    # query["url"][0]: lấy giá trị đầu tiên của tham số "url"
                    # unquote(): giải mã URL encoding → trả về link file thực

        return None
        # Không tìm thấy iframe Google Docs → không có link file để tải

    except Exception as e:
        # Bắt mọi lỗi có thể xảy ra: timeout, trang không tải được, element không tìm thấy...
        print(f"[LỖI] Không thể truy cập trang: {link}")
        print(f"       Chi tiết lỗi: {e}")
        return None  # Trả về None để vòng lặp chính biết và bỏ qua trang này


# ===== HÀM CHÍNH 3: Tải file xuống máy =====

def download_file(file_url):
    """
    Tải file từ URL về máy và lưu vào thư mục SAVE_FOLDER.
    Tham số: file_url — URL trực tiếp của file cần tải
    Trả về: True nếu tải thành công (hoặc file đã có), False nếu thất bại
    """
    if not os.path.exists(SAVE_FOLDER):
        os.makedirs(SAVE_FOLDER)
        # Tạo thư mục lưu file nếu chưa tồn tại
        # makedirs tạo cả thư mục cha nếu cần

    filename = unquote(file_url.split("/")[-1].split("?")[0])
    # Trích xuất tên file từ URL:
    #   file_url.split("/")[-1]  → lấy phần cuối URL (sau dấu / cuối cùng)
    #   .split("?")[0]           → bỏ phần query string (sau dấu ?)
    #   unquote(...)             → giải mã ký tự đặc biệt trong tên file
    # Ví dụ: ".../Mau-don-xin-viec%20.docx?v=1" → "Mau-don-xin-viec .docx"

    path = os.path.join(SAVE_FOLDER, filename)
    # Tạo đường dẫn đầy đủ: thư mục + tên file
    # Ví dụ: "mauphieu/Mau-don-xin-viec.docx"

    if os.path.exists(path):
        print("Đã có file:", filename)
        return True
        # Nếu file đã tồn tại → bỏ qua, không tải lại (tiết kiệm thời gian & băng thông)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        # Giả lập User-Agent của trình duyệt Chrome thật
        # Tránh server từ chối request vì nhận ra là bot
        "Referer": "https://docs.google.com/"
        # Giả lập rằng request xuất phát từ Google Docs
        # Một số server kiểm tra Referer để cho phép tải file
    }

    try:
        r = requests.get(file_url, headers=headers, timeout=10)
        # Gửi HTTP GET request để tải file
        # timeout=10: nếu sau 10 giây không có phản hồi → báo lỗi (tránh treo vô hạn)

        if r.status_code == 200:
            # status_code 200 = thành công (OK)
            with open(path, "wb") as f:
                f.write(r.content)
                # Ghi nội dung file vào đĩa ở chế độ binary ("wb")
                # Binary mode cần thiết cho file docx, pdf, xlsx...
            print("Downloaded:", filename)
            return True  # Báo tải thành công

        else:
            print("Fail:", file_url)
            # Các status code khác: 403 (Forbidden), 404 (Not Found), 500 (Server Error)...
            return False  # Báo tải thất bại

    except Exception as e:
        print("Error:", e)
        # Lỗi mạng, timeout, hoặc các lỗi khác khi tải
        return False


# ===== PHẦN 5: CHƯƠNG TRÌNH CHÍNH =====

# --- Bước 1: Thu thập toàn bộ link ---
links = get_all_links(max_page=332)
# Duyệt 109 trang danh sách, thu thập tất cả link biểu mẫu
print("Tổng link:", len(links))
# In tổng số link tìm được

# --- Bước 2: Đọc danh sách đã làm ---
done_links = load_done()
# Tải danh sách link đã cào thành công từ lần chạy trước (nếu có)
# Mục đích: cho phép tiếp tục từ chỗ dở mà không cào lại từ đầu

# --- Bước 3: Lặp qua từng link và xử lý ---
for i, link in enumerate(links):
    # enumerate(links): lặp và lấy cả chỉ số (i bắt đầu từ 0) và giá trị (link)

    if link in done_links:
        print("Bỏ qua (đã làm):", link)
        continue
        # Nếu link này đã cào rồi → bỏ qua, chuyển sang link tiếp theo

    print(f"\n[{i+1}/{len(links)}] {link}")
    # In tiến độ: [link thứ mấy / tổng số link] URL

    try:
        # Bọc toàn bộ xử lý trong try/except
        # → nếu có lỗi bất ngờ, chương trình không crash mà bỏ qua link này

        file_url = get_file_link(link)
        # Mở trang chi tiết, tìm link file thực

        if file_url:
            # Nếu tìm được link file → tiến hành tải
            success = download_file(file_url)
            if success:
                save_done(link)
                # Tải thành công → lưu link vào done4.txt để không cào lại
        else:
            print("Không có file — bỏ qua trang này")
            save_skipped(link)
            # Không tìm thấy file → ghi vào skipped.txt để theo dõi

    except Exception as e:
        # Bắt lỗi không mong muốn ở cấp độ vòng lặp (lớp bảo vệ ngoài cùng)
        print(f"[BỎ QUA] Lỗi tại link [{i+1}]: {link}")
        print(f"         Chi tiết: {e}")
        save_skipped(link)
        # Ghi vào skipped.txt và tiếp tục sang link tiếp theo

    time.sleep(random.uniform(3, 6))
    # Chờ 3-6 giây ngẫu nhiên giữa mỗi link
    # Giúp giảm tải cho server và tránh bị phát hiện là bot

# --- Bước 4: Kết thúc ---
driver.quit()
# Đóng trình duyệt và giải phóng tài nguyên sau khi hoàn thành