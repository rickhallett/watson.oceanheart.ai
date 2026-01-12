# Core App Model Tests
# Tests for core models and functionality

from django.test import TestCase
from django.contrib.auth.models import User
from django.db import models
from django.core.exceptions import ValidationError


class CoreModelsTestCase(TestCase):
    """Test cases for core model functionality."""
    
    def setUp(self):
        """Set up test data before each test."""
        self.test_user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_user_creation(self):
        """Test that users can be created successfully."""
        self.assertEqual(self.test_user.username, 'testuser')
        self.assertEqual(self.test_user.email, 'test@example.com')
        self.assertTrue(self.test_user.check_password('testpass123'))
    
    def test_user_str_representation(self):
        """Test string representation of user model."""
        self.assertEqual(str(self.test_user), 'testuser')
    
    def tearDown(self):
        """Clean up after each test."""
        User.objects.all().delete()