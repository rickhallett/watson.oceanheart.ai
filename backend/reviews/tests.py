import uuid
import time
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
from jose import jwt

from core.models import Document
from reviews.models import LLMOutput, Edit, Label, EditLabel
from reviews.services import (
    tokenize,
    compute_token_diff,
    compute_structural_diff,
    compute_diff_stats,
    compute_all_diffs,
    export_to_jsonl,
    export_to_csv,
    export_to_json,
    create_export_bundle,
    get_export_queryset,
)


# =============================================================================
# Test JWT Authentication Helpers
# =============================================================================

# Generate test RSA key pair for authentication
_test_private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)

TEST_PRIVATE_KEY = _test_private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.TraditionalOpenSSL,
    encryption_algorithm=serialization.NoEncryption()
).decode('utf-8')

TEST_PUBLIC_KEY = _test_private_key.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
).decode('utf-8')


def create_test_token(
    sub='test-user-123',
    email='test@example.com',
    role='clinician',
    exp_offset=3600,
):
    """Create a test JWT token for API authentication."""
    now = int(time.time())
    payload = {
        'sub': sub,
        'email': email,
        'role': role,
        'iat': now,
        'exp': now + exp_offset,
        'iss': 'https://passport.oceanheart.ai',
        'aud': 'watson.oceanheart.ai',
    }
    return jwt.encode(payload, TEST_PRIVATE_KEY, algorithm='RS256')


class AuthenticatedAPITestCase(APITestCase):
    """
    Base test case class that provides JWT authentication for API tests.

    All API test classes should inherit from this instead of APITestCase.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Start patches for JWT authentication
        cls.jwt_public_key_patcher = patch(
            'watson.middleware.jwt_auth.JWT_PUBLIC_KEY',
            TEST_PUBLIC_KEY
        )
        cls.passport_issuer_patcher = patch(
            'watson.middleware.jwt_auth.PASSPORT_ISSUER',
            'https://passport.oceanheart.ai'
        )
        cls.passport_audience_patcher = patch(
            'watson.middleware.jwt_auth.PASSPORT_AUDIENCE',
            'watson.oceanheart.ai'
        )
        cls.jwt_public_key_patcher.start()
        cls.passport_issuer_patcher.start()
        cls.passport_audience_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.jwt_public_key_patcher.stop()
        cls.passport_issuer_patcher.stop()
        cls.passport_audience_patcher.stop()
        super().tearDownClass()

    def setUp(self):
        super().setUp()
        # Create and set authentication token
        self.token = create_test_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')


class TokenizeTestCase(TestCase):
    """Tests for the tokenize function."""

    def test_tokenize_simple_text(self):
        """Test tokenizing simple text."""
        result = tokenize("Hello world")
        self.assertEqual(result, ["Hello", "world"])

    def test_tokenize_with_punctuation(self):
        """Test tokenizing text with punctuation."""
        result = tokenize("Hello, world!")
        self.assertEqual(result, ["Hello", ",", "world", "!"])

    def test_tokenize_empty_string(self):
        """Test tokenizing empty string."""
        result = tokenize("")
        self.assertEqual(result, [])

    def test_tokenize_complex_text(self):
        """Test tokenizing complex clinical text."""
        result = tokenize("Patient reports anxiety (moderate). Recommend CBT.")
        expected = ["Patient", "reports", "anxiety", "(", "moderate", ")", ".", "Recommend", "CBT", "."]
        self.assertEqual(result, expected)


class ComputeTokenDiffTestCase(TestCase):
    """Tests for the compute_token_diff function."""

    def test_identical_text(self):
        """Test diff of identical text."""
        result = compute_token_diff("Hello world", "Hello world")
        self.assertEqual(len(result['operations']), 1)
        self.assertEqual(result['operations'][0]['operation'], 'equal')

    def test_insertion(self):
        """Test text with insertion."""
        result = compute_token_diff("Hello world", "Hello beautiful world")
        operations = [op['operation'] for op in result['operations']]
        self.assertIn('insert', operations)

    def test_deletion(self):
        """Test text with deletion."""
        result = compute_token_diff("Hello beautiful world", "Hello world")
        operations = [op['operation'] for op in result['operations']]
        self.assertIn('delete', operations)

    def test_replacement(self):
        """Test text with replacement."""
        result = compute_token_diff("Hello world", "Hello universe")
        operations = [op['operation'] for op in result['operations']]
        self.assertIn('replace', operations)

    def test_token_counts(self):
        """Test token count tracking."""
        result = compute_token_diff("one two three", "one two three four")
        self.assertEqual(result['original_token_count'], 3)
        self.assertEqual(result['edited_token_count'], 4)


class ComputeStructuralDiffTestCase(TestCase):
    """Tests for the compute_structural_diff function."""

    def test_identical_objects(self):
        """Test diff of identical objects."""
        obj = {"key": "value"}
        result = compute_structural_diff(obj, obj)
        self.assertEqual(result, [])

    def test_added_key(self):
        """Test detecting added key."""
        original = {"a": 1}
        edited = {"a": 1, "b": 2}
        result = compute_structural_diff(original, edited)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['operation'], 'add')
        self.assertEqual(result[0]['path'], 'b')

    def test_deleted_key(self):
        """Test detecting deleted key."""
        original = {"a": 1, "b": 2}
        edited = {"a": 1}
        result = compute_structural_diff(original, edited)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['operation'], 'delete')
        self.assertEqual(result[0]['path'], 'b')

    def test_modified_value(self):
        """Test detecting modified value."""
        original = {"a": 1}
        edited = {"a": 2}
        result = compute_structural_diff(original, edited)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['operation'], 'modify')
        self.assertEqual(result[0]['old_value'], 1)
        self.assertEqual(result[0]['new_value'], 2)

    def test_nested_change(self):
        """Test detecting changes in nested structures."""
        original = {"outer": {"inner": "old"}}
        edited = {"outer": {"inner": "new"}}
        result = compute_structural_diff(original, edited)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['path'], 'outer.inner')

    def test_list_changes(self):
        """Test detecting changes in lists."""
        original = {"items": [1, 2, 3]}
        edited = {"items": [1, 2, 3, 4]}
        result = compute_structural_diff(original, edited)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['operation'], 'add')


class ComputeDiffStatsTestCase(TestCase):
    """Tests for the compute_diff_stats function."""

    def test_stats_no_changes(self):
        """Test stats for identical content."""
        token_diff = compute_token_diff("Hello world", "Hello world")
        structural_diff = []
        result = compute_diff_stats(token_diff, structural_diff)
        self.assertEqual(result['token_additions'], 0)
        self.assertEqual(result['token_deletions'], 0)
        self.assertEqual(result['change_rate'], 0)

    def test_stats_with_changes(self):
        """Test stats with changes."""
        token_diff = compute_token_diff("Hello world", "Hello beautiful world")
        structural_diff = [{'operation': 'add', 'path': 'new_key'}]
        result = compute_diff_stats(token_diff, structural_diff)
        self.assertGreater(result['token_additions'], 0)
        self.assertEqual(result['structural_additions'], 1)

    def test_change_rate_calculation(self):
        """Test change rate calculation."""
        token_diff = compute_token_diff("one two three four", "one five three four")
        structural_diff = []
        result = compute_diff_stats(token_diff, structural_diff)
        self.assertGreater(result['change_rate'], 0)
        self.assertLessEqual(result['change_rate'], 100)


class ComputeAllDiffsTestCase(TestCase):
    """Tests for the compute_all_diffs function."""

    def test_dict_content(self):
        """Test computing diffs for dict content."""
        original = {"summary": "Patient is anxious"}
        edited = {"summary": "Patient is moderately anxious"}
        token_diff, structural_diff, diff_stats = compute_all_diffs(original, edited)

        self.assertIn('operations', token_diff)
        self.assertIsInstance(structural_diff, list)
        self.assertIn('change_rate', diff_stats)

    def test_complex_json(self):
        """Test computing diffs for complex JSON."""
        original = {
            "assessment": {
                "mood": "anxious",
                "risk_level": "low"
            },
            "recommendations": ["CBT", "mindfulness"]
        }
        edited = {
            "assessment": {
                "mood": "moderately anxious",
                "risk_level": "low",
                "notes": "improving"
            },
            "recommendations": ["CBT", "mindfulness", "exercise"]
        }
        token_diff, structural_diff, diff_stats = compute_all_diffs(original, edited)

        self.assertGreater(len(structural_diff), 0)
        self.assertGreater(diff_stats['structural_additions'], 0)


class EditSubmitTestCase(TestCase):
    """Tests for the Edit.submit() method with diff computation."""

    def setUp(self):
        """Create test data."""
        self.document = Document.objects.create(
            title="Test Session Note",
            document_type="session_note",
            raw_content={"text": "Patient session notes here"}
        )
        self.llm_output = LLMOutput.objects.create(
            document=self.document,
            model_name="gpt-4-turbo",
            output_content={
                "summary": "Patient reports feeling anxious.",
                "recommendations": ["Continue therapy"]
            }
        )

    def test_submit_computes_diffs(self):
        """Test that submit() computes and stores diffs."""
        edit = Edit.objects.create(
            llm_output=self.llm_output,
            editor_name="Dr. Smith",
            edited_content={
                "summary": "Patient reports feeling moderately anxious with improvement.",
                "recommendations": ["Continue therapy", "Add mindfulness exercises"]
            }
        )

        # Verify initial state
        self.assertEqual(edit.status, Edit.Status.DRAFT)
        self.assertEqual(edit.token_diff, {})
        self.assertEqual(edit.structural_diff, {})
        self.assertEqual(edit.diff_stats, {})

        # Submit the edit
        edit.submit()

        # Refresh from database
        edit.refresh_from_db()

        # Verify diffs were computed
        self.assertEqual(edit.status, Edit.Status.SUBMITTED)
        self.assertIsNotNone(edit.submitted_at)
        self.assertIn('operations', edit.token_diff)
        self.assertIsInstance(edit.structural_diff, list)
        self.assertIn('change_rate', edit.diff_stats)

    def test_submit_with_no_changes(self):
        """Test submit with identical content."""
        edit = Edit.objects.create(
            llm_output=self.llm_output,
            editor_name="Dr. Smith",
            edited_content={
                "summary": "Patient reports feeling anxious.",
                "recommendations": ["Continue therapy"]
            }
        )

        edit.submit()
        edit.refresh_from_db()

        self.assertEqual(edit.status, Edit.Status.SUBMITTED)
        self.assertEqual(edit.diff_stats['change_rate'], 0)
        self.assertEqual(len(edit.structural_diff), 0)

    def test_submit_tracks_additions(self):
        """Test that submit tracks added content."""
        edit = Edit.objects.create(
            llm_output=self.llm_output,
            editor_name="Dr. Smith",
            edited_content={
                "summary": "Patient reports feeling anxious.",
                "recommendations": ["Continue therapy"],
                "risk_assessment": "Low risk"  # New field
            }
        )

        edit.submit()
        edit.refresh_from_db()

        self.assertGreater(edit.diff_stats['structural_additions'], 0)


# =============================================================================
# Model Tests
# =============================================================================

class LLMOutputModelTestCase(TestCase):
    """Tests for the LLMOutput model."""

    def setUp(self):
        self.document = Document.objects.create(
            title="Test Document",
            raw_content={"text": "Test content"}
        )

    def test_create_llm_output(self):
        """Test creating an LLM output."""
        output = LLMOutput.objects.create(
            document=self.document,
            model_name="gpt-4-turbo",
            model_version="2024-01",
            output_content={"summary": "Test summary"}
        )
        self.assertIsNotNone(output.id)
        self.assertIsInstance(output.id, uuid.UUID)
        self.assertEqual(output.model_name, "gpt-4-turbo")

    def test_llm_output_str(self):
        """Test LLM output string representation."""
        output = LLMOutput.objects.create(
            document=self.document,
            model_name="claude-3-opus",
            output_content={}
        )
        self.assertIn("claude-3-opus", str(output))

    def test_llm_output_document_relationship(self):
        """Test LLM output to document relationship."""
        output = LLMOutput.objects.create(
            document=self.document,
            model_name="gpt-4",
            output_content={}
        )
        self.assertEqual(output.document, self.document)
        self.assertIn(output, self.document.llm_outputs.all())

    def test_llm_output_cascade_delete(self):
        """Test that LLM outputs are deleted when document is deleted."""
        output = LLMOutput.objects.create(
            document=self.document,
            model_name="gpt-4",
            output_content={}
        )
        output_id = output.id
        self.document.delete()
        self.assertFalse(LLMOutput.objects.filter(id=output_id).exists())


class LabelModelTestCase(TestCase):
    """Tests for the Label model."""

    def test_create_label(self):
        """Test creating a label."""
        label = Label.objects.create(
            name="hallucination",
            display_name="Hallucination",
            description="Model generated false information",
            category="accuracy",
            severity="critical"
        )
        self.assertEqual(label.name, "hallucination")
        self.assertEqual(label.severity, "critical")

    def test_label_str(self):
        """Test label string representation."""
        label = Label.objects.create(
            name="test_label",
            display_name="Test Label"
        )
        self.assertEqual(str(label), "Test Label")

    def test_label_name_unique(self):
        """Test that label names are unique."""
        Label.objects.create(name="unique_label", display_name="Label 1")
        with self.assertRaises(Exception):
            Label.objects.create(name="unique_label", display_name="Label 2")

    def test_label_severity_choices(self):
        """Test label severity choices."""
        label = Label.objects.create(
            name="test",
            display_name="Test",
            severity="major"
        )
        self.assertIn(label.severity, ['critical', 'major', 'minor', 'info'])

    def test_label_default_values(self):
        """Test label default values."""
        label = Label.objects.create(name="test", display_name="Test")
        self.assertEqual(label.severity, "minor")
        self.assertEqual(label.color, "#6b7280")
        self.assertTrue(label.is_active)


class EditModelTestCase(TestCase):
    """Tests for the Edit model."""

    def setUp(self):
        self.document = Document.objects.create(
            title="Test Document",
            raw_content={"text": "Test content"}
        )
        self.llm_output = LLMOutput.objects.create(
            document=self.document,
            model_name="gpt-4",
            output_content={"summary": "Test"}
        )

    def test_create_edit(self):
        """Test creating an edit."""
        edit = Edit.objects.create(
            llm_output=self.llm_output,
            editor_name="Dr. Smith",
            edited_content={"summary": "Edited test"}
        )
        self.assertIsNotNone(edit.id)
        self.assertEqual(edit.status, Edit.Status.DRAFT)

    def test_edit_status_choices(self):
        """Test edit status choices."""
        edit = Edit.objects.create(
            llm_output=self.llm_output,
            edited_content={}
        )
        valid_statuses = ['draft', 'in_review', 'submitted', 'approved', 'rejected']
        self.assertIn(edit.status, valid_statuses)

    def test_edit_str(self):
        """Test edit string representation."""
        edit = Edit.objects.create(
            llm_output=self.llm_output,
            edited_content={}
        )
        self.assertIn("Edit", str(edit))
        self.assertIn("draft", str(edit))

    def test_edit_cascade_delete(self):
        """Test that edits are deleted when LLM output is deleted."""
        edit = Edit.objects.create(
            llm_output=self.llm_output,
            edited_content={}
        )
        edit_id = edit.id
        self.llm_output.delete()
        self.assertFalse(Edit.objects.filter(id=edit_id).exists())


class EditLabelModelTestCase(TestCase):
    """Tests for the EditLabel model."""

    def setUp(self):
        self.document = Document.objects.create(
            title="Test Document",
            raw_content={}
        )
        self.llm_output = LLMOutput.objects.create(
            document=self.document,
            model_name="gpt-4",
            output_content={}
        )
        self.edit = Edit.objects.create(
            llm_output=self.llm_output,
            edited_content={}
        )
        self.label = Label.objects.create(
            name="test_label",
            display_name="Test Label"
        )

    def test_create_edit_label(self):
        """Test creating an edit label association."""
        edit_label = EditLabel.objects.create(
            edit=self.edit,
            label=self.label,
            notes="Applied due to inaccuracy"
        )
        self.assertIsNotNone(edit_label.id)
        self.assertEqual(edit_label.notes, "Applied due to inaccuracy")

    def test_edit_label_unique_together(self):
        """Test that edit-label pairs are unique."""
        EditLabel.objects.create(edit=self.edit, label=self.label)
        with self.assertRaises(Exception):
            EditLabel.objects.create(edit=self.edit, label=self.label)

    def test_edit_label_str(self):
        """Test edit label string representation."""
        edit_label = EditLabel.objects.create(
            edit=self.edit,
            label=self.label
        )
        self.assertIn("test_label", str(edit_label))

    def test_many_to_many_through_model(self):
        """Test many-to-many relationship through EditLabel."""
        label2 = Label.objects.create(name="label2", display_name="Label 2")
        EditLabel.objects.create(edit=self.edit, label=self.label)
        EditLabel.objects.create(edit=self.edit, label=label2)

        self.assertEqual(self.edit.labels.count(), 2)
        self.assertIn(self.label, self.edit.labels.all())
        self.assertIn(label2, self.edit.labels.all())


# =============================================================================
# API Tests
# =============================================================================

class LLMOutputAPITestCase(AuthenticatedAPITestCase):
    """Tests for LLMOutput API endpoints."""

    def setUp(self):
        super().setUp()  # Sets up JWT authentication
        self.document = Document.objects.create(
            title="Test Document",
            raw_content={"text": "Content"}
        )
        self.output = LLMOutput.objects.create(
            document=self.document,
            model_name="gpt-4-turbo",
            output_content={"summary": "Test summary"}
        )

    def test_list_outputs(self):
        """Test listing LLM outputs."""
        url = reverse('output-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_retrieve_output(self):
        """Test retrieving a single LLM output."""
        url = reverse('output-detail', kwargs={'pk': self.output.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['model_name'], 'gpt-4-turbo')

    def test_create_output(self):
        """Test creating an LLM output."""
        url = reverse('output-list')
        data = {
            'document_id': str(self.document.id),
            'model_name': 'claude-3-opus',
            'output_content': {'summary': 'New summary'}
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LLMOutput.objects.count(), 2)


class LabelAPITestCase(AuthenticatedAPITestCase):
    """Tests for Label API endpoints."""

    def setUp(self):
        super().setUp()  # Sets up JWT authentication
        self.label = Label.objects.create(
            name="hallucination",
            display_name="Hallucination",
            category="accuracy",
            severity="critical"
        )

    def test_list_labels(self):
        """Test listing labels."""
        url = reverse('label-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_retrieve_label(self):
        """Test retrieving a single label."""
        url = reverse('label-detail', kwargs={'pk': self.label.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'hallucination')

    def test_create_label(self):
        """Test creating a label."""
        url = reverse('label-list')
        data = {
            'name': 'missing_risk',
            'display_name': 'Missing Risk Assessment',
            'category': 'safety',
            'severity': 'major'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Label.objects.count(), 2)


class EditAPITestCase(AuthenticatedAPITestCase):
    """Tests for Edit API endpoints."""

    def setUp(self):
        super().setUp()  # Sets up JWT authentication
        self.document = Document.objects.create(
            title="Test Document",
            raw_content={"text": "Content"}
        )
        self.llm_output = LLMOutput.objects.create(
            document=self.document,
            model_name="gpt-4",
            output_content={"summary": "Original summary"}
        )
        self.edit = Edit.objects.create(
            llm_output=self.llm_output,
            editor_name="Dr. Smith",
            edited_content={"summary": "Edited summary"}
        )

    def test_list_edits(self):
        """Test listing edits."""
        url = reverse('edit-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_retrieve_edit(self):
        """Test retrieving a single edit."""
        url = reverse('edit-detail', kwargs={'pk': self.edit.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['editor_name'], 'Dr. Smith')

    def test_create_edit(self):
        """Test creating an edit."""
        url = reverse('edit-list')
        data = {
            'llm_output_id': str(self.llm_output.id),
            'editor_name': 'Dr. Jones',
            'edited_content': {'summary': 'New edit'}
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Edit.objects.count(), 2)

    def test_update_edit(self):
        """Test updating an edit."""
        url = reverse('edit-detail', kwargs={'pk': self.edit.pk})
        data = {'editor_notes': 'Added clarification'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.edit.refresh_from_db()
        self.assertEqual(self.edit.editor_notes, 'Added clarification')

    def test_submit_edit_action(self):
        """Test the submit action on edit."""
        url = reverse('edit-submit', kwargs={'pk': self.edit.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.edit.refresh_from_db()
        self.assertEqual(self.edit.status, Edit.Status.SUBMITTED)

    def test_submit_non_draft_fails(self):
        """Test that submitting non-draft edit fails."""
        self.edit.status = Edit.Status.SUBMITTED
        self.edit.save()
        url = reverse('edit-submit', kwargs={'pk': self.edit.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AnalyticsAPITestCase(AuthenticatedAPITestCase):
    """Tests for Analytics API endpoint."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Disable throttling for analytics tests
        from reviews.views import AnalyticsView
        cls._original_throttle_classes = AnalyticsView.throttle_classes
        AnalyticsView.throttle_classes = []

    @classmethod
    def tearDownClass(cls):
        from reviews.views import AnalyticsView
        AnalyticsView.throttle_classes = cls._original_throttle_classes
        super().tearDownClass()

    def setUp(self):
        super().setUp()  # Sets up JWT authentication
        # Create test data
        self.document = Document.objects.create(
            title="Test Document",
            raw_content={}
        )
        self.llm_output = LLMOutput.objects.create(
            document=self.document,
            model_name="gpt-4",
            output_content={}
        )

    def test_get_analytics_empty(self):
        """Test getting analytics with no edits."""
        response = self.client.get('/api/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_edits'], 0)

    def test_get_analytics_with_data(self):
        """Test getting analytics with edits."""
        # Create some edits
        edit = Edit.objects.create(
            llm_output=self.llm_output,
            edited_content={"summary": "Test"},
            status=Edit.Status.SUBMITTED,
            diff_stats={"change_rate": 25.5}
        )
        response = self.client.get('/api/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_edits'], 1)

    def test_get_analytics_time_ranges(self):
        """Test analytics with different time ranges."""
        for time_range in ['7d', '30d', '90d']:
            response = self.client.get(f'/api/analytics/?range={time_range}')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('recent_activity', response.data)

    def test_analytics_response_structure(self):
        """Test analytics response has correct structure."""
        response = self.client.get('/api/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_edits', response.data)
        self.assertIn('average_edit_rate', response.data)
        self.assertIn('edits_by_status', response.data)
        self.assertIn('edits_by_model', response.data)
        self.assertIn('common_labels', response.data)
        self.assertIn('recent_activity', response.data)


# =============================================================================
# Export Tests
# =============================================================================

class ExportServiceTestCase(TestCase):
    """Tests for export service functions."""

    def setUp(self):
        self.document = Document.objects.create(
            title="Test Document",
            raw_content={"text": "Content"}
        )
        self.llm_output = LLMOutput.objects.create(
            document=self.document,
            model_name="gpt-4",
            output_content={"summary": "Test summary"}
        )
        self.edit = Edit.objects.create(
            llm_output=self.llm_output,
            editor_name="Dr. Smith",
            edited_content={"summary": "Edited summary"},
            status=Edit.Status.SUBMITTED,
            diff_stats={"change_rate": 25.5, "token_additions": 5}
        )
        self.label = Label.objects.create(
            name="hallucination",
            display_name="Hallucination"
        )
        EditLabel.objects.create(edit=self.edit, label=self.label)

    def test_export_to_jsonl(self):
        """Test JSONL export format."""
        edits = [self.edit]
        content = export_to_jsonl(edits)

        # Should be valid JSON per line
        lines = content.strip().split('\n')
        self.assertEqual(len(lines), 1)

        import json
        data = json.loads(lines[0])
        self.assertEqual(data['editor_name'], 'Dr. Smith')
        self.assertIn('labels', data)

    def test_export_to_csv(self):
        """Test CSV export format."""
        edits = [self.edit]
        content = export_to_csv(edits)

        # Should have header and data row
        lines = content.strip().split('\n')
        self.assertEqual(len(lines), 2)

        # Check header contains expected columns
        header = lines[0]
        self.assertIn('id', header)
        self.assertIn('editor_name', header)
        self.assertIn('change_rate', header)

    def test_export_to_json(self):
        """Test JSON export format."""
        edits = [self.edit]
        content = export_to_json(edits, '30d')

        import json
        data = json.loads(content)

        self.assertIn('metadata', data)
        self.assertIn('edits', data)
        self.assertEqual(data['metadata']['total_records'], 1)
        self.assertEqual(len(data['edits']), 1)

    def test_create_export_bundle(self):
        """Test ZIP bundle creation."""
        edits = [self.edit]
        zip_bytes, filename = create_export_bundle(edits, formats=['jsonl', 'csv'])

        # Should return bytes and filename
        self.assertIsInstance(zip_bytes, bytes)
        self.assertTrue(filename.startswith('watson_export_'))
        self.assertTrue(filename.endswith('.zip'))

        # Should be valid ZIP file
        import zipfile
        import io
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes), 'r')
        names = zf.namelist()
        self.assertIn('edits.jsonl', names)
        self.assertIn('edits.csv', names)
        self.assertIn('metadata.json', names)
        self.assertIn('README.md', names)

    def test_get_export_queryset_no_filter(self):
        """Test getting all edits for export."""
        edits = get_export_queryset()
        self.assertEqual(len(edits), 1)

    def test_get_export_queryset_with_status(self):
        """Test filtering by status."""
        edits = get_export_queryset(status='submitted')
        self.assertEqual(len(edits), 1)

        edits = get_export_queryset(status='draft')
        self.assertEqual(len(edits), 0)

    def test_export_empty_edits(self):
        """Test export with no edits."""
        Edit.objects.all().delete()
        edits = get_export_queryset()
        self.assertEqual(len(edits), 0)

        content = export_to_csv(edits)
        self.assertEqual(content, '')


class ExportAPITestCase(AuthenticatedAPITestCase):
    """Tests for Export API endpoints."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Disable throttling for export tests
        from reviews.views import ExportView
        cls._original_throttle_classes = ExportView.throttle_classes
        ExportView.throttle_classes = []

    @classmethod
    def tearDownClass(cls):
        from reviews.views import ExportView
        ExportView.throttle_classes = cls._original_throttle_classes
        super().tearDownClass()

    def setUp(self):
        super().setUp()  # Sets up JWT authentication
        self.document = Document.objects.create(
            title="Test Document",
            raw_content={"text": "Content"}
        )
        self.llm_output = LLMOutput.objects.create(
            document=self.document,
            model_name="gpt-4",
            output_content={"summary": "Test"}
        )
        self.edit = Edit.objects.create(
            llm_output=self.llm_output,
            editor_name="Dr. Smith",
            edited_content={"summary": "Edited"},
            status=Edit.Status.SUBMITTED
        )

    def test_export_jsonl(self):
        """Test JSONL format export."""
        response = self.client.get('/api/exports/?export_format=jsonl')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/x-ndjson')
        self.assertIn('edits.jsonl', response['Content-Disposition'])

    def test_export_csv(self):
        """Test CSV format export."""
        response = self.client.get('/api/exports/?export_format=csv')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('edits.csv', response['Content-Disposition'])

    def test_export_json(self):
        """Test JSON format export."""
        response = self.client.get('/api/exports/?export_format=json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/json')
        self.assertIn('edits.json', response['Content-Disposition'])

    def test_export_zip(self):
        """Test ZIP bundle export."""
        response = self.client.get('/api/exports/?export_format=zip')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/zip')
        self.assertIn('watson_export_', response['Content-Disposition'])

    def test_export_default_format(self):
        """Test default format is ZIP."""
        response = self.client.get('/api/exports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/zip')

    def test_export_with_time_range(self):
        """Test export with time range filter."""
        response = self.client.get('/api/exports/?export_format=jsonl&range=30d')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_export_invalid_format(self):
        """Test export with invalid format."""
        response = self.client.get('/api/exports/?export_format=invalid')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_export_no_data(self):
        """Test export when no edits match criteria."""
        response = self.client.get('/api/exports/?status=draft')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_export_post_custom(self):
        """Test POST export with custom options."""
        response = self.client.post(
            '/api/exports/',
            {'formats': ['jsonl', 'csv'], 'filters': {'range': 'all'}},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/zip')
