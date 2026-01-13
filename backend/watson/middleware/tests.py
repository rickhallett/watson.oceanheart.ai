"""
Tests for JWT authentication middleware.
"""
import time
import json
from unittest.mock import patch, MagicMock

from django.test import TestCase, RequestFactory
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from jose import jwt

from .jwt_auth import (
    JWTAuthentication,
    JWTAuthenticationMiddleware,
    JWTUser,
    verify_jwt_token,
    clear_jwks_cache,
)


# Generate test RSA key pair dynamically for testing
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

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
    sub='user-123',
    email='test@example.com',
    role='clinician',
    exp_offset=3600,  # 1 hour from now
    iss='https://passport.oceanheart.ai',
    aud='watson.oceanheart.ai',
):
    """Create a test JWT token."""
    now = int(time.time())
    payload = {
        'sub': sub,
        'email': email,
        'role': role,
        'iat': now,
        'exp': now + exp_offset,
        'iss': iss,
        'aud': aud,
    }
    return jwt.encode(payload, TEST_PRIVATE_KEY, algorithm='RS256')


class JWTUserTestCase(TestCase):
    """Tests for JWTUser class."""

    def test_create_user_from_payload(self):
        """Test creating JWTUser from payload."""
        payload = {
            'sub': 'user-123',
            'email': 'test@example.com',
            'role': 'clinician',
        }
        user = JWTUser(payload)

        self.assertEqual(user.id, 'user-123')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'clinician')
        self.assertTrue(user.is_authenticated)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_anonymous)

    def test_user_str(self):
        """Test JWTUser string representation."""
        user = JWTUser({'sub': 'user-123', 'email': 'test@example.com'})
        self.assertEqual(str(user), 'test@example.com')

    def test_user_pk(self):
        """Test JWTUser primary key."""
        user = JWTUser({'sub': 'user-123'})
        self.assertEqual(user.pk, 'user-123')


class VerifyJWTTokenTestCase(TestCase):
    """Tests for verify_jwt_token function."""

    def setUp(self):
        clear_jwks_cache()

    @patch('watson.middleware.jwt_auth.JWT_PUBLIC_KEY', TEST_PUBLIC_KEY)
    @patch('watson.middleware.jwt_auth.PASSPORT_ISSUER', 'https://passport.oceanheart.ai')
    @patch('watson.middleware.jwt_auth.PASSPORT_AUDIENCE', 'watson.oceanheart.ai')
    def test_verify_valid_token(self):
        """Test verifying a valid token."""
        token = create_test_token()
        is_valid, payload, error = verify_jwt_token(token)

        self.assertTrue(is_valid)
        self.assertIsNotNone(payload)
        self.assertIsNone(error)
        self.assertEqual(payload['sub'], 'user-123')
        self.assertEqual(payload['email'], 'test@example.com')

    @patch('watson.middleware.jwt_auth.JWT_PUBLIC_KEY', TEST_PUBLIC_KEY)
    @patch('watson.middleware.jwt_auth.PASSPORT_ISSUER', 'https://passport.oceanheart.ai')
    @patch('watson.middleware.jwt_auth.PASSPORT_AUDIENCE', 'watson.oceanheart.ai')
    def test_verify_expired_token(self):
        """Test verifying an expired token."""
        token = create_test_token(exp_offset=-3600)  # Expired 1 hour ago
        is_valid, payload, error = verify_jwt_token(token)

        self.assertFalse(is_valid)
        self.assertIsNone(payload)
        self.assertIn('expired', error.lower())

    def test_verify_no_token(self):
        """Test verifying with no token."""
        is_valid, payload, error = verify_jwt_token('')
        self.assertFalse(is_valid)
        self.assertIsNone(payload)
        self.assertEqual(error, 'No token provided')

    @patch('watson.middleware.jwt_auth.JWT_PUBLIC_KEY', TEST_PUBLIC_KEY)
    def test_verify_invalid_signature(self):
        """Test verifying a token with invalid signature."""
        # Create token with a different key (not the one we're verifying against)
        other_private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        other_key_pem = other_private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        bad_token = jwt.encode(
            {'sub': 'hacker', 'exp': int(time.time()) + 3600},
            other_key_pem,
            algorithm='RS256'
        )
        is_valid, payload, error = verify_jwt_token(bad_token)
        self.assertFalse(is_valid)


class JWTAuthenticationTestCase(TestCase):
    """Tests for JWTAuthentication DRF class."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.auth = JWTAuthentication()
        clear_jwks_cache()

    @patch('watson.middleware.jwt_auth.JWT_PUBLIC_KEY', TEST_PUBLIC_KEY)
    @patch('watson.middleware.jwt_auth.PASSPORT_ISSUER', 'https://passport.oceanheart.ai')
    @patch('watson.middleware.jwt_auth.PASSPORT_AUDIENCE', 'watson.oceanheart.ai')
    def test_authenticate_valid_token(self):
        """Test authenticating with valid Bearer token."""
        token = create_test_token()
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'

        result = self.auth.authenticate(request)

        self.assertIsNotNone(result)
        user, returned_token = result
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(returned_token, token)

    def test_authenticate_no_header(self):
        """Test authenticating with no Authorization header."""
        request = self.factory.get('/')
        result = self.auth.authenticate(request)
        self.assertIsNone(result)

    def test_authenticate_non_bearer_header(self):
        """Test authenticating with non-Bearer Authorization."""
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = 'Basic dXNlcjpwYXNz'
        result = self.auth.authenticate(request)
        self.assertIsNone(result)

    @patch('watson.middleware.jwt_auth.JWT_PUBLIC_KEY', TEST_PUBLIC_KEY)
    @patch('watson.middleware.jwt_auth.PASSPORT_ISSUER', 'https://passport.oceanheart.ai')
    @patch('watson.middleware.jwt_auth.PASSPORT_AUDIENCE', 'watson.oceanheart.ai')
    def test_authenticate_expired_token_raises(self):
        """Test that expired token raises AuthenticationFailed."""
        from rest_framework.exceptions import AuthenticationFailed

        token = create_test_token(exp_offset=-3600)
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'

        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request)

    def test_authenticate_header(self):
        """Test WWW-Authenticate header value."""
        request = self.factory.get('/')
        header = self.auth.authenticate_header(request)
        self.assertEqual(header, 'Bearer realm="watson-api"')


class JWTAuthenticationMiddlewareTestCase(TestCase):
    """Tests for JWTAuthenticationMiddleware."""

    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = JWTAuthenticationMiddleware(lambda r: r)
        clear_jwks_cache()

    def test_public_path_skipped(self):
        """Test that public paths are not authenticated."""
        request = self.factory.get('/health/')
        result = self.middleware(request)

        # Should pass through without jwt_user
        self.assertFalse(hasattr(request, 'jwt_user') and request.jwt_user is not None)

    @patch('watson.middleware.jwt_auth.JWT_PUBLIC_KEY', TEST_PUBLIC_KEY)
    @patch('watson.middleware.jwt_auth.PASSPORT_ISSUER', 'https://passport.oceanheart.ai')
    @patch('watson.middleware.jwt_auth.PASSPORT_AUDIENCE', 'watson.oceanheart.ai')
    def test_valid_token_sets_user(self):
        """Test that valid token sets jwt_user on request."""
        token = create_test_token()
        request = self.factory.get('/some/protected/path/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'

        self.middleware(request)

        self.assertIsNotNone(request.jwt_user)
        self.assertEqual(request.jwt_user.email, 'test@example.com')

    @patch('watson.middleware.jwt_auth.JWT_PUBLIC_KEY', TEST_PUBLIC_KEY)
    def test_invalid_token_sets_error(self):
        """Test that invalid token sets jwt_error on request."""
        request = self.factory.get('/some/protected/path/')
        request.META['HTTP_AUTHORIZATION'] = 'Bearer invalid.token.here'

        self.middleware(request)

        self.assertIsNone(request.jwt_user)
        self.assertTrue(hasattr(request, 'jwt_error'))


class IntegrationTestCase(TestCase):
    """Integration tests for JWT authentication with DRF views."""

    def setUp(self):
        self.factory = APIRequestFactory()
        clear_jwks_cache()

    @patch('watson.middleware.jwt_auth.JWT_PUBLIC_KEY', TEST_PUBLIC_KEY)
    @patch('watson.middleware.jwt_auth.PASSPORT_ISSUER', 'https://passport.oceanheart.ai')
    @patch('watson.middleware.jwt_auth.PASSPORT_AUDIENCE', 'watson.oceanheart.ai')
    def test_protected_view_with_valid_token(self):
        """Test accessing protected view with valid token."""
        class ProtectedView(APIView):
            authentication_classes = [JWTAuthentication]
            permission_classes = [IsAuthenticated]

            def get(self, request):
                return Response({'user': str(request.user)})

        token = create_test_token()
        request = self.factory.get('/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'

        view = ProtectedView.as_view()
        response = view(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user'], 'test@example.com')

    @patch('watson.middleware.jwt_auth.JWT_PUBLIC_KEY', TEST_PUBLIC_KEY)
    def test_protected_view_without_token(self):
        """Test accessing protected view without token."""
        class ProtectedView(APIView):
            authentication_classes = [JWTAuthentication]
            permission_classes = [IsAuthenticated]

            def get(self, request):
                return Response({'user': str(request.user)})

        request = self.factory.get('/')

        view = ProtectedView.as_view()
        response = view(request)

        self.assertEqual(response.status_code, 401)
