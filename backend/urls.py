from django.urls import include, path

urlpatterns = [
    path("api/accounts/", include("backend.accounts.urls")),
]
