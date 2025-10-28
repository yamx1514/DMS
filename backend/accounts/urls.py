from rest_framework.routers import DefaultRouter

from .views import ClientViewSet, SubAdminViewSet

router = DefaultRouter()
router.register(r"clients", ClientViewSet, basename="client")
router.register(r"sub-admins", SubAdminViewSet, basename="sub-admin")

urlpatterns = router.urls
