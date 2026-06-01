from django.urls import path
from . import views

urlpatterns = [
    # Static HTML serving and Auth Middleware views
    path('', views.serve_html_page, name='home_root'),
    path('html/', views.serve_html_page, name='html_root'),
    path('html/<str:page_name>', views.serve_html_page, name='serve_html_page'),
    
    # API endpoints
    path('api/login/', views.api_login, name='api_login'),
    path('api/register/', views.api_register, name='api_register'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/profile/update/', views.api_update_profile, name='api_update_profile'),
    path('api/profile/upload-avatar/', views.api_upload_avatar, name='api_upload_avatar'),
    
    # OTP verification APIs
    path('api/register/send-code/', views.api_register_send_code, name='api_register_send_code'),
    path('api/register/verify/', views.api_register_verify, name='api_register_verify'),
    
    # Social OAuth views & APIs
    path('accounts/google/login/', views.google_login, name='google_login'),
    path('accounts/google/callback/', views.google_callback, name='google_callback'),
    path('accounts/microsoft/login/', views.microsoft_login, name='microsoft_login'),
    path('accounts/microsoft/callback/', views.microsoft_callback, name='microsoft_callback'),
    path('api/oauth/register/', views.api_oauth_register, name='api_oauth_register'),
    
    # Document Management APIs
    path('api/documents/', views.api_list_documents, name='api_list_documents'),
    path('api/documents/save/', views.api_save_document, name='api_save_document'),
    path('api/documents/ai-assist/', views.api_ai_assist, name='api_ai_assist'),
    path('api/documents/ai-improve/', views.api_ai_improve, name='api_ai_improve'),
    path('api/documents/<int:doc_id>/', views.api_get_document, name='api_get_document'),
    path('api/documents/<int:doc_id>/delete/', views.api_delete_document, name='api_delete_document'),
    path('api/documents/<int:doc_id>/export/docx/', views.api_export_docx, name='api_export_docx'),
    
    # AI Intelligent Search APIs
    path('api/search/', views.api_search, name='api_search'),
    path('api/search/generate-template/', views.api_generate_template, name='api_generate_template'),
    path('api/search/get-document/', views.api_get_document_text, name='api_get_document_text'),
    
    # Knowledge Base CRUD APIs
    path('api/kb/', views.api_list_kb, name='api_list_kb'),
    path('api/kb/create/', views.api_create_kb, name='api_create_kb'),
    path('api/kb/<int:kb_id>/', views.api_delete_kb, name='api_delete_kb'),
    path('api/kb/<int:kb_id>/documents/', views.api_list_kb_documents, name='api_list_kb_documents'),
    path('api/kb/<int:kb_id>/upload/', views.api_upload_kb_documents, name='api_upload_kb_documents'),
    path('api/kb/<int:kb_id>/save-draft/', views.api_save_editor_to_kb, name='api_save_editor_to_kb'),
    path('api/kb/document/<int:doc_id>/', views.api_delete_kb_document, name='api_delete_kb_document'),
    path('api/kb/document/<int:doc_id>/content/', views.api_get_kb_document_content, name='api_get_kb_document_content'),
    
    # Admin system knowledge upload
    path('api/admin/kb/upload/', views.api_upload_system_document, name='api_upload_system_document'),
]

