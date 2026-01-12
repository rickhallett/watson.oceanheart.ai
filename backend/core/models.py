import uuid
from django.db import models


class Document(models.Model):
    """
    Source clinical note containing raw JSON data.

    This represents the original clinical documentation that will be
    processed by LLM models to generate summaries for review.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Document metadata
    title = models.CharField(max_length=255, blank=True)
    source = models.CharField(
        max_length=100,
        blank=True,
        help_text="Source system or origin of the document"
    )
    document_type = models.CharField(
        max_length=50,
        blank=True,
        help_text="Type of clinical document (e.g., session_note, intake, assessment)"
    )

    # Raw content stored as JSON
    raw_content = models.JSONField(
        help_text="Raw JSON content of the clinical note"
    )

    # Optional metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata about the document"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Document"
        verbose_name_plural = "Documents"

    def __str__(self):
        return f"{self.title or 'Untitled'} ({self.id})"
