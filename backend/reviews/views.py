from django.shortcuts import render
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import LLMOutput, Label, Edit, EditLabel
from .serializers import (
    LLMOutputSerializer,
    LLMOutputListSerializer,
    LabelSerializer,
    EditSerializer,
    EditLabelSerializer,
)


class LLMOutputViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LLMOutput model.

    Provides CRUD operations for LLM-generated outputs.
    """
    queryset = LLMOutput.objects.select_related('document').all()
    permission_classes = [AllowAny]  # TODO: Add proper auth
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['model_name', 'document__title']
    ordering_fields = ['created_at', 'model_name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return LLMOutputListSerializer
        return LLMOutputSerializer


class LabelViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Label model.

    Provides CRUD operations for issue type labels.
    """
    queryset = Label.objects.all()
    serializer_class = LabelSerializer
    permission_classes = [AllowAny]  # TODO: Add proper auth
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'display_name', 'category']
    ordering_fields = ['name', 'category', 'severity']
    ordering = ['category', 'name']


class EditViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Edit model.

    Provides CRUD operations for clinician edits/revisions.
    """
    queryset = Edit.objects.select_related('llm_output', 'llm_output__document').prefetch_related('edit_labels__label').all()
    serializer_class = EditSerializer
    permission_classes = [AllowAny]  # TODO: Add proper auth
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['editor_name', 'editor_id', 'status']
    ordering_fields = ['created_at', 'updated_at', 'status']
    ordering = ['-updated_at']

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit an edit for review."""
        edit = self.get_object()
        if edit.status != Edit.Status.DRAFT:
            return Response(
                {'error': 'Only draft edits can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        edit.submit()
        serializer = self.get_serializer(edit)
        return Response(serializer.data)


class EditLabelViewSet(viewsets.ModelViewSet):
    """
    ViewSet for EditLabel model.

    Provides CRUD operations for labels applied to edits.
    """
    queryset = EditLabel.objects.select_related('edit', 'label').all()
    serializer_class = EditLabelSerializer
    permission_classes = [AllowAny]  # TODO: Add proper auth
    ordering = ['-created_at']
