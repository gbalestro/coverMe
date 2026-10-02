from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, RosterViewSet

router = DefaultRouter()
router.register(r"clubs", OrganizationViewSet, basename="club")
router.register(r"roster", RosterViewSet, basename="roster")

urlpatterns = [
    path("", include(router.urls)),
]
