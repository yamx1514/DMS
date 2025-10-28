from django.contrib.auth.models import Permission
from django.db import transaction
from rest_framework import serializers

from .models import User


class PermissionRepresentationSerializer(serializers.ModelSerializer):
    content_type = serializers.SerializerMethodField()

    class Meta:
        model = Permission
        fields = ("id", "name", "codename", "content_type")
        read_only_fields = fields

    def get_content_type(self, obj):
        content_type = obj.content_type
        if content_type is None:
            return None
        return {
            "id": content_type.id,
            "app_label": content_type.app_label,
            "model": content_type.model,
        }


class ManagedAccountSerializer(serializers.ModelSerializer):
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="user_permissions",
    )
    permissions = PermissionRepresentationSerializer(
        source="user_permissions",
        many=True,
        read_only=True,
    )
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "role",
            "role_display",
            "password",
            "permission_ids",
            "permissions",
            "date_joined",
            "last_login",
        )
        read_only_fields = ("id", "role", "role_display", "permissions", "date_joined", "last_login")
        extra_kwargs = {
            "username": {"required": True},
            "email": {"required": True},
        }

    role_value: str = ""

    def validate(self, attrs):
        attrs = super().validate(attrs)
        role = attrs.get("role")
        if role and role != self.role_value:
            raise serializers.ValidationError("Role cannot be modified for this endpoint.")
        password = attrs.get("password")
        if self.instance is None and not password:
            raise serializers.ValidationError({"password": "Password is required when creating a new account."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password", None)
        permissions = validated_data.pop("user_permissions", [])
        validated_data["role"] = self.role_value
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        if permissions:
            user.user_permissions.set(permissions)
        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        permissions = validated_data.pop("user_permissions", None)
        validated_data.pop("role", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
        if permissions is not None:
            instance.user_permissions.set(permissions)
        return instance


class ClientSerializer(ManagedAccountSerializer):
    role_value = User.Roles.CLIENT


class SubAdminSerializer(ManagedAccountSerializer):
    role_value = User.Roles.SUBADMIN
