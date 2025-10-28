from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User
from .permissions import IsSuperAdmin
from .serializers import ClientSerializer, SubAdminSerializer


class ManagedAccountViewSet(viewsets.ModelViewSet):
    """Base viewset that ensures only super admins can manage accounts."""

    permission_classes = (IsAuthenticated, IsSuperAdmin)
    serializer_class = None
    role = None

    def get_queryset(self):
        assert self.role is not None, "role must be defined"
        return User.objects.filter(role=self.role).order_by("id")

    def get_serializer_class(self):
        assert self.serializer_class is not None, "serializer_class must be defined"
        return self.serializer_class

    def perform_create(self, serializer):
        serializer.save(role=self.role)

    def perform_update(self, serializer):
        serializer.save(role=self.role)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.deactivate()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.deactivate()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ClientViewSet(ManagedAccountViewSet):
    serializer_class = ClientSerializer
    role = User.Roles.CLIENT


class SubAdminViewSet(ManagedAccountViewSet):
    serializer_class = SubAdminSerializer
    role = User.Roles.SUBADMIN
