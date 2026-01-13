"""
JWT Authentication for Watson API.

Implements RS256 JWT verification for passport.oceanheart.ai tokens.
Provides both Django middleware and DRF authentication class.
"""
import os
import json
import logging
import threading
from datetime import datetime, timedelta
from typing import Optional, Tuple, Any
from functools import wraps

import requests
from django.conf import settings
from django.http import JsonResponse
from rest_framework import authentication, exceptions
from jose import jwt, JWTError, jwk
from jose.exceptions import JWKError

logger = logging.getLogger(__name__)


# Configuration
PASSPORT_ISSUER = os.environ.get('PASSPORT_ISSUER', 'https://passport.oceanheart.ai')
PASSPORT_JWKS_URL = os.environ.get('PASSPORT_JWKS_URL', f'{PASSPORT_ISSUER}/.well-known/jwks.json')
PASSPORT_AUDIENCE = os.environ.get('PASSPORT_AUDIENCE', 'watson.oceanheart.ai')

# For development/testing - can be set to skip remote JWKS fetch
JWT_PUBLIC_KEY = os.environ.get('JWT_PUBLIC_KEY', None)

# JWKS cache configuration
JWKS_CACHE_TTL_SECONDS = int(os.environ.get('JWKS_CACHE_TTL_SECONDS', 3600))  # 1 hour default


# Thread-safe JWKS cache with time-based expiration
class JWKSCache:
    """Thread-safe cache for JWKS keys with time-based expiration."""

    def __init__(self, ttl_seconds: int = 3600):
        self._keys: Optional[dict] = None
        self._expires_at: Optional[datetime] = None
        self._ttl = timedelta(seconds=ttl_seconds)
        self._lock = threading.Lock()

    def get(self) -> Optional[dict]:
        """Get cached keys if not expired."""
        with self._lock:
            if self._keys is None:
                return None
            if self._expires_at and datetime.now() > self._expires_at:
                logger.debug("JWKS cache expired")
                return None
            return self._keys

    def set(self, keys: dict) -> None:
        """Set cached keys with expiration."""
        with self._lock:
            self._keys = keys
            self._expires_at = datetime.now() + self._ttl
            logger.debug(f"JWKS cache set, expires at {self._expires_at}")

    def clear(self) -> None:
        """Clear the cache."""
        with self._lock:
            self._keys = None
            self._expires_at = None
            logger.debug("JWKS cache cleared")


_jwks_cache = JWKSCache(ttl_seconds=JWKS_CACHE_TTL_SECONDS)


class JWTUser:
    """
    User object created from JWT claims.
    Compatible with Django's user interface for DRF.
    """
    def __init__(self, payload: dict):
        self.id = payload.get('sub', '')
        self.email = payload.get('email', '')
        self.role = payload.get('role', 'user')
        self.claims = payload
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False

    @property
    def pk(self):
        return self.id

    def __str__(self):
        return self.email or self.id

    def get_username(self):
        return self.email or self.id


def get_jwks_keys() -> dict:
    """
    Fetch and cache JWKS from passport.oceanheart.ai.

    Uses time-based cache with configurable TTL (default: 1 hour).
    This ensures key rotation is picked up within the TTL period.
    """
    # If a static public key is configured, use it (for testing)
    if JWT_PUBLIC_KEY:
        logger.debug("Using configured JWT_PUBLIC_KEY")
        return {'static_key': JWT_PUBLIC_KEY}

    # Check cache first
    cached = _jwks_cache.get()
    if cached is not None:
        logger.debug("Using cached JWKS keys")
        return cached

    # Fetch fresh keys
    try:
        logger.info(f"Fetching JWKS from {PASSPORT_JWKS_URL}")
        response = requests.get(PASSPORT_JWKS_URL, timeout=10)
        response.raise_for_status()
        jwks = response.json()
        logger.info(f"Successfully fetched JWKS with {len(jwks.get('keys', []))} keys")

        # Cache the keys
        _jwks_cache.set(jwks)
        return jwks
    except requests.RequestException as e:
        logger.error(f"Failed to fetch JWKS: {e}")
        # Return cached keys if available (even if expired) as fallback
        if _jwks_cache._keys is not None:
            logger.warning("Using expired JWKS cache as fallback")
            return _jwks_cache._keys
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JWKS JSON: {e}")
        return {}


def clear_jwks_cache():
    """Clear the JWKS cache to force a refresh on next request."""
    _jwks_cache.clear()


def get_public_key(token: str) -> Optional[Any]:
    """
    Get the public key for verifying the JWT.
    Matches the key ID (kid) from the token header with JWKS.
    """
    # If static key is configured, return it
    if JWT_PUBLIC_KEY:
        return JWT_PUBLIC_KEY

    try:
        # Get the key ID from the token header
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')

        if not kid:
            logger.warning("No 'kid' in token header")
            return None

        # Get JWKS and find matching key
        jwks = get_jwks_keys()
        keys = jwks.get('keys', [])

        for key in keys:
            if key.get('kid') == kid:
                try:
                    return jwk.construct(key)
                except JWKError as e:
                    logger.error(f"Failed to construct key: {e}")
                    return None

        logger.warning(f"No matching key found for kid: {kid}")
        return None

    except JWTError as e:
        logger.error(f"Failed to get unverified header: {e}")
        return None


def verify_jwt_token(token: str) -> Tuple[bool, Optional[dict], Optional[str]]:
    """
    Verify a JWT token using RS256.

    Returns:
        Tuple of (is_valid, payload, error_message)
    """
    if not token:
        return False, None, "No token provided"

    try:
        # For development/testing with static key
        if JWT_PUBLIC_KEY:
            payload = jwt.decode(
                token,
                JWT_PUBLIC_KEY,
                algorithms=['RS256'],
                audience=PASSPORT_AUDIENCE,
                issuer=PASSPORT_ISSUER,
                options={
                    'verify_aud': bool(PASSPORT_AUDIENCE),
                    'verify_iss': bool(PASSPORT_ISSUER),
                }
            )
            return True, payload, None

        # Get the public key for this token
        public_key = get_public_key(token)
        if not public_key:
            return False, None, "Could not find public key for token"

        # Verify and decode the token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=PASSPORT_AUDIENCE,
            issuer=PASSPORT_ISSUER,
            options={
                'verify_aud': bool(PASSPORT_AUDIENCE),
                'verify_iss': bool(PASSPORT_ISSUER),
            }
        )

        return True, payload, None

    except jwt.ExpiredSignatureError:
        return False, None, "Token has expired"
    except jwt.JWTClaimsError as e:
        return False, None, f"Invalid claims: {e}"
    except JWTError as e:
        return False, None, f"Invalid token: {e}"


class JWTAuthentication(authentication.BaseAuthentication):
    """
    DRF Authentication class for JWT tokens from passport.oceanheart.ai.
    """

    def authenticate(self, request) -> Optional[Tuple[JWTUser, str]]:
        """
        Authenticate the request and return a tuple of (user, token).
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header:
            return None  # No auth header, let other authenticators try

        # Check for Bearer token
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None  # Not a Bearer token

        token = parts[1]

        # Verify the token
        is_valid, payload, error = verify_jwt_token(token)

        if not is_valid:
            raise exceptions.AuthenticationFailed(error or "Invalid token")

        # Create user from payload
        user = JWTUser(payload)

        return (user, token)

    def authenticate_header(self, request) -> str:
        """
        Return the WWW-Authenticate header value for 401 responses.
        """
        return 'Bearer realm="watson-api"'


class JWTAuthenticationMiddleware:
    """
    Django middleware that validates JWT tokens on protected routes.

    This middleware extracts JWT from Authorization header and
    attaches the decoded user to request.jwt_user.

    Non-protected paths (health checks, public APIs) are skipped.
    """

    # Paths that don't require authentication
    PUBLIC_PATHS = [
        '/health/',
        '/ready/',
        '/admin/',
        '/api/',  # API uses DRF authentication
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip public paths
        path = request.path
        if any(path.startswith(p) for p in self.PUBLIC_PATHS):
            return self.get_response(request)

        # Extract token from header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

            is_valid, payload, error = verify_jwt_token(token)

            if is_valid and payload:
                # Attach user to request
                request.jwt_user = JWTUser(payload)
            else:
                # Invalid token - could return 401 here if strict
                request.jwt_user = None
                request.jwt_error = error
        else:
            request.jwt_user = None

        return self.get_response(request)


def require_jwt_auth(view_func):
    """
    Decorator for views that require JWT authentication.
    Returns 401 if no valid JWT is present.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'jwt_user') or request.jwt_user is None:
            error = getattr(request, 'jwt_error', 'Authentication required')
            return JsonResponse(
                {'error': 'Unauthorized', 'detail': error},
                status=401
            )
        return view_func(request, *args, **kwargs)
    return wrapper
