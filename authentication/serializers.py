"""
Serializers for authentication API.
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    """
    
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone_number', 'country', 'street_address', 'city', 'state', 'zip_code', 'is_admin', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_admin', 'created_at', 'updated_at']


class SignupSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration/signup.
    Supports both direct and Google signup types.
    """
    
    signup_type = serializers.ChoiceField(
        choices=['direct', 'google'],
        required=True,
        write_only=True
    )
    password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['signup_type', 'full_name', 'email', 'password', 'password_confirm', 'phone_number', 'country', 'street_address', 'city', 'state', 'zip_code']
    
    def validate(self, attrs):
        """
        Validate based on signup_type.
        """
        signup_type = attrs.get('signup_type')
        email = attrs.get('email')
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                'email': 'A user with this email already exists.'
            })
        
        if signup_type == 'direct':
            # Direct signup requires all fields
            required_fields = ['full_name', 'password', 'password_confirm', 'phone_number', 'country']
            for field in required_fields:
                if field not in attrs or not attrs[field]:
                    raise serializers.ValidationError({
                        field: f'{field} is required for direct signup.'
                    })
            
            # Validate password match
            if attrs['password'] != attrs['password_confirm']:
                raise serializers.ValidationError({
                    'password': 'Password fields did not match.'
                })
        
        elif signup_type == 'google':
            # Google signup only requires email
            # Password fields should not be present
            if 'password' in attrs or 'password_confirm' in attrs:
                raise serializers.ValidationError({
                    'password': 'Password should not be provided for Google signup.'
                })
        
        return attrs
    
    def create(self, validated_data):
        """
        Create a new user based on signup_type.
        """
        signup_type = validated_data.pop('signup_type')
        
        if signup_type == 'direct':
            validated_data.pop('password_confirm')
            password = validated_data.pop('password')
            
            user = User.objects.create_user(
                password=password,
                auth_provider='direct',
                **validated_data
            )
        
        elif signup_type == 'google':
            # For Google signup, generate a random password
            import secrets
            password = secrets.token_urlsafe(32)
            
            user = User.objects.create_user(
                password=password,
                auth_provider='google',
                **validated_data
            )
        
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    Supports both direct and Google login types.
    """
    
    login_type = serializers.ChoiceField(
        choices=['direct', 'google'],
        required=True
    )
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=False,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """
        Validate based on login_type.
        """
        login_type = attrs.get('login_type')
        email = attrs.get('email')
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'email': 'No user found with this email.'
            })
        
        if login_type == 'direct':
            # Direct login requires password
            if 'password' not in attrs or not attrs['password']:
                raise serializers.ValidationError({
                    'password': 'Password is required for direct login.'
                })
            
            # Verify password
            if not user.check_password(attrs['password']):
                raise serializers.ValidationError({
                    'password': 'Invalid password.'
                })
            
            # Check if user signed up with direct
            if user.auth_provider != 'direct':
                raise serializers.ValidationError({
                    'login_type': 'This account was created with Google. Please use Google login.'
                })
        
        elif login_type == 'google':
            # Google login doesn't require password
            # Check if user signed up with Google
            if user.auth_provider != 'google':
                raise serializers.ValidationError({
                    'login_type': 'This account was created with direct signup. Please use direct login.'
                })
        
        attrs['user'] = user
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user details in the response.
    """
    
    @classmethod
    def get_token(cls, user):
        """
        Add custom claims to the JWT token.
        """
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['full_name'] = user.full_name
        token['is_admin'] = user.is_admin
        
        return token
    
    def validate(self, attrs):
        """
        Validate credentials and return tokens with user details.
        """
        data = super().validate(attrs)
        
        # Add user details to the response
        data['user'] = UserSerializer(self.user).data
        
        return data


class LogoutSerializer(serializers.Serializer):
    """
    Serializer for logout endpoint.
    """
    
    refresh = serializers.CharField(required=True)


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile endpoint.
    """
    
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone_number', 'country', 'street_address', 'city', 'state', 'zip_code', 'is_admin', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_admin', 'created_at', 'updated_at']
