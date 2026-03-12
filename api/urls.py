from django.urls import path
from . import views

urlpatterns = [
    path('auth/signup', views.signup),
    path('auth/login', views.login),
    path('users/search', views.search_donors),
    path('requests/create', views.create_request),
]
