from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, ShoeFittingViewSet, TrainingLogViewSet, WearAlertViewSet, StatisticsViewSet,
    PointeShoeInventoryViewSet, ShoeBorrowingViewSet, ShoeReturnCheckViewSet,
    InventoryAlertViewSet, InventoryStatisticsViewSet,
    TrainingPlanViewSet, WeeklyExecutionRecordViewSet, PhaseEvaluationViewSet,
    PlanRiskAlertViewSet, PlanStatisticsViewSet,
    InjuryInterventionViewSet, RehabilitationReviewViewSet,
    InterventionReminderViewSet, RehabilitationStatisticsViewSet
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
router.register(r'training-plans', TrainingPlanViewSet)
router.register(r'weekly-records', WeeklyExecutionRecordViewSet)
router.register(r'phase-evaluations', PhaseEvaluationViewSet)
router.register(r'plan-risk-alerts', PlanRiskAlertViewSet, basename='plan-risk-alerts')
router.register(r'plan-statistics', PlanStatisticsViewSet, basename='plan-statistics')
router.register(r'injury-interventions', InjuryInterventionViewSet)
router.register(r'rehabilitation-reviews', RehabilitationReviewViewSet)
router.register(r'intervention-reminders', InterventionReminderViewSet)
router.register(r'rehabilitation-statistics', RehabilitationStatisticsViewSet, basename='rehabilitation-statistics')

urlpatterns = [
    path('api/', include(router.urls)),
]
