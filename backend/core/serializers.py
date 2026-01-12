from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for Document model."""

    class Meta:
        model = Document
        fields = [
            'id',
            'title',
            'source',
            'document_type',
            'raw_content',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for Document lists."""

    class Meta:
        model = Document
        fields = [
            'id',
            'title',
            'source',
            'document_type',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
