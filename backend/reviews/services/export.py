"""
Export service for generating research datasets.

Supports JSONL and CSV export formats with optional ZIP bundling.
"""
import csv
import json
import io
import zipfile
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

from django.utils import timezone

from reviews.models import Edit, EditLabel


def generate_export_metadata(
    format_type: str,
    time_range: Optional[str] = None,
    total_records: int = 0,
) -> Dict[str, Any]:
    """Generate metadata for an export bundle."""
    return {
        "export_version": "1.0.0",
        "generated_at": timezone.now().isoformat(),
        "format": format_type,
        "time_range": time_range,
        "total_records": total_records,
        "schema_version": "1.0",
        "source": "watson.oceanheart.ai",
    }


def edit_to_dict(edit: Edit) -> Dict[str, Any]:
    """Convert an Edit model instance to a dictionary for export."""
    # Get labels for this edit
    labels = list(
        EditLabel.objects.filter(edit=edit)
        .select_related('label')
        .values(
            'label__name',
            'label__display_name',
            'label__category',
            'label__severity',
            'notes',
            'content_path',
        )
    )

    return {
        "id": str(edit.id),
        "llm_output_id": str(edit.llm_output_id),
        "document_id": str(edit.llm_output.document_id),
        "model_name": edit.llm_output.model_name,
        "model_version": edit.llm_output.model_version,
        "editor_id": edit.editor_id,
        "editor_name": edit.editor_name,
        "status": edit.status,
        "original_content": edit.llm_output.output_content,
        "edited_content": edit.edited_content,
        "token_diff": edit.token_diff,
        "structural_diff": edit.structural_diff,
        "diff_stats": edit.diff_stats,
        "editor_notes": edit.editor_notes,
        "reviewer_notes": edit.reviewer_notes,
        "labels": [
            {
                "name": label['label__name'],
                "display_name": label['label__display_name'],
                "category": label['label__category'],
                "severity": label['label__severity'],
                "notes": label['notes'],
                "content_path": label['content_path'],
            }
            for label in labels
        ],
        "created_at": edit.created_at.isoformat(),
        "updated_at": edit.updated_at.isoformat(),
        "submitted_at": edit.submitted_at.isoformat() if edit.submitted_at else None,
    }


def edit_to_flat_dict(edit: Edit) -> Dict[str, Any]:
    """Convert an Edit to a flat dictionary for CSV export."""
    labels = list(
        EditLabel.objects.filter(edit=edit)
        .select_related('label')
        .values_list('label__name', flat=True)
    )

    diff_stats = edit.diff_stats or {}

    return {
        "id": str(edit.id),
        "llm_output_id": str(edit.llm_output_id),
        "document_id": str(edit.llm_output.document_id),
        "model_name": edit.llm_output.model_name,
        "model_version": edit.llm_output.model_version,
        "editor_id": edit.editor_id,
        "editor_name": edit.editor_name,
        "status": edit.status,
        "token_additions": diff_stats.get("token_additions", 0),
        "token_deletions": diff_stats.get("token_deletions", 0),
        "token_unchanged": diff_stats.get("token_unchanged", 0),
        "change_rate": diff_stats.get("change_rate", 0),
        "original_token_count": diff_stats.get("original_token_count", 0),
        "edited_token_count": diff_stats.get("edited_token_count", 0),
        "structural_additions": diff_stats.get("structural_additions", 0),
        "structural_deletions": diff_stats.get("structural_deletions", 0),
        "structural_modifications": diff_stats.get("structural_modifications", 0),
        "total_structural_changes": diff_stats.get("total_structural_changes", 0),
        "labels": "|".join(labels),
        "label_count": len(labels),
        "editor_notes": edit.editor_notes,
        "reviewer_notes": edit.reviewer_notes,
        "created_at": edit.created_at.isoformat(),
        "updated_at": edit.updated_at.isoformat(),
        "submitted_at": edit.submitted_at.isoformat() if edit.submitted_at else "",
    }


def export_to_jsonl(edits: List[Edit]) -> str:
    """Export edits to JSONL format (one JSON object per line)."""
    lines = []
    for edit in edits:
        edit_dict = edit_to_dict(edit)
        lines.append(json.dumps(edit_dict, ensure_ascii=False))
    return "\n".join(lines)


def export_to_csv(edits: List[Edit]) -> str:
    """Export edits to CSV format."""
    if not edits:
        return ""

    # Get all flat dicts
    rows = [edit_to_flat_dict(edit) for edit in edits]

    # Get fieldnames from first row
    fieldnames = list(rows[0].keys())

    # Write to string buffer
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

    return output.getvalue()


def export_to_json(edits: List[Edit], time_range: Optional[str] = None) -> str:
    """Export edits to full JSON format with metadata."""
    data = {
        "metadata": generate_export_metadata(
            format_type="json",
            time_range=time_range,
            total_records=len(edits),
        ),
        "edits": [edit_to_dict(edit) for edit in edits],
    }
    return json.dumps(data, indent=2, ensure_ascii=False)


def create_export_bundle(
    edits: List[Edit],
    formats: List[str] = ["jsonl", "csv"],
    time_range: Optional[str] = None,
) -> Tuple[bytes, str]:
    """
    Create a ZIP bundle containing exports in multiple formats.

    Args:
        edits: List of Edit objects to export
        formats: List of formats to include (jsonl, csv, json)
        time_range: Optional time range for metadata

    Returns:
        Tuple of (zip_bytes, filename)
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"watson_export_{timestamp}.zip"

    # Create in-memory ZIP file
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Add metadata file
        metadata = generate_export_metadata(
            format_type="bundle",
            time_range=time_range,
            total_records=len(edits),
        )
        metadata["included_formats"] = formats
        zf.writestr(
            "metadata.json",
            json.dumps(metadata, indent=2)
        )

        # Add exports in requested formats
        if "jsonl" in formats:
            jsonl_content = export_to_jsonl(edits)
            zf.writestr("edits.jsonl", jsonl_content)

        if "csv" in formats:
            csv_content = export_to_csv(edits)
            zf.writestr("edits.csv", csv_content)

        if "json" in formats:
            json_content = export_to_json(edits, time_range)
            zf.writestr("edits.json", json_content)

        # Add a README
        readme = """# Watson Export Bundle

## Contents

- `metadata.json` - Export metadata and generation info
- `edits.jsonl` - JSONL format (one JSON object per line)
- `edits.csv` - CSV format (flattened for analysis)
- `edits.json` - Full JSON format with nested structures

## Schema Version

This export uses schema version 1.0.

## Fields

### Diff Statistics
- `token_additions`: Number of tokens added
- `token_deletions`: Number of tokens removed
- `token_unchanged`: Number of unchanged tokens
- `change_rate`: Percentage of content modified
- `structural_additions`: Number of JSON keys/items added
- `structural_deletions`: Number of JSON keys/items removed
- `structural_modifications`: Number of values modified

### Labels
Labels are stored as pipe-separated values in CSV format.
In JSON/JSONL formats, labels are stored as arrays with full metadata.

## Generated by Watson
https://watson.oceanheart.ai
"""
        zf.writestr("README.md", readme)

    zip_buffer.seek(0)
    return zip_buffer.getvalue(), filename


def get_export_queryset(
    time_range: Optional[str] = None,
    status: Optional[str] = None,
    model_name: Optional[str] = None,
) -> List[Edit]:
    """
    Get edits for export based on filters.

    Args:
        time_range: Time range filter (7d, 30d, 90d, all)
        status: Filter by edit status
        model_name: Filter by LLM model name

    Returns:
        List of Edit objects
    """
    from datetime import timedelta

    queryset = Edit.objects.select_related(
        'llm_output',
        'llm_output__document'
    ).prefetch_related(
        'edit_labels__label'
    )

    # Apply time range filter
    if time_range and time_range != 'all':
        days_map = {'7d': 7, '30d': 30, '90d': 90}
        days = days_map.get(time_range, 30)
        threshold = timezone.now() - timedelta(days=days)
        queryset = queryset.filter(created_at__gte=threshold)

    # Apply status filter
    if status:
        queryset = queryset.filter(status=status)

    # Apply model filter
    if model_name:
        queryset = queryset.filter(llm_output__model_name=model_name)

    return list(queryset.order_by('-created_at'))
