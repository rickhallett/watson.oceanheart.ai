"""
Tests for core app models and views.
"""
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

from .models import Document


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
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
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
        self.token = create_test_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')


class DocumentModelTestCase(TestCase):
    """Tests for the Document model."""

    def test_create_document_with_required_fields(self):
        """Test creating a document with only required fields."""
        doc = Document.objects.create(
            raw_content={"text": "Test content"}
        )
        self.assertIsNotNone(doc.id)
        self.assertIsInstance(doc.id, uuid.UUID)
        self.assertEqual(doc.raw_content, {"text": "Test content"})

    def test_create_document_with_all_fields(self):
        """Test creating a document with all fields."""
        doc = Document.objects.create(
            title="Test Document",
            source="test_system",
            document_type="session_note",
            raw_content={"text": "Test content", "sections": []},
            metadata={"patient_id": "12345"}
        )
        self.assertEqual(doc.title, "Test Document")
        self.assertEqual(doc.source, "test_system")
        self.assertEqual(doc.document_type, "session_note")
        self.assertEqual(doc.metadata, {"patient_id": "12345"})

    def test_document_str_with_title(self):
        """Test document string representation with title."""
        doc = Document.objects.create(
            title="My Document",
            raw_content={}
        )
        self.assertIn("My Document", str(doc))

    def test_document_str_without_title(self):
        """Test document string representation without title."""
        doc = Document.objects.create(raw_content={})
        self.assertIn("Untitled", str(doc))

    def test_document_ordering(self):
        """Test that documents are ordered by created_at descending."""
        doc1 = Document.objects.create(title="First", raw_content={})
        doc2 = Document.objects.create(title="Second", raw_content={})
        doc3 = Document.objects.create(title="Third", raw_content={})

        docs = list(Document.objects.all())
        self.assertEqual(docs[0].title, "Third")
        self.assertEqual(docs[1].title, "Second")
        self.assertEqual(docs[2].title, "First")

    def test_document_timestamps(self):
        """Test that timestamps are auto-populated."""
        doc = Document.objects.create(raw_content={})
        self.assertIsNotNone(doc.created_at)
        self.assertIsNotNone(doc.updated_at)

    def test_document_metadata_defaults_to_empty_dict(self):
        """Test that metadata defaults to empty dict."""
        doc = Document.objects.create(raw_content={})
        self.assertEqual(doc.metadata, {})


class DocumentAPITestCase(AuthenticatedAPITestCase):
    """Tests for Document API endpoints. Requires JWT authentication."""

    def setUp(self):
        super().setUp()  # Sets up authentication
        self.doc1 = Document.objects.create(
            title="Test Doc 1",
            source="test",
            document_type="note",
            raw_content={"text": "Content 1"}
        )
        self.doc2 = Document.objects.create(
            title="Test Doc 2",
            source="test",
            document_type="assessment",
            raw_content={"text": "Content 2"}
        )

    def test_list_documents(self):
        """Test listing all documents."""
        url = reverse('document-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_retrieve_document(self):
        """Test retrieving a single document."""
        url = reverse('document-detail', kwargs={'pk': self.doc1.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Doc 1')

    def test_create_document(self):
        """Test creating a new document."""
        url = reverse('document-list')
        data = {
            'title': 'New Document',
            'source': 'api_test',
            'document_type': 'intake',
            'raw_content': {'text': 'New content'}
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.count(), 3)

    def test_update_document(self):
        """Test updating a document."""
        url = reverse('document-detail', kwargs={'pk': self.doc1.pk})
        data = {'title': 'Updated Title'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.doc1.refresh_from_db()
        self.assertEqual(self.doc1.title, 'Updated Title')

    def test_delete_document(self):
        """Test deleting a document."""
        url = reverse('document-detail', kwargs={'pk': self.doc1.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Document.objects.count(), 1)

    def test_search_documents(self):
        """Test searching documents by title."""
        url = reverse('document-list')
        response = self.client.get(url, {'search': 'Doc 1'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Doc 1')


class HealthCheckTestCase(APITestCase):
    """Tests for health check endpoints."""

    def test_health_check(self):
        """Test health check endpoint."""
        response = self.client.get('/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['status'], 'healthy')

    def test_readiness_check(self):
        """Test readiness check endpoint."""
        response = self.client.get('/ready/')
        # Readiness might return 200 or 503 depending on static files
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        self.assertIn('ready', response.json())
