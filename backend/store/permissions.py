from rest_framework.permissions import BasePermission


class IsAdminOrSuperAdmin(BasePermission):
    """
    Allows access only to users with role 'admin' or 'super_admin'.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("admin", "super_admin")
        )


class IsSuperAdmin(BasePermission):
    """
    Allows access only to super admins — the users who can approve, reject,
    or suspend admin accounts.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "super_admin"
        )