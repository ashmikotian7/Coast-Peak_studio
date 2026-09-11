"""
Admin configuration for User model.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


class UserAdmin(BaseUserAdmin):
    """
    Custom admin interface for User model.
    """
    
    # Fields to display in the list view
    list_display = ['id', 'email', 'full_name', 'phone_number', 'country', 'is_admin', 'is_active', 'created_at']
    list_filter = ['is_admin', 'is_active', 'is_staff', 'created_at']
    search_fields = ['email', 'full_name', 'phone_number']
    ordering = ['-created_at']
    
    # Fieldsets for the detail view
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Information', {'fields': ('full_name', 'phone_number', 'country')}),
        ('Delivery Address', {'fields': ('street_address', 'city', 'state', 'zip_code')}),
        ('Permissions', {'fields': ('is_admin', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    # Fieldsets for the add user form
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'password1', 'password2', 'phone_number', 'country', 'street_address', 'city', 'state', 'zip_code', 'is_admin', 'is_active'),
        }),
    )
    
    # Read-only fields
    readonly_fields = ['created_at', 'updated_at', 'last_login']


# Register the User model with the custom admin
admin.site.register(User, UserAdmin)
