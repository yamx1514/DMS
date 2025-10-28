from __future__ import annotations

from django.contrib.auth.models import AbstractUser
from django.db import models


class Permission(models.Model):
    """Represents a single action that can be granted to a role."""

    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ("code",)

    def __str__(self) -> str:  # pragma: no cover - representation helper
        return f"{self.code}"


class Role(models.Model):
    """Groups permissions that can be granted to users.

    Superadmins can delegate access by assigning roles that
    aggregate permissions. The ``assignable_roles`` relation defines which
    subordinate roles a role can manage, allowing superadmins to configure
    the capabilities available to sub-admins and clients.
    """

    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(
        default=False,
        help_text=(
            "Marks roles that should be created as part of the default seed set. "
            "Only one default client role and one default sub-admin role should be "
            "flagged at a time."
        ),
    )
    permissions = models.ManyToManyField(
        Permission,
        related_name="roles",
        blank=True,
        help_text="Permissions that users of this role inherit.",
    )
    assignable_roles = models.ManyToManyField(
        "self",
        symmetrical=False,
        blank=True,
        related_name="managed_by_roles",
        help_text=(
            "Defines which roles can be assigned by members of this role. "
            "Superadmins should reference both client and sub-admin roles here."
        ),
    )

    class Meta:
        ordering = ("name",)

    def __str__(self) -> str:  # pragma: no cover - representation helper
        return self.name


class User(AbstractUser):
    """Application user model with role-based access control."""

    class AccountType(models.TextChoices):
        SUPERADMIN = "superadmin", "Superadmin"
        SUB_ADMIN = "subadmin", "Sub-admin"
        CLIENT = "client", "Client"

    account_type = models.CharField(
        max_length=20,
        choices=AccountType.choices,
        default=AccountType.CLIENT,
        help_text="Determines the primary category used for UI/segmentation.",
    )
    roles = models.ManyToManyField(
        Role,
        related_name="users",
        blank=True,
        help_text=(
            "Roles granted to the user. Permissions from these roles determine "
            "the actions the user can perform."
        ),
    )
    managed_clients = models.ManyToManyField(
        "self",
        symmetrical=False,
        blank=True,
        related_name="managers",
        help_text="Allows sub-admins to manage specific client users.",
    )

    def has_role(self, slug: str) -> bool:
        """Return ``True`` if the user has a role with the given slug."""

        return self.roles.filter(slug=slug).exists()

    def grant_role(self, role: Role, *, acting_user: User | None = None) -> None:
        """Assign a role to the user with optional delegation checks.

        If ``acting_user`` is provided, the method ensures the acting user has the
        authority to grant the role via the ``assignable_roles`` relation.
        Superadmins (``account_type`` == ``SUPERADMIN``) bypass this check, allowing
        them to grant configurable permissions to both clients and sub-admins.
        """

        if acting_user and acting_user != self:
            if acting_user.account_type != self.AccountType.SUPERADMIN:
                can_delegate = acting_user.roles.filter(assignable_roles=role).exists()
                if not can_delegate:
                    raise PermissionError("The acting user cannot assign this role.")
        self.roles.add(role)

    @property
    def all_permissions(self) -> models.QuerySet[Permission]:
        """Return a queryset of permissions aggregated from the user's roles."""

        permission_model = Permission.objects.filter(roles__users=self).distinct()
        return permission_model

    def __str__(self) -> str:  # pragma: no cover - representation helper
        return self.get_username()
