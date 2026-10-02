from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkerProfileViewSet, CredentialViewSet, CoachSearchViewSet

router = DefaultRouter()
router.register(r"coaches", WorkerProfileViewSet, basename="coach-profile")
router.register(r"qualifications", CredentialViewSet, basename="qualification")
router.register(r"search", CoachSearchViewSet, basename="coach-search")

urlpatterns = [
    path("", include(router.urls)),
]
