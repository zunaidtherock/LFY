from django.db import models
from django.contrib.auth.models import AbstractUser

class User(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    blood_group = models.CharField(max_length=5)
    phone = models.CharField(max_length=20, null=True, blank=True)
    profile_photo = models.TextField(null=True, blank=True)
    total_donations = models.IntegerField(default=0)
    availability = models.BooleanField(default=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    last_donation_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name

class BloodRequest(models.Model):
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    blood_group = models.CharField(max_length=5)
    hospital_name = models.CharField(max_length=255, null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    is_emergency = models.BooleanField(default=False)
    status = models.CharField(max_length=20, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20) # 'emergency', 'eligibility', 'info'
    title = models.CharField(max_length=255)
    message = models.TextField()
    related_id = models.IntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
