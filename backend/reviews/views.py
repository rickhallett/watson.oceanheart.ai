from datetime import timedelta

from django.shortcuts import render
from django.db.models import Avg, Count
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.views import APIView

from watson.middleware import JWTAuthentication
from .models import LLMOutput, Label, Edit, EditLabel


# Custom throttle classes for sensitive endpoints
class ExportRateThrottle(UserRateThrottle):
    """Limit export requests to prevent abuse."""
    rate = '10/hour'


class AnalyticsRateThrottle(UserRateThrottle):
    """Limit analytics requests."""
    rate = '60/minute'
from .serializers import (
    LLMOutputSerializer,
    LLMOutputListSerializer,
    LabelSerializer,
    EditSerializer,
    EditLabelSerializer,
)
from .services import (
    export_to_jsonl,
    export_to_csv,
    export_to_json,
    create_export_bundle,
    get_export_queryset,
)


class LLMOutputViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LLMOutput model.

    Provides CRUD operations for LLM-generated outputs.
    Requires JWT authentication.
    """
    queryset = LLMOutput.objects.select_related('document').all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
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
    Requires JWT authentication.
    """
    queryset = Label.objects.all()
    serializer_class = LabelSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'display_name', 'category']
    ordering_fields = ['name', 'category', 'severity']
    ordering = ['category', 'name']


class EditViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Edit model.

    Provides CRUD operations for clinician edits/revisions.
    Requires JWT authentication.
    """
    queryset = Edit.objects.select_related('llm_output', 'llm_output__document').prefetch_related('edit_labels__label').all()
    serializer_class = EditSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
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
    Requires JWT authentication.
    """
    queryset = EditLabel.objects.select_related('edit', 'label').all()
    serializer_class = EditLabelSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    ordering = ['-created_at']


class AnalyticsView(APIView):
    """
    Analytics endpoint for dashboard data.

    Returns aggregated statistics about edits, models, and labels.
    Requires JWT authentication. Rate limited to 60 requests/minute.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [AnalyticsRateThrottle]

    def get(self, request):
        # Get time range from query params
        time_range = request.query_params.get('range', '30d')

        # Calculate date threshold
        days_map = {'7d': 7, '30d': 30, '90d': 90}
        days = days_map.get(time_range, 30)
        date_threshold = timezone.now() - timedelta(days=days)

        # Filter edits by time range
        edits = Edit.objects.filter(created_at__gte=date_threshold)

        # Total edits count
        total_edits = edits.count()

        # Average edit rate (change_rate from diff_stats)
        avg_edit_rate = 0
        edits_with_stats = edits.exclude(diff_stats={})
        if edits_with_stats.exists():
            rates = [
                e.diff_stats.get('change_rate', 0)
                for e in edits_with_stats
                if e.diff_stats
            ]
            if rates:
                avg_edit_rate = sum(rates) / len(rates)

        # Edits by status
        edits_by_status = dict(
            edits.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )

        # Edits by model
        edits_by_model = list(
            edits.values('llm_output__model_name')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        edits_by_model_formatted = []
        for item in edits_by_model:
            model_name = item['llm_output__model_name'] or 'Unknown'
            model_edits = edits.filter(llm_output__model_name=model_name).exclude(diff_stats={})
            model_rates = [
                e.diff_stats.get('change_rate', 0)
                for e in model_edits
                if e.diff_stats
            ]
            avg_change_rate = sum(model_rates) / len(model_rates) if model_rates else 0
            edits_by_model_formatted.append({
                'model_name': model_name,
                'count': item['count'],
                'avg_change_rate': round(avg_change_rate, 2),
            })

        # Common labels
        common_labels = list(
            EditLabel.objects.filter(edit__in=edits)
            .values('label__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        total_labels = sum(l['count'] for l in common_labels) if common_labels else 1
        common_labels_formatted = [
            {
                'label_name': l['label__name'],
                'count': l['count'],
                'percentage': round((l['count'] / total_labels) * 100, 2),
            }
            for l in common_labels
        ]

        # Recent activity (edits per day for the time range)
        recent_activity = []
        for i in range(min(days, 30)):  # Limit to 30 days of daily data
            day = timezone.now().date() - timedelta(days=i)
            count = edits.filter(
                created_at__date=day
            ).count()
            recent_activity.append({
                'date': day.isoformat(),
                'count': count,
            })
        recent_activity.reverse()  # Chronological order

        return Response({
            'total_edits': total_edits,
            'average_edit_rate': round(avg_edit_rate, 2),
            'edits_by_status': edits_by_status,
            'edits_by_model': edits_by_model_formatted,
            'common_labels': common_labels_formatted,
            'recent_activity': recent_activity,
        })


class ExportView(APIView):
    """
    Export endpoint for research data.

    Supports multiple export formats: jsonl, csv, json, zip (bundle).
    Requires JWT authentication. Rate limited to 10 requests/hour.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    throttle_classes = [ExportRateThrottle]

    def get(self, request):
        """
        Export edits in the requested format.

        Query parameters:
        - export_format: Export format (jsonl, csv, json, zip). Default: zip
        - range: Time range filter (7d, 30d, 90d, all). Default: all
        - status: Filter by edit status
        - model: Filter by LLM model name
        """
        export_format = request.query_params.get('export_format', 'zip')
        time_range = request.query_params.get('range', 'all')
        status_filter = request.query_params.get('status')
        model_filter = request.query_params.get('model')

        # Get edits to export
        edits = get_export_queryset(
            time_range=time_range,
            status=status_filter,
            model_name=model_filter,
        )

        if not edits:
            return Response(
                {'error': 'No edits found matching the specified criteria'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generate export based on format
        if export_format == 'jsonl':
            content = export_to_jsonl(edits)
            response = HttpResponse(content, content_type='application/x-ndjson')
            response['Content-Disposition'] = 'attachment; filename="edits.jsonl"'
            return response

        elif export_format == 'csv':
            content = export_to_csv(edits)
            response = HttpResponse(content, content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="edits.csv"'
            return response

        elif export_format == 'json':
            content = export_to_json(edits, time_range)
            response = HttpResponse(content, content_type='application/json')
            response['Content-Disposition'] = 'attachment; filename="edits.json"'
            return response

        elif export_format == 'zip':
            zip_bytes, filename = create_export_bundle(
                edits,
                formats=['jsonl', 'csv', 'json'],
                time_range=time_range,
            )
            response = HttpResponse(zip_bytes, content_type='application/zip')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        else:
            return Response(
                {'error': f'Unsupported export_format: {export_format}. Use jsonl, csv, json, or zip.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def post(self, request):
        """
        Create an export with custom options.

        Request body:
        - formats: List of formats to include in bundle
        - filters: Object with filter criteria
        """
        formats = request.data.get('formats', ['jsonl', 'csv'])
        filters = request.data.get('filters', {})

        # Get edits based on filters
        edits = get_export_queryset(
            time_range=filters.get('range', 'all'),
            status=filters.get('status'),
            model_name=filters.get('model'),
        )

        if not edits:
            return Response(
                {'error': 'No edits found matching the specified criteria'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create bundle
        zip_bytes, filename = create_export_bundle(
            edits,
            formats=formats,
            time_range=filters.get('range'),
        )

        response = HttpResponse(zip_bytes, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
