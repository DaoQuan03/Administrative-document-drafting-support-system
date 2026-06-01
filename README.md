# 📋 Administrative Document Drafting Support System
# 🏛️ Hệ Thống Hỗ Trợ Soạn Thảo Tài Liệu Hành Chính

<div align="center">

![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)
![Django](https://img.shields.io/badge/Django-4.2+-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)

**A professional AI-powered system for generating, drafting, editing and managing administrative documents in compliance with Vietnamese Government regulations**

**Hệ thống được hỗ trợ bởi AI để tạo, soạn thảo, chỉnh sửa và quản lý tài liệu hành chính phù hợp với quy định của Chính phủ Việt Nam**

</div>

---

## 📑 Table of Contents | Mục Lục

- [English Documentation](#english-documentation)
- [Tài Liệu Tiếng Việt](#tài-liệu-tiếng-việt)

---

# English Documentation

## 🎯 Overview

**Administrative Document Drafting Support System** is a comprehensive web-based application designed to streamline the creation, management, and optimization of administrative documents. The system is built in compliance with **Decree 30/2020/NĐ-CP** of the Vietnamese Government, ensuring that all generated documents meet official standards and requirements.

### 🌟 Key Highlights

- ✅ **AI-Powered Document Generation**: Automatically generate administrative documents with proper formatting and structure
- ✅ **Specialized Drafting Templates**: Pre-configured prompts for 6+ document types (Proposals, Decisions, Official Dispatches, Reports, Applications, Notifications)
- ✅ **Real-time Editing Support**: In-line AI assistance for editing, proofreading, and optimization
- ✅ **Legal Knowledge Base (RAG)**: Answer questions about regulations and document requirements
- ✅ **Multi-language Support**: Vietnamese/English interface
- ✅ **Secure Authentication**: Google OAuth2, Microsoft OAuth2, Email/Password authentication
- ✅ **Professional Output**: Clean HTML formatting compatible with modern document editors

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend** | Python, Django 4.2+ | API & Business Logic |
| **Frontend** | HTML, CSS, JavaScript | User Interface & WYSIWYG Editor |
| **AI Engine** | OpenAI / Ollama | LLM-powered document generation |
| **Email Service** | SMTP/Gmail | User notifications |
| **Database** | Django ORM (SQLite/PostgreSQL) | Data persistence |
| **Web Server** | Django Development/Gunicorn | Application server |
| **Package Manager** | pip | Python dependency management |

### Language Composition
```
HTML       39.5%  ▓▓▓▓▓▓▓▓░░ Document markup & templates
Python     24.8%  ▓▓▓▓▓░░░░░ Backend logic & AI integration  
CSS        24.0%  ▓▓▓▓▓░░░░░ Styling & responsiveness
JavaScript 11.7%  ▓▓░░░░░░░░ Frontend interactivity
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.7** or higher (3.10+ recommended)
- **pip** (Python package manager)
- **Git** for version control
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)
- **SMTP Email Server** (Gmail account recommended for development)

### Optional Dependencies
- **OpenAI API Key** (for advanced AI features)
- **Ollama** (for local LLM inference, free & offline)
- **Google Cloud Console credentials** (for OAuth2 authentication)
- **Microsoft Azure credentials** (for Teams integration)

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/DaoQuan03/Administrative-document-drafting-support-system.git
cd Administrative-document-drafting-support-system
```

### Step 2: Create Virtual Environment

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirement.txt
```

### Step 4: Configure Environment Variables

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```dotenv
# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL="VănBảnAI <noreply@vanbanai.vn>"

# Google OAuth2 (Optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/accounts/google/callback/

# Microsoft OAuth2 (Optional)
MICROSOFT_CLIENT_ID=your-microsoft-id
MICROSOFT_CLIENT_SECRET=your-microsoft-secret
MICROSOFT_REDIRECT_URI=http://127.0.0.1:8000/accounts/microsoft/callback/

# OpenAI Configuration (Optional)
OPENAI_API_KEY=sk-proj-YourOpenAIAPIKeyHere

# Ollama Configuration (Free, Local LLM)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

### Step 5: Initialize Database

```bash
python manage.py migrate
python manage.py createsuperuser  # Create admin account
```

### Step 6: Run the Development Server

```bash
python manage.py runserver
```

The application will be available at: **http://127.0.0.1:8000**

---

## 📖 Usage Guide

### Creating a New Document

1. **Login** to your account (Email, Google, or Microsoft)
2. **Click "New Document"** from the main dashboard
3. **Select Document Type**: Choose from:
   - 📄 **Tờ Trình** (Proposals/Submissions)
   - ⚖️ **Quyết Định** (Decisions/Resolutions)
   - 📮 **Công Văn** (Official Dispatches)
   - 📊 **Báo Cáo** (Reports)
   - 📋 **Đơn Từ** (Applications/Forms)
   - 📢 **Thông Báo** (Notifications)
4. **Describe Your Requirements**: Provide details about the document content
5. **Generate**: AI will automatically create a compliant document
6. **Edit**: Use the built-in editor to refine the document
7. **Save/Export**: Save to system or export as PDF/DOCX

### AI-Powered Editing Features

- **✏️ Edit & Improve**: Select text and request improvements
- **🔍 Auto-Check**: Automatically detect spelling, grammar, and formatting errors
- **💡 Suggestions**: Get recommendations for professional language
- **📋 Auto-Fill**: Automatically populate personal information
- **❓ Ask Questions**: Query the legal knowledge base about regulations

### Advanced Features

#### 🤖 Legal Knowledge Base (RAG)
Ask questions about Vietnamese administrative regulations:
- "When should I use a decision instead of a dispatch?"
- "What are the authority requirements for this document?"
- "How should this section be formatted?"

#### 📚 Template Management
- View and manage saved templates
- Create custom templates from existing documents
- Share templates with team members
- Download template collections

---

## 🏗️ Project Structure

```
Administrative-document-drafting-support-system/
├── accounts/              # User authentication & profile management
│   ├── models.py          # User profile model
│   ├── prompts.py         # AI prompt templates (6+ document types)
│   └── views.py           # Authentication views
├── config/                # Django configuration
│   ├── settings.py        # Main Django settings
│   ├── urls.py            # URL routing
│   └── wsgi.py            # WSGI application
├── frontend/              # HTML/CSS/JavaScript frontend
│   ├── templates/         # HTML templates
│   │   ├── base.html
│   │   ├── editor.html    # WYSIWYG document editor
│   │   ├── dashboard.html
│   │   └── ...
│   └── static/            # Static files (CSS, JS, images)
│       ├── css/
│       ├── js/
│       └── images/
├── data/                  # Data storage
│   ├── templates/         # Document templates database
│   ├── regulations/       # Legal regulations for RAG
│   └── ...
├── logs/                  # Application logs
├── scripts/               # Utility scripts
│   ├── setup.py           # Initial setup script
│   ├── migrate.py         # Database migration helpers
│   └── ...
├── manage.py              # Django management script
├── requirement.txt        # Python dependencies
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── tong_hop_prompts.md    # Comprehensive prompt documentation
└── README.md              # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Document Management
- `GET /api/documents/` - List all documents
- `POST /api/documents/create` - Create new document
- `GET /api/documents/<id>/` - Get document details
- `PUT /api/documents/<id>/` - Update document
- `DELETE /api/documents/<id>/` - Delete document
- `POST /api/documents/<id>/export` - Export document

### AI Services
- `POST /api/ai/generate` - Generate document using AI
- `POST /api/ai/assist` - Edit & improve text
- `POST /api/ai/improve` - Analyze & suggest improvements
- `POST /api/ai/qa` - Query legal knowledge base

### Templates
- `GET /api/templates/` - List available templates
- `GET /api/templates/<id>/` - Get template details
- `POST /api/templates/` - Create custom template
- `DELETE /api/templates/<id>/` - Delete template

---

## 📋 Supported Document Types

| Document Type | Vietnamese | Use Case |
|---------------|-----------|----------|
| **Tờ Trình** | Proposal/Submission | Proposing initiatives, approvals, budgets |
| **Quyết Định** | Decision/Resolution | Official decisions, appointments, policies |
| **Công Văn** | Official Dispatch | Inter-agency communication, coordination |
| **Báo Cáo** | Report | Progress reports, status updates, results |
| **Đơn Từ** | Application/Form | Requests, applications, formal letters |
| **Thông Báo** | Notification | Announcements, schedule changes, notices |

All documents comply with **Decree 30/2020/NĐ-CP** (Vietnamese Government on regulations for formal documents).

---

## 🤖 AI Engine Configuration

### Option 1: OpenAI (Advanced Features)
Best for production use with high-quality outputs.

```bash
# Set in .env
OPENAI_API_KEY=sk-proj-your-key-here
```

### Option 2: Ollama (Free, Local & Offline)
Perfect for development and privacy-conscious deployments.

```bash
# Install Ollama from https://ollama.ai
ollama pull qwen2.5:3b
ollama serve  # Runs on localhost:11434

# Configure in .env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

---

## 🔐 Security Features

- ✅ **CSRF Protection**: Django built-in CSRF middleware
- ✅ **SQL Injection Prevention**: ORM parameterized queries
- ✅ **XSS Protection**: Automatic HTML escaping
- ✅ **OAuth2 Authentication**: Secure third-party login
- ✅ **Environment Variables**: Sensitive data in `.env` file
- ✅ **Session Management**: Secure session handling
- ✅ **Password Hashing**: PBKDF2 with SHA256

---

## 📊 Database Models

### User Model
```python
class UserProfile(models.Model):
    user = models.OneToOneField(User)
    full_name = models.CharField()
    title = models.CharField()  # Job title/position
    department = models.CharField()
    organization = models.CharField()
    phone_number = models.CharField()
    birth_date = models.DateField()
    avatar = models.ImageField()
    created_at = models.DateTimeField(auto_now_add=True)
```

### Document Model
```python
class Document(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField()
    document_type = models.CharField()  # Type selection
    content = models.TextField()  # HTML content
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)
```

---

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific test module
python manage.py test accounts

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

---

## 📝 Logging

Logs are stored in the `logs/` directory:

```bash
# View application logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log
```

---

## 🌐 Deployment

### Using Gunicorn (Production)

```bash
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Using Docker (Optional)

```dockerfile
FROM python:3.10
WORKDIR /app
COPY requirement.txt .
RUN pip install -r requirement.txt
COPY . .
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

```bash
docker build -t admin-docs .
docker run -p 8000:8000 admin-docs
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/Administrative-document-drafting-support-system.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Make your changes and commit**
   ```bash
   git add .
   git commit -m 'Add some AmazingFeature'
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open a Pull Request**
   - Describe your changes clearly
   - Link any related issues
   - Follow the existing code style

### Development Standards
- Write clear, documented code
- Include unit tests for new features
- Follow PEP 8 Python style guide
- Update this README if adding features

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request?

1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots/logs if applicable
3. **Label appropriately**: bug, enhancement, documentation, etc.

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

---

## 📧 Contact & Support

**Project Author**: [@DaoQuan03](https://github.com/DaoQuan03)

**Repository**: [Administrative-document-drafting-support-system](https://github.com/DaoQuan03/Administrative-document-drafting-support-system)

For questions, suggestions, or support:
- 📬 Open an issue on GitHub
- 💬 Leave a comment on discussions
- 📝 Review the documentation in `tong_hop_prompts.md`

---

## 📚 References

- [Decree 30/2020/NĐ-CP](https://thuvienphapluat.vn/) - Vietnamese Government Regulation on Administrative Documents
- [Django Documentation](https://docs.djangoproject.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/)
- [Ollama Documentation](https://github.com/ollama/ollama)

---

## 🙏 Acknowledgments

- Thanks to Django community for the excellent web framework
- Thanks to OpenAI and Ollama for AI capabilities
- Thanks to all contributors and users

---

# Tài Liệu Tiếng Việt

## 🎯 Tổng Quan

**Hệ Thống Hỗ Trợ Soạn Thảo Tài Liệu Hành Chính** là một ứng dụng web toàn diện được thiết kế để hỗ trợ quá trình tạo, quản lý và tối ưu hóa các tài liệu hành chính. Hệ thống được xây dựng phù hợp với **Nghị định 30/2020/NĐ-CP** của Chính phủ Việt Nam, đảm bảo tất cả các tài liệu được tạo ra đáp ứng tiêu chuẩn chính thức và các yêu cầu pháp lý.

### 🌟 Điểm Nổi Bật

- ✅ **Tạo Văn Bản Bằng AI**: T�� động tạo tài liệu hành chính với định dạng và cấu trúc đúng chuẩn
- ✅ **Mẫu Soạn Thảo Chuyên Biệt**: Các prompt được định cấu hình sẵn cho 6+ loại tài liệu
- ✅ **Hỗ Trợ Chỉnh Sửa Thời Gian Thực**: Trợ lý AI tích hợp để chỉnh sửa, kiểm tra chính tả và tối ưu hóa
- ✅ **Cơ Sở Dữ Liệu Pháp Lý (RAG)**: Trả lời các câu hỏi về quy định và yêu cầu tài liệu
- ✅ **Hỗ Trợ Đa Ngôn Ngữ**: Giao diện Tiếng Việt/Tiếng Anh
- ✅ **Xác Thực An Toàn**: Google OAuth2, Microsoft OAuth2, Xác thực Email/Mật khẩu
- ✅ **Đầu Ra Chuyên Nghiệp**: Định dạng HTML sạch tương thích với các trình soạn thảo hiện đại

---

## 🛠️ Ngôn Ngữ & Công Nghệ

| Thành Phần | Công Nghệ | Mục Đích |
|-----------|-----------|---------|
| **Backend** | Python, Django 4.2+ | API & Logic Kinh Doanh |
| **Frontend** | HTML, CSS, JavaScript | Giao Diện & Trình Soạn Thảo WYSIWYG |
| **Động Cơ AI** | OpenAI / Ollama | Sinh Tài Liệu Bằng LLM |
| **Email** | SMTP/Gmail | Thông Báo Người Dùng |
| **Cơ Sở Dữ Liệu** | Django ORM | Lưu Trữ Dữ Liệu |

### Thành Phần Ngôn Ngữ
```
HTML       39.5%  ▓▓▓▓▓▓▓▓░░ Markup tài liệu & mẫu
Python     24.8%  ▓▓▓▓▓░░░░░ Logic backend & tích hợp AI
CSS        24.0%  ▓▓▓▓▓░░░░░ Kiểu dáng & thiết kế đáp ứng
JavaScript 11.7%  ▓▓░░░░░░░░ Tương tác frontend
```

---

## 📦 Yêu Cầu Hệ Thống

Trước khi bắt đầu, hãy đảm bảo có các điều sau:

- **Python 3.7+** (khuyến nghị 3.10+)
- **pip** (Trình quản lý gói Python)
- **Git** để quản lý phiên bản
- **Trình duyệt Web Hiện Đại** (Chrome, Firefox, Safari, Edge)
- **Máy Chủ Email SMTP** (khuyến nghị tài khoản Gmail)

### Phụ Thuộc Tùy Chọn
- **OpenAI API Key** (cho các tính năng AI nâng cao)
- **Ollama** (cho suy luận LLM cục bộ, miễn phí & offline)
- **Thông Tin Xác Thực Google Cloud** (cho xác thực OAuth2)
- **Thông Tin Xác Thực Microsoft Azure** (cho tích hợp Teams)

---

## 🚀 Cài Đặt & Thiết Lập

### Bước 1: Clone Repository

```bash
git clone https://github.com/DaoQuan03/Administrative-document-drafting-support-system.git
cd Administrative-document-drafting-support-system
```

### Bước 2: Tạo Môi Trường Ảo

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Bước 3: Cài Đặt Phụ Thuộc

```bash
pip install -r requirement.txt
```

### Bước 4: Cấu Hình Biến Môi Trường

Sao chép `.env.example` sang `.env`:

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với thông tin của bạn:

```dotenv
# Cấu Hình Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=email-cua-ban@gmail.com
EMAIL_HOST_PASSWORD=mat-khau-ung-dung-gmail
DEFAULT_FROM_EMAIL="VănBảnAI <noreply@vanbanai.vn>"

# Google OAuth2 (Tùy Chọn)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/accounts/google/callback/

# Microsoft OAuth2 (Tùy Chọn)
MICROSOFT_CLIENT_ID=your-microsoft-id
MICROSOFT_CLIENT_SECRET=your-microsoft-secret
MICROSOFT_REDIRECT_URI=http://127.0.0.1:8000/accounts/microsoft/callback/

# Cấu Hình OpenAI (Tùy Chọn)
OPENAI_API_KEY=sk-proj-your-key-here

# Cấu Hình Ollama (Miễn Phí, LLM Cục Bộ)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

### Bước 5: Khởi Tạo Cơ Sở Dữ Liệu

```bash
python manage.py migrate
python manage.py createsuperuser  # Tạo tài khoản admin
```

### Bước 6: Chạy Máy Chủ Phát Triển

```bash
python manage.py runserver
```

Ứng dụng sẽ có sẵn tại: **http://127.0.0.1:8000**

---

## 📖 Hướng Dẫn Sử Dụng

### Tạo Tài Liệu Mới

1. **Đăng Nhập** vào tài khoản của bạn (Email, Google, hoặc Microsoft)
2. **Nhấp vào "Tài Liệu Mới"** từ bảng điều khiển chính
3. **Chọn Loại Tài Liệu**: Chọn từ:
   - 📄 **Tờ Trình** (Đề Xuất/Kiến Nghị)
   - ⚖️ **Quyết Định** (Quyết Định Hành Chính)
   - 📮 **Công Văn** (Công Văn Trao Đổi)
   - 📊 **Báo Cáo** (Báo Cáo Kết Quả)
   - 📋 **Đơn Từ** (Đơn/Đơn Đề Nghị)
   - 📢 **Thông Báo** (Thông Báo)
4. **Mô Tả Yêu Cầu Của Bạn**: Cung cấp chi tiết về nội dung tài liệu
5. **Tạo**: AI sẽ tự động tạo một tài liệu tuân thủ quy định
6. **Chỉnh Sửa**: Sử dụng trình soạn thảo tích hợp để tinh chỉnh tài liệu
7. **Lưu/Xuất**: Lưu vào hệ thống hoặc xuất dưới dạng PDF/DOCX

### Tính Năng Chỉnh Sửa Do AI Cung Cấp

- **✏️ Chỉnh Sửa & Cải Tiến**: Chọn văn bản và yêu cầu cải tiến
- **🔍 Kiểm Tra Tự Động**: Tự động phát hiện lỗi chính tả, ngữ pháp và định dạng
- **💡 Đề Xuất**: Nhận khuyến nghị về ngôn ngữ chuyên nghiệp
- **📋 Điền Tự Động**: Tự động điền thông tin cá nhân
- **❓ Đặt Câu Hỏi**: Truy vấn cơ sở dữ liệu pháp lý về quy định

### Tính Năng Nâng Cao

#### 🤖 Cơ Sở Dữ Liệu Pháp Lý (RAG)
Đặt câu hỏi về quy định hành chính Việt Nam:
- "Khi nào thì dùng quyết định thay vì công văn?"
- "Yêu cầu thẩm quyền cho tài liệu này là gì?"
- "Phần này nên được định dạng như thế nào?"

#### 📚 Quản Lý Mẫu
- Xem và quản lý các mẫu đã lưu
- Tạo mẫu tùy chỉnh từ các tài liệu hiện có
- Chia sẻ mẫu với các thành viên trong nhóm
- Tải xuống các bộ sưu tập mẫu

---

## 🏗️ Cấu Trúc Dự Án

```
Administrative-document-drafting-support-system/
├── accounts/              # Xác thực & quản lý hồ sơ người dùng
│   ├── models.py          # Mô hình hồ sơ người dùng
│   ├── prompts.py         # Mẫu prompt AI (6+ loại tài liệu)
│   └── views.py           # Các view xác thực
├── config/                # Cấu hình Django
│   ├── settings.py        # Cài đặt Django chính
│   ├── urls.py            # Định tuyến URL
│   └── wsgi.py            # Ứng dụng WSGI
├── frontend/              # Frontend HTML/CSS/JavaScript
│   ├── templates/         # Mẫu HTML
│   │   ├── base.html
│   │   ├── editor.html    # Trình soạn thảo WYSIWYG
│   │   ├── dashboard.html
│   │   └── ...
│   └── static/            # Tệp tĩnh (CSS, JS, hình ảnh)
│       ├── css/
│       ├── js/
│       └── images/
├── data/                  # Lưu trữ dữ liệu
│   ├── templates/         # Cơ sở dữ liệu mẫu
│   ├── regulations/       # Quy định pháp lý cho RAG
│   └── ...
├── logs/                  # Nhật ký ứng dụng
├── scripts/               # Script tiện ích
│   ├── setup.py           # Script thiết lập ban đầu
│   ├── migrate.py         # Trợ giúp di chuyển cơ sở dữ liệu
│   └── ...
├── manage.py              # Script quản lý Django
├── requirement.txt        # Phụ thuộc Python
├── .env.example           # Mẫu biến môi trường
├── .gitignore             # Quy tắc git ignore
├── tong_hop_prompts.md    # Tài liệu prompt toàn diện
└── README.md              # Tệp này
```

---

## 🔌 Điểm Cuối API

### Xác Thực
- `POST /api/auth/login` - Đăng nhập người dùng
- `POST /api/auth/register` - Đăng ký người dùng
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/profile` - Lấy hồ sơ người dùng
- `PUT /api/auth/profile` - Cập nhật hồ sơ

### Quản Lý Tài Liệu
- `GET /api/documents/` - Liệt kê tất cả tài liệu
- `POST /api/documents/create` - Tạo tài liệu mới
- `GET /api/documents/<id>/` - Lấy chi tiết tài liệu
- `PUT /api/documents/<id>/` - Cập nhật tài liệu
- `DELETE /api/documents/<id>/` - Xóa tài liệu
- `POST /api/documents/<id>/export` - Xuất tài liệu

### Dịch Vụ AI
- `POST /api/ai/generate` - Tạo tài liệu bằng AI
- `POST /api/ai/assist` - Chỉnh sửa & cải tiến văn bản
- `POST /api/ai/improve` - Phân tích & đề xuất cải tiến
- `POST /api/ai/qa` - Truy vấn cơ sở dữ liệu pháp lý

### Mẫu
- `GET /api/templates/` - Liệt kê mẫu có sẵn
- `GET /api/templates/<id>/` - Lấy chi tiết mẫu
- `POST /api/templates/` - Tạo mẫu tùy chỉnh
- `DELETE /api/templates/<id>/` - Xóa mẫu

---

## 📋 Loại Tài Liệu Được Hỗ Trợ

| Loại Tài Liệu | Tiếng Anh | Trường Hợp Sử Dụng |
|---------------|---------|---------|
| **Tờ Trình** | Proposal/Submission | Đề xuất sáng kiến, phê duyệt, ngân sách |
| **Quyết Định** | Decision/Resolution | Quyết định chính thức, bổ nhiệm, chính sách |
| **Công Văn** | Official Dispatch | Giao tiếp liên cơ quan, phối hợp |
| **Báo Cáo** | Report | Báo cáo tiến độ, cập nhật tình hình, kết quả |
| **Đơn Từ** | Application/Form | Yêu cầu, đơn xin, thư chính thức |
| **Thông Báo** | Notification | Thông báo, thay đổi lịch trình, tuyên bố |

Tất cả tài liệu tuân thủ **Nghị định 30/2020/NĐ-CP** (Quy định về thể thức, yêu cầu của văn bản hành chính).

---

## 🤖 Cấu Hình Động Cơ AI

### Tùy Chọn 1: OpenAI (Tính Năng Nâng Cao)
Tốt nhất cho sử dụng sản xuất với chất lượng đầu ra cao.

```bash
# Đặt trong .env
OPENAI_API_KEY=sk-proj-your-key-here
```

### Tùy Chọn 2: Ollama (Miễn Phí, Cục Bộ & Offline)
Hoàn hảo cho phát triển và triển khai có ý thức về quyền riêng tư.

```bash
# Cài đặt Ollama từ https://ollama.ai
ollama pull qwen2.5:3b
ollama serve  # Chạy trên localhost:11434

# Cấu hình trong .env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

---

## 🔐 Tính Năng Bảo Mật

- ✅ **Bảo Vệ CSRF**: Middleware CSRF tích hợp Django
- ✅ **Ngăn Chặn SQL Injection**: Truy vấn ORM được tham số hóa
- ✅ **Bảo Vệ XSS**: Thoát HTML tự động
- ✅ **Xác Thực OAuth2**: Đăng nhập bên thứ ba an toàn
- ✅ **Biến Môi Trường**: Dữ liệu nhạy cảm trong `.env`
- ✅ **Quản Lý Phiên**: Xử lý phiên an toàn
- ✅ **Băm Mật Khẩu**: PBKDF2 với SHA256

---

## 📊 Mô Hình Cơ Sở Dữ Liệu

### Mô Hình Người Dùng
```python
class UserProfile(models.Model):
    user = models.OneToOneField(User)
    full_name = models.CharField()  # Họ và tên
    title = models.CharField()  # Chức danh/Chức vụ
    department = models.CharField()  # Phòng/Ban
    organization = models.CharField()  # Cơ quan/Tổ chức
    phone_number = models.CharField()
    birth_date = models.DateField()
    avatar = models.ImageField()
    created_at = models.DateTimeField(auto_now_add=True)
```

### Mô Hình Tài Liệu
```python
class Document(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField()
    document_type = models.CharField()  # Loại tài liệu
    content = models.TextField()  # Nội dung HTML
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)
```

---

## 🧪 Kiểm Thử

```bash
# Chạy tất cả các bài kiểm thử
python manage.py test

# Chạy module kiểm thử cụ thể
python manage.py test accounts

# Chạy với coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

---

## 📝 Nhật Ký

Nhật ký được lưu trữ trong thư mục `logs/`:

```bash
# Xem nhật ký ứng dụng
tail -f logs/app.log

# Xem nhật ký lỗi
tail -f logs/error.log
```

---

## 🌐 Triển Khai

### Sử Dụng Gunicorn (Sản Xuất)

```bash
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Sử Dụng Docker (Tùy Chọn)

```dockerfile
FROM python:3.10
WORKDIR /app
COPY requirement.txt .
RUN pip install -r requirement.txt
COPY . .
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

```bash
docker build -t admin-docs .
docker run -p 8000:8000 admin-docs
```

---

## 🤝 Đóng Góp

Chúng tôi hoan nghênh những đóng góp! Vui lòng tuân theo các hướng dẫn sau:

1. **Fork Repository**
   ```bash
   git clone https://github.com/TEN-NGUOI-DUNG-CUA-BAN/Administrative-document-drafting-support-system.git
   ```

2. **Tạo Nhánh Tính Năng**
   ```bash
   git checkout -b feature/TinhNangTuyetVoi
   ```

3. **Thực Hiện Thay Đổi Và Commit**
   ```bash
   git add .
   git commit -m 'Thêm TinhNangTuyetVoi'
   ```

4. **Đẩy Lên Fork Của Bạn**
   ```bash
   git push origin feature/TinhNangTuyetVoi
   ```

5. **Mở Pull Request**
   - Mô tả các thay đổi của bạn rõ ràng
   - Liên kết các vấn đề liên quan
   - Tuân theo kiểu mã hiện có

### Tiêu Chuẩn Phát Triển
- Viết mã rõ ràng, có tài liệu đính kèm
- Bao gồm các bài kiểm thử đơn vị cho các tính năng mới
- Tuân theo hướng dẫn kiểu PEP 8 Python
- Cập nhật README này nếu thêm tính năng

---

## 🐛 Báo Cáo Lỗi & Yêu Cầu Tính Năng

Tìm thấy lỗi hoặc có yêu cầu tính năng?

1. **Kiểm tra các vấn đề hiện có** để tránh trùng lặp
2. **Tạo vấn đề mới** với:
   - Tiêu đề và mô tả rõ ràng
   - Các bước để tái tạo (đối với lỗi)
   - Hành vi mong đợi vs thực tế
   - Ảnh chụp màn hình/nhật ký nếu có liên quan
3. **Gắn nhãn thích hợp**: bug, enhancement, documentation, v.v.

---

## 📄 Giấy Phép

Dự án này được cấp phép theo **Giấy Phép MIT** - xem tệp LICENSE để biết chi tiết.

Quyền được cấp miễn phí, cho bất kỳ ai có được bản sao của phần mềm này để sử dụng, sao chép, sửa đổi, hợp nhất, xuất bản, phân phối, cấp phép con, và/hoặc bán các bản sao của Phần Mềm.

---

## 📧 Liên Hệ & Hỗ Trợ

**Tác Giả Dự Án**: [@DaoQuan03](https://github.com/DaoQuan03)

**Repository**: [Administrative-document-drafting-support-system](https://github.com/DaoQuan03/Administrative-document-drafting-support-system)

Để hỏi câu hỏi, đưa ra gợi ý hoặc nhận hỗ trợ:
- 📬 Mở một issue trên GitHub
- 💬 Để lại bình luận trên các thảo luận
- 📝 Xem tài liệu trong `tong_hop_prompts.md`

---

## 📚 Tài Liệu Tham Khảo

- [Nghị Định 30/2020/NĐ-CP](https://thuvienphapluat.vn/) - Quy Định của Chính Phủ Việt Nam Về Tài Liệu Hành Chính
- [Tài Liệu Django](https://docs.djangoproject.com/)
- [Tham Chiếu OpenAI API](https://platform.openai.com/docs/)
- [Tài Liệu Ollama](https://github.com/ollama/ollama)

---

## 🙏 Cảm Ơn

- Cảm ơn cộng đồng Django vì khung web tuyệt vời
- Cảm ơn OpenAI và Ollama vì các khả năng AI
- Cảm ơn tất cả những người đóng góp và người dùng

---

<div align="center">

### ⭐ If you find this project helpful, please consider giving it a star!

### ⭐ Nếu bạn thấy dự án này hữu ích, vui lòng xem xét cho nó một sao!

**Made with ❤️ by [@DaoQuan03](https://github.com/DaoQuan03)**

Last Updated: June 1, 2026 | Cập Nhật Lần Cuối: 1 tháng 6, 2026

</div>
