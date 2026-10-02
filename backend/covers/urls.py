from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AvailabilitySlotViewSet, CoverRequestViewSet

router = DefaultRouter()
router.register(r"availability", AvailabilitySlotViewSet, basename="availability")
router.register(r"requests", CoverRequestViewSet, basename="cover-requests")

urlpatterns = [
    path("", include(router.urls)),
]
