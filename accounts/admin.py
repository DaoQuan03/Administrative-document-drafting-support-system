from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Document, KnowledgeBase, KnowledgeDocument

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'full_name', 'role', 'organization', 'department', 'is_staff', 'is_active']
    list_filter = ['role', 'is_staff', 'is_superuser', 'is_active']
    search_fields = ['username', 'email', 'full_name', 'organization']
    ordering = ['username']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Thông tin vai trò & Tổ chức', {'fields': ('full_name', 'role', 'organization', 'title', 'department')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Thông tin vai trò & Tổ chức', {'fields': ('email', 'full_name', 'role', 'organization', 'title', 'department')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'status', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at', 'updated_at']
    search_fields = ['title', 'content', 'user__full_name', 'user__username']
    ordering = ['-updated_at']

@admin.register(KnowledgeBase)
class KnowledgeBaseAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name', 'description', 'user__full_name', 'user__username']
    ordering = ['-created_at']

@admin.register(KnowledgeDocument)
class KnowledgeDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'kb', 'file_type', 'file_size', 'status', 'created_at']
    list_filter = ['status', 'file_type', 'created_at']
    search_fields = ['title', 'content', 'kb__name', 'kb__user__full_name', 'kb__user__username']
    ordering = ['-created_at']


