# Django settings module selector
# Automatically loads the appropriate settings based on environment

import os

# Default to base settings, can be overridden with DJANGO_SETTINGS_MODULE
ENVIRONMENT = os.environ.get('DJANGO_ENVIRONMENT', 'development')

if ENVIRONMENT == 'test':
    from .test import *
elif ENVIRONMENT == 'production':
    from .production import *
else:
    from .base import *