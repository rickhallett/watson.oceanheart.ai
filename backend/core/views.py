from django.shortcuts import render
from django.http import JsonResponse
from django.db import connection
from django.conf import settings
import time

from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny

from .models import Document
from .serializers import DocumentSerializer, DocumentListSerializer


def health_check(request):
    """Health check endpoint for monitoring and load balancers"""
    
    health_data = {
        "status": "healthy",
        "timestamp": int(time.time()),
        "service": "watson-api",
        "version": "1.0.0"
    }
    
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            health_data["database"] = "connected"
    except Exception as e:
        health_data["status"] = "unhealthy"
        health_data["database"] = f"error: {str(e)}"
        return JsonResponse(health_data, status=503)
    
    # Check if in debug mode (should be False in production)
    health_data["debug_mode"] = settings.DEBUG
    
    # Add any additional health checks here
    return JsonResponse(health_data)


def readiness_check(request):
    """Readiness check for Kubernetes/container orchestration"""
    
    readiness_data = {
        "ready": True,
        "timestamp": int(time.time()),
        "checks": {}
    }
    
    try:
        # Database readiness
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM django_migrations")
            migration_count = cursor.fetchone()[0]
            readiness_data["checks"]["migrations"] = f"{migration_count} applied"
            
        # Check if static files are collected
        import os
        static_root = getattr(settings, 'STATIC_ROOT', None)
        if static_root and os.path.exists(static_root):
            readiness_data["checks"]["static_files"] = "available"
        else:
            readiness_data["checks"]["static_files"] = "missing"
            readiness_data["ready"] = False
            
    except Exception as e:
        readiness_data["ready"] = False
        readiness_data["error"] = str(e)
        return JsonResponse(readiness_data, status=503)
    
    status_code = 200 if readiness_data["ready"] else 503
    return JsonResponse(readiness_data, status=status_code)


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Document model.

    Provides CRUD operations for clinical documents.
    """
    queryset = Document.objects.all()
    permission_classes = [AllowAny]  # TODO: Add proper auth
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'source', 'document_type']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentListSerializer
        return DocumentSerializer
