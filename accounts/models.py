from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin hệ thống'),
        ('LEADER', 'Leader'),
        ('MEMBER', 'Người dùng thường'),
    ]
    
    email = models.EmailField('Email', unique=True)
    full_name = models.CharField('Họ và tên', max_length=150)
    role = models.CharField('Vai trò', max_length=20, choices=ROLE_CHOICES, default='MEMBER')
    organization = models.CharField('Tổ chức / Cơ quan', max_length=255, blank=True, default='Cá nhân')
    title = models.CharField('Chức danh', max_length=150, blank=True, null=True)
    department = models.CharField('Phòng ban', max_length=150, blank=True, null=True)
    birth_date = models.DateField('Ngày sinh', blank=True, null=True)
    phone_number = models.CharField('Số điện thoại', max_length=20, blank=True, default='')
    avatar = models.CharField('Ảnh đại diện', max_length=255, blank=True, default='')
    oauth_provider = models.CharField('Nhà cung cấp OAuth', max_length=50, blank=True, null=True)
    oauth_uid = models.CharField('ID duy nhất OAuth', max_length=255, blank=True, null=True)

    REQUIRED_FIELDS = ['email', 'full_name']

    def save(self, *args, **kwargs):
        if not self.organization:
            self.organization = 'Cá nhân'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.username} / {self.email})"


class Document(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Chưa hoàn thành'),
        ('DONE', 'Hoàn thành'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='documents', verbose_name='Người sở hữu')
    title = models.CharField('Tiêu đề tài liệu', max_length=255)
    content = models.TextField('Nội dung văn bản (HTML)', blank=True, default='')
    status = models.CharField('Trạng thái', max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    doc_date = models.DateField('Ngày tài liệu', default=timezone.now)
    created_at = models.DateTimeField('Ngày tạo', auto_now_add=True)
    updated_at = models.DateTimeField('Ngày cập nhật', auto_now=True)

    class Meta:
        verbose_name = 'Tài liệu'
        verbose_name_plural = 'Danh sách tài liệu'
        ordering = ['-updated_at']

    def __str__(self):
        return self.title


class KnowledgeBase(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='knowledge_bases', verbose_name='Người sở hữu')
    name = models.CharField('Tên kho tri thức', max_length=255)
    description = models.TextField('Mô tả', blank=True, default='')
    created_at = models.DateTimeField('Ngày tạo', auto_now_add=True)
    updated_at = models.DateTimeField('Ngày cập nhật', auto_now=True)

    class Meta:
        verbose_name = 'Kho tri thức'
        verbose_name_plural = 'Các kho tri thức'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class KnowledgeDocument(models.Model):
    STATUS_CHOICES = [
        ('indexing', 'Đang index'),
        ('active', 'Đã index'),
        ('error', 'Lỗi index'),
    ]

    kb = models.ForeignKey(KnowledgeBase, on_delete=models.CASCADE, related_name='documents', verbose_name='Kho tri thức')
    title = models.CharField('Tên tài liệu', max_length=255)
    file_name = models.CharField('Tên file', max_length=255, blank=True, default='')
    file_type = models.CharField('Loại tài liệu', max_length=50)  # PDF, DOCX, XLSX, TXT, HTML, etc.
    file_size = models.CharField('Kích thước file', max_length=50, blank=True, default='')
    status = models.CharField('Trạng thái', max_length=20, choices=STATUS_CHOICES, default='indexing')
    content = models.TextField('Nội dung văn bản thô', blank=True, default='')
    created_at = models.DateTimeField('Ngày thêm', auto_now_add=True)
    updated_at = models.DateTimeField('Ngày cập nhật', auto_now=True)

    class Meta:
        verbose_name = 'Tài liệu tri thức'
        verbose_name_plural = 'Các tài liệu tri thức'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

