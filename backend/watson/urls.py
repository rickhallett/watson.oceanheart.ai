"""
URL configuration for watson project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import health_check, readiness_check, DocumentViewSet
from reviews.views import LLMOutputViewSet, LabelViewSet, EditViewSet, EditLabelViewSet, AnalyticsView, ExportView

# Create API router
router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'outputs', LLMOutputViewSet, basename='output')
router.register(r'labels', LabelViewSet, basename='label')
router.register(r'edits', EditViewSet, basename='edit')
router.register(r'edit-labels', EditLabelViewSet, basename='edit-label')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health_check'),
    path('ready/', readiness_check, name='readiness_check'),
    path('api/', include(router.urls)),
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),
    path('api/exports/', ExportView.as_view(), name='exports'),
]
