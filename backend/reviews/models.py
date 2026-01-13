import uuid
from django.db import models
from django.conf import settings

from core.models import Document


class LLMOutput(models.Model):
    """
    Model-generated summary tied to a Document.

    Stores the output from an LLM that processed a clinical document,
    which will be reviewed and potentially edited by clinicians.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Link to source document
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='llm_outputs'
    )

    # Model information
    model_name = models.CharField(
        max_length=100,
        help_text="Name of the LLM model (e.g., gpt-4-turbo, claude-3-opus)"
    )
    model_version = models.CharField(
        max_length=50,
        blank=True,
        help_text="Version or snapshot identifier"
    )

    # Generated content
    output_content = models.JSONField(
        help_text="Structured JSON output from the LLM"
    )
    raw_response = models.TextField(
        blank=True,
        help_text="Raw text response from the LLM"
    )

    # Generation metadata
    prompt_template = models.CharField(
        max_length=100,
        blank=True,
        help_text="Identifier for the prompt template used"
    )
    generation_params = models.JSONField(
        default=dict,
        blank=True,
        help_text="Parameters used for generation (temperature, max_tokens, etc.)"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "LLM Output"
        verbose_name_plural = "LLM Outputs"

    def __str__(self):
        return f"{self.model_name} output for {self.document_id}"


class Label(models.Model):
    """
    Taxonomy of issue types for classifying edits.

    Examples: hallucination, missing_risk, clinical_inaccuracy,
    formatting_issue, cultural_insensitivity, etc.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Label identification
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Machine-readable label name (e.g., hallucination, missing_risk)"
    )
    display_name = models.CharField(
        max_length=150,
        help_text="Human-readable display name"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of what this label indicates"
    )

    # Categorization
    category = models.CharField(
        max_length=50,
        blank=True,
        help_text="Category grouping (e.g., accuracy, safety, style)"
    )
    severity = models.CharField(
        max_length=20,
        choices=[
            ('critical', 'Critical'),
            ('major', 'Major'),
            ('minor', 'Minor'),
            ('info', 'Informational'),
        ],
        default='minor',
        help_text="Severity level of issues with this label"
    )

    # Display
    color = models.CharField(
        max_length=7,
        default='#6b7280',
        help_text="Hex color for UI display"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="Icon identifier for UI"
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this label is available for use"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']
        verbose_name = "Label"
        verbose_name_plural = "Labels"

    def __str__(self):
        return self.display_name


class Edit(models.Model):
    """
    Clinician revision of an LLM output.

    Tracks the full editing workflow: draft → submitted,
    storing diffs, edited content, and status.
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        IN_REVIEW = 'in_review', 'In Review'
        SUBMITTED = 'submitted', 'Submitted'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Link to LLM output being edited
    llm_output = models.ForeignKey(
        LLMOutput,
        on_delete=models.CASCADE,
        related_name='edits'
    )

    # Editor information (optional if using auth)
    editor_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="ID of the clinician/editor (from auth system)"
    )
    editor_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Display name of the editor"
    )

    # Edited content
    edited_content = models.JSONField(
        help_text="The edited/revised JSON content"
    )

    # Diff data (computed on submit)
    token_diff = models.JSONField(
        default=dict,
        blank=True,
        help_text="Token-level diff between original and edited"
    )
    structural_diff = models.JSONField(
        default=dict,
        blank=True,
        help_text="Structural/JSON diff between original and edited"
    )
    diff_stats = models.JSONField(
        default=dict,
        blank=True,
        help_text="Statistics about the diff (additions, deletions, change rate)"
    )

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    # Notes
    editor_notes = models.TextField(
        blank=True,
        help_text="Notes from the editor about the changes"
    )
    reviewer_notes = models.TextField(
        blank=True,
        help_text="Notes from reviewer (if applicable)"
    )

    # Labels applied to this edit (through EditLabel)
    labels = models.ManyToManyField(
        Label,
        through='EditLabel',
        related_name='edits',
        blank=True
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the edit was submitted for review"
    )

    class Meta:
        ordering = ['-updated_at']
        verbose_name = "Edit"
        verbose_name_plural = "Edits"

    def __str__(self):
        return f"Edit {self.id} ({self.status})"

    def submit(self):
        """Submit the edit and compute diffs."""
        from django.utils import timezone
        from .services import compute_all_diffs

        # Get original content from the LLM output
        original_content = self.llm_output.output_content

        # Compute all diffs
        token_diff, structural_diff, diff_stats = compute_all_diffs(
            original_content,
            self.edited_content
        )

        # Store diff results
        self.token_diff = token_diff
        self.structural_diff = structural_diff
        self.diff_stats = diff_stats

        # Update status and timestamp
        self.status = self.Status.SUBMITTED
        self.submitted_at = timezone.now()
        self.save()


class EditLabel(models.Model):
    """
    Join table connecting Edits to Labels.

    Allows tracking which labels were applied to each edit,
    with optional metadata about the label application.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    edit = models.ForeignKey(
        Edit,
        on_delete=models.CASCADE,
        related_name='edit_labels'
    )
    label = models.ForeignKey(
        Label,
        on_delete=models.CASCADE,
        related_name='edit_labels'
    )

    # Optional context for why this label was applied
    notes = models.TextField(
        blank=True,
        help_text="Notes about why this label was applied"
    )

    # Location in the content (optional)
    content_path = models.CharField(
        max_length=255,
        blank=True,
        help_text="JSON path to the relevant content section"
    )
    start_offset = models.IntegerField(
        null=True,
        blank=True,
        help_text="Start character offset in raw text"
    )
    end_offset = models.IntegerField(
        null=True,
        blank=True,
        help_text="End character offset in raw text"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['edit', 'label']
        verbose_name = "Edit Label"
        verbose_name_plural = "Edit Labels"

    def __str__(self):
        return f"{self.edit_id} - {self.label.name}"
