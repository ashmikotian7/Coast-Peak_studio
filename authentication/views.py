"""
API views for authentication.
"""

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import User
from .serializers import (
    SignupSerializer,
    CustomTokenObtainPairSerializer,
    LogoutSerializer,
    UserProfileSerializer,
    UserSerializer,
    LoginSerializer
)


class SignupView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    
    POST /api/auth/signup/
    
    Request Body:
    {
        "full_name": "John Doe",
        "email": "john@example.com",
        "password": "password123",
        "password_confirm": "password123",
        "phone_number": "+919999999999",
        "country": "India"
    }
    
    Response:
    {
        "access": "jwt_access_token",
        "refresh": "jwt_refresh_token",
        "user": {
            "id": 1,
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone_number": "+919999999999",
            "country": "India",
            "is_admin": false,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    }
    """
    
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = SignupSerializer
    
    @extend_schema(
        summary="User Registration",
        description="Register a new user account. Returns JWT tokens upon successful registration.",
        responses={
            201: UserSerializer,
            400: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                "Successful Signup",
                value={
                    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                    "user": {
                        "id": 1,
                        "full_name": "John Doe",
                        "email": "john@example.com",
                        "phone_number": "+919999999999",
                        "country": "India",
                        "is_admin": False,
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-01T00:00:00Z"
                    }
                }
            )
        ]
    )
    def create(self, request, *args, **kwargs):
        """
        Create a new user and return JWT tokens.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    API endpoint for user login.
    Supports both direct and Google login types.
    
    POST /api/auth/login/
    
    Direct Login Request Body:
    {
        "login_type": "direct",
        "email": "john@example.com",
        "password": "password123"
    }
    
    Google Login Request Body:
    {
        "login_type": "google",
        "email": "john@example.com"
    }
    
    Response:
    {
        "access": "jwt_access_token",
        "refresh": "jwt_refresh_token",
        "user": {
            "id": 1,
            "full_name": "John Doe",
            "email": "john@example.com",
            "is_admin": true
        }
    }
    """
    
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="User Login",
        description="Login a user with either direct (email/password) or Google (email only) authentication.",
        request=LoginSerializer,
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                "Direct Login",
                value={
                    "login_type": "direct",
                    "email": "john@example.com",
                    "password": "password123"
                }
            ),
            OpenApiExample(
                "Google Login",
                value={
                    "login_type": "google",
                    "email": "john@example.com"
                }
            )
        ]
    )
    def post(self, request):
        """
        Authenticate user and return JWT tokens.
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    API endpoint for user logout.
    
    POST /api/auth/logout/
    
    Request Headers:
    Authorization: Bearer <access_token>
    
    Request Body:
    {
        "refresh": "jwt_refresh_token"
    }
    
    Response:
    {
        "message": "Successfully logged out"
    }
    """
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="User Logout",
        description="Logout the user by blacklisting the refresh token.",
        request=LogoutSerializer,
        responses={
            200: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
        }
    )
    def post(self, request):
        """
        Blacklist the refresh token to logout the user.
        """
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {'message': 'Successfully logged out'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class RefreshTokenView(TokenRefreshView):
    """
    API endpoint for refreshing JWT access token.
    
    POST /api/auth/token/refresh/
    
    Request Body:
    {
        "refresh": "jwt_refresh_token"
    }
    
    Response:
    {
        "access": "new_jwt_access_token",
        "refresh": "new_jwt_refresh_token"
    }
    """


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for user profile.
    
    GET /api/auth/profile/
    PUT /api/auth/profile/
    PATCH /api/auth/profile/
    
    Request Headers:
    Authorization: Bearer <access_token>
    
    Response (GET):
    {
        "id": 1,
        "full_name": "John Doe",
        "email": "john@example.com",
        "phone_number": "+919999999999",
        "country": "India",
        "street_address": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "zip_code": "400001",
        "is_admin": false,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
    """
    
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """
        Return the current authenticated user.
        """
        return self.request.user
    
    @extend_schema(
        summary="Get User Profile",
        description="Retrieve the profile of the authenticated user.",
        responses={
            200: UserProfileSerializer,
            401: OpenApiTypes.OBJECT,
        }
    )
    def get(self, request, *args, **kwargs):
        """
        Get the current user's profile.
        """
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="Update User Profile",
        description="Update the profile of the authenticated user.",
        request=UserProfileSerializer,
        responses={
            200: UserProfileSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
        }
    )
    def put(self, request, *args, **kwargs):
        """
        Update the current user's profile.
        """
        return super().put(request, *args, **kwargs)
    
    @extend_schema(
        summary="Partial Update User Profile",
        description="Partially update the profile of the authenticated user.",
        request=UserProfileSerializer,
        responses={
            200: UserProfileSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
        }
    )
    def patch(self, request, *args, **kwargs):
        """
        Partially update the current user's profile.
        """
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Update User Profile (POST)",
        description="Update the profile of the authenticated user using POST.",
        request=UserProfileSerializer,
        responses={
            200: UserProfileSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
        }
    )
    def post(self, request, *args, **kwargs):
        """
        Update the current user's profile via POST.
        """
        return super().patch(request, *args, **kwargs)
