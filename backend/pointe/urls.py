from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, ShoeFittingViewSet, TrainingLogViewSet, WearAlertViewSet, StatisticsViewSet,
    PointeShoeInventoryViewSet, ShoeBorrowingViewSet, ShoeReturnCheckViewSet,
    InventoryAlertViewSet, InventoryStatisticsViewSet
)

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'shoe-fittings', ShoeFittingViewSet)
router.register(r'training-logs', TrainingLogViewSet)
router.register(r'wear-alerts', WearAlertViewSet)
router.register(r'statistics', StatisticsViewSet, basename='statistics')
router.register(r'shoe-inventory', PointeShoeInventoryViewSet)
router.register(r'shoe-borrowings', ShoeBorrowingViewSet)
router.register(r'shoe-return-checks', ShoeReturnCheckViewSet)
router.register(r'inventory-alerts', InventoryAlertViewSet)
router.register(r'inventory-statistics', InventoryStatisticsViewSet, basename='inventory-statistics')

urlpatterns = [
    path('api/', include(router.urls)),
]
