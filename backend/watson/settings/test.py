# Django Test Settings for Watson
# Optimized settings for running tests

from .base import *
import os

# Test database - use in-memory SQLite for speed
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'TEST': {
            'NAME': ':memory:',
        },
    }
}

# Disable migrations during tests for speed
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Test-specific settings
DEBUG = False
SECRET_KEY = 'test-secret-key-not-for-production'
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',  # Fast for tests
]

# Disable logging during tests
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['null'],
        },
    },
}

# Test email backend
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Coverage configuration
COVERAGE_MODULE_EXCLUDES = [
    'tests$', 
    'settings$', 
    'urls$', 
    'locale$',
    '__pycache__',
    'migrations',
    'venv',
    'node_modules',
]

# Disable CORS during tests
CORS_ALLOW_ALL_ORIGINS = True

# Disable throttling during tests
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [],
    'DEFAULT_THROTTLE_RATES': {},
}