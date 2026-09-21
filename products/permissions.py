from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow administrators to create, update, or delete objects,
    while allowing read-only access (GET, HEAD, OPTIONS) to all users.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_staff
                or request.user.is_superuser
                or getattr(request.user, 'is_admin', False)
            )
        )
