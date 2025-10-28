from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Allows access only to Super Admin users."""

    message = "You must be a super admin to perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        roles = getattr(user.__class__, "Roles", None)
        superadmin_value = getattr(roles, "SUPERADMIN", None)
        return getattr(user, "role", None) == superadmin_value
