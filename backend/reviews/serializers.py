from rest_framework import serializers
from .models import LLMOutput, Label, Edit, EditLabel
from core.serializers import DocumentSerializer, DocumentListSerializer


class LLMOutputSerializer(serializers.ModelSerializer):
    """Serializer for LLMOutput model."""
    document = DocumentListSerializer(read_only=True)
    document_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = LLMOutput
        fields = [
            'id',
            'document',
            'document_id',
            'model_name',
            'model_version',
            'output_content',
            'raw_response',
            'prompt_template',
            'generation_params',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        document_id = validated_data.pop('document_id')
        from core.models import Document
        document = Document.objects.get(id=document_id)
        return LLMOutput.objects.create(document=document, **validated_data)


class LLMOutputListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for LLMOutput lists."""
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = LLMOutput
        fields = [
            'id',
            'document_id',
            'document_title',
            'model_name',
            'model_version',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class LabelSerializer(serializers.ModelSerializer):
    """Serializer for Label model."""

    class Meta:
        model = Label
        fields = [
            'id',
            'name',
            'display_name',
            'description',
            'category',
            'severity',
            'color',
            'icon',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EditLabelSerializer(serializers.ModelSerializer):
    """Serializer for EditLabel model."""
    label = LabelSerializer(read_only=True)
    label_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = EditLabel
        fields = [
            'id',
            'label',
            'label_id',
            'notes',
            'content_path',
            'start_offset',
            'end_offset',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class EditSerializer(serializers.ModelSerializer):
    """Serializer for Edit model."""
    llm_output = LLMOutputListSerializer(read_only=True)
    llm_output_id = serializers.UUIDField(write_only=True)
    edit_labels = EditLabelSerializer(many=True, read_only=True)

    class Meta:
        model = Edit
        fields = [
            'id',
            'llm_output',
            'llm_output_id',
            'editor_id',
            'editor_name',
            'edited_content',
            'token_diff',
            'structural_diff',
            'diff_stats',
            'status',
            'editor_notes',
            'reviewer_notes',
            'edit_labels',
            'created_at',
            'updated_at',
            'submitted_at',
        ]
        read_only_fields = [
            'id',
            'token_diff',
            'structural_diff',
            'diff_stats',
            'created_at',
            'updated_at',
            'submitted_at',
        ]

    def create(self, validated_data):
        llm_output_id = validated_data.pop('llm_output_id')
        llm_output = LLMOutput.objects.get(id=llm_output_id)
        return Edit.objects.create(llm_output=llm_output, **validated_data)
