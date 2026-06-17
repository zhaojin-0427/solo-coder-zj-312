from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, ShoeFittingViewSet, TrainingLogViewSet, WearAlertViewSet, StatisticsViewSet

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'shoe-fittings', ShoeFittingViewSet)
router.register(r'training-logs', TrainingLogViewSet)
router.register(r'wear-alerts', WearAlertViewSet)
router.register(r'statistics', StatisticsViewSet, basename='statistics')

urlpatterns = [
    path('api/', include(router.urls)),
]
