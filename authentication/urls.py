"""
URL configuration for authentication app.
"""

from django.urls import path
from .views import (
    SignupView,
    LoginView,
    LogoutView,
    RefreshTokenView,
    ProfileView
)

urlpatterns = [
    # Authentication endpoints
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', RefreshTokenView.as_view(), name='token_refresh'),
    
    # Profile endpoint
    path('profile/', ProfileView.as_view(), name='profile'),
]
