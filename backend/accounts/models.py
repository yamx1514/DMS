from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Roles(models.TextChoices):
        SUPERADMIN = "superadmin", "Super Admin"
        SUBADMIN = "subadmin", "Sub Admin"
        CLIENT = "client", "Client"

    role = models.CharField(max_length=32, choices=Roles.choices, default=Roles.CLIENT)

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def deactivate(self):
        if self.is_active:
            self.is_active = False
            self.save(update_fields=["is_active"])

    @property
    def assigned_permissions(self):
        return self.user_permissions.all()
