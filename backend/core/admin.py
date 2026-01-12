from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'document_type', 'source', 'created_at']
    list_filter = ['document_type', 'source', 'created_at']
    search_fields = ['title', 'id']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']

    fieldsets = (
        (None, {
            'fields': ('id', 'title', 'document_type', 'source')
        }),
        ('Content', {
            'fields': ('raw_content', 'metadata'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
