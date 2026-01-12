from django.contrib import admin
from .models import LLMOutput, Label, Edit, EditLabel


class EditLabelInline(admin.TabularInline):
    model = EditLabel
    extra = 1
    autocomplete_fields = ['label']


@admin.register(LLMOutput)
class LLMOutputAdmin(admin.ModelAdmin):
    list_display = ['id', 'document', 'model_name', 'model_version', 'created_at']
    list_filter = ['model_name', 'created_at']
    search_fields = ['id', 'model_name', 'document__title']
    readonly_fields = ['id', 'created_at']
    autocomplete_fields = ['document']
    ordering = ['-created_at']

    fieldsets = (
        (None, {
            'fields': ('id', 'document', 'model_name', 'model_version')
        }),
        ('Content', {
            'fields': ('output_content', 'raw_response'),
        }),
        ('Generation Info', {
            'fields': ('prompt_template', 'generation_params'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name', 'category', 'severity', 'is_active', 'color']
    list_filter = ['category', 'severity', 'is_active']
    search_fields = ['name', 'display_name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['category', 'name']

    fieldsets = (
        (None, {
            'fields': ('id', 'name', 'display_name', 'description')
        }),
        ('Classification', {
            'fields': ('category', 'severity'),
        }),
        ('Display', {
            'fields': ('color', 'icon', 'is_active'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Edit)
class EditAdmin(admin.ModelAdmin):
    list_display = ['id', 'llm_output', 'editor_name', 'status', 'created_at', 'submitted_at']
    list_filter = ['status', 'created_at', 'submitted_at']
    search_fields = ['id', 'editor_id', 'editor_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'submitted_at', 'token_diff', 'structural_diff', 'diff_stats']
    autocomplete_fields = ['llm_output']
    inlines = [EditLabelInline]
    ordering = ['-updated_at']

    fieldsets = (
        (None, {
            'fields': ('id', 'llm_output', 'status')
        }),
        ('Editor', {
            'fields': ('editor_id', 'editor_name'),
        }),
        ('Content', {
            'fields': ('edited_content',),
        }),
        ('Diffs', {
            'fields': ('token_diff', 'structural_diff', 'diff_stats'),
            'classes': ('collapse',)
        }),
        ('Notes', {
            'fields': ('editor_notes', 'reviewer_notes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'submitted_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EditLabel)
class EditLabelAdmin(admin.ModelAdmin):
    list_display = ['id', 'edit', 'label', 'created_at']
    list_filter = ['label', 'created_at']
    search_fields = ['edit__id', 'label__name', 'notes']
    readonly_fields = ['id', 'created_at']
    autocomplete_fields = ['edit', 'label']
    ordering = ['-created_at']
