from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Student, FootProfile, ShoeFitting, TrainingLog, WearAlert
from .serializers import (
    StudentSerializer, StudentWriteSerializer, FootProfileSerializer,
    ShoeFittingSerializer, TrainingLogSerializer, WearAlertSerializer,
    WearAlertHandleSerializer, WearAlertFollowupSerializer,
)
from .pagination import StandardPagination


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return StudentWriteSerializer
        return StudentSerializer

    @action(detail=True, methods=['get', 'post', 'put', 'patch'], url_path='foot-profile')
    def foot_profile(self, request, pk=None):
        student = self.get_object()
        if request.method == 'GET':
            if not hasattr(student, 'foot_profile'):
                return Response({'detail': '足型档案不存在'}, status=status.HTTP_404_NOT_FOUND)
            serializer = FootProfileSerializer(student.foot_profile)
            return Response(serializer.data)
        else:
            if hasattr(student, 'foot_profile'):
                serializer = FootProfileSerializer(student.foot_profile, data=request.data, partial=True)
            else:
                data = {**request.data, 'student': student.id}
                serializer = FootProfileSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save(student=student)
            return Response(serializer.data)


class ShoeFittingViewSet(viewsets.ModelViewSet):
    queryset = ShoeFitting.objects.all()
    serializer_class = ShoeFittingSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs


class TrainingLogViewSet(viewsets.ModelViewSet):
    queryset = TrainingLog.objects.all()
    serializer_class = TrainingLogSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        self._check_wear_alert(instance)

    def _check_wear_alert(self, log):
        fitting = log.shoe_fitting
        if not fitting:
            return
        logs = TrainingLog.objects.filter(shoe_fitting=fitting)
        total_minutes = sum(l.duration_minutes for l in logs)
        total_hours = total_minutes / 60

        if total_hours >= 80:
            WearAlert.objects.get_or_create(
                student=log.student,
                shoe_fitting=fitting,
                alert_type='replace',
                status='pending',
                defaults={'reason': f'累计训练{total_hours:.1f}小时，已超过建议使用寿命，建议更换足尖鞋'}
            )
        elif total_hours >= 50:
            WearAlert.objects.get_or_create(
                student=log.student,
                shoe_fitting=fitting,
                alert_type='insole',
                status='pending',
                defaults={'reason': f'累计训练{total_hours:.1f}小时，建议调整鞋垫以增强支撑'}
            )

        if log.sole_softening in ('moderate', 'severe'):
            WearAlert.objects.get_or_create(
                student=log.student,
                shoe_fitting=fitting,
                alert_type='hardness',
                status='pending',
                defaults={'reason': f'鞋底{log.get_sole_softening_display()}，建议考虑更换更硬度的足尖鞋'}
            )

        if log.pain_level >= 7:
            WearAlert.objects.get_or_create(
                student=log.student,
                shoe_fitting=fitting,
                alert_type='check',
                status='pending',
                defaults={'reason': f'训练疼痛等级达{log.pain_level}/10，疼痛部位：{log.get_pain_location_display()}，建议检查鞋型适配'}
            )


class WearAlertViewSet(viewsets.ModelViewSet):
    queryset = WearAlert.objects.all()
    serializer_class = WearAlertSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student')
        status_filter = self.request.query_params.get('status')
        if student_id:
            qs = qs.filter(student_id=student_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=['post'], url_path='acknowledge')
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        alert.status = 'acknowledged'
        alert.save()
        serializer = WearAlertSerializer(alert)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='handle')
    def handle(self, request, pk=None):
        alert = self.get_object()
        serializer = WearAlertHandleSerializer(alert, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if alert.handler and alert.suggested_followup_date:
            alert.status = 'followup'
        else:
            alert.status = 'handled'
        alert.handled_at = timezone.now()
        alert.save()
        return Response(WearAlertSerializer(alert).data)

    @action(detail=True, methods=['post'], url_path='followup')
    def followup(self, request, pk=None):
        alert = self.get_object()
        serializer = WearAlertFollowupSerializer(alert, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        alert.status = 'resolved'
        alert.resolved_at = timezone.now()
        alert.save()
        return Response(WearAlertSerializer(alert).data)

    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.status = 'resolved'
        alert.resolved_at = timezone.now()
        alert.save()
        serializer = WearAlertSerializer(alert)
        return Response(serializer.data)


class StatisticsViewSet(viewsets.ViewSet):
    def list(self, request):
        brand_stats = (
            ShoeFitting.objects.values('brand')
            .annotate(
                total=Count('id'),
                success=Count('id', filter=Q(fit_result__in=['excellent', 'good']))
            )
            .order_by('-total')
        )
        brand_fit_rate = [
            {
                'brand': s['brand'],
                'total': s['total'],
                'success': s['success'],
                'rate': round(s['success'] / s['total'] * 100, 1) if s['total'] > 0 else 0
            }
            for s in brand_stats
        ]

        lifespan_stats = []
        for fitting in ShoeFitting.objects.all():
            logs = TrainingLog.objects.filter(shoe_fitting=fitting)
            if logs.exists():
                total_min = sum(l.duration_minutes for l in logs)
                lifespan_stats.append({
                    'brand': fitting.brand,
                    'last_type': fitting.last_type,
                    'hours': round(total_min / 60, 1)
                })
        brand_lifespan = {}
        for ls in lifespan_stats:
            brand_lifespan.setdefault(ls['brand'], []).append(ls['hours'])
        avg_lifespan = [
            {'brand': b, 'avg_hours': round(sum(h) / len(h), 1)}
            for b, h in brand_lifespan.items()
        ]

        pain_stats = (
            TrainingLog.objects.exclude(pain_location='none')
            .values('pain_location')
            .annotate(count=Count('id'), avg_pain_level=Avg('pain_level'))
            .order_by('-count')
        )
        pain_map = dict(TrainingLog.PAIN_LOCATION_CHOICES)
        pain_hotspots = [
            {
                'location': ps['pain_location'],
                'label': pain_map.get(ps['pain_location'], ps['pain_location']),
                'count': ps['count'],
                'avg_pain_level': round(ps['avg_pain_level'], 1) if ps['avg_pain_level'] else 0
            }
            for ps in pain_stats
        ]

        level_pref = (
            ShoeFitting.objects.values('student__level', 'brand', 'hardness')
            .annotate(count=Count('id'))
            .order_by('student__level', '-count')
        )
        level_map = dict(Student.LEVEL_CHOICES)
        level_preferences = [
            {
                'level': lp['student__level'],
                'level_label': level_map.get(lp['student__level'], lp['student__level']),
                'brand': lp['brand'],
                'hardness': lp['hardness'],
                'count': lp['count']
            }
            for lp in level_pref
        ]

        alert_status_stats = (
            WearAlert.objects.values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )
        status_map = dict(WearAlert.STATUS_CHOICES)
        alert_status_distribution = [
            {
                'status': s['status'],
                'label': status_map.get(s['status'], s['status']),
                'count': s['count']
            }
            for s in alert_status_stats
        ]

        alert_type_stats = (
            WearAlert.objects.values('alert_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        type_map = dict(WearAlert.ALERT_TYPE_CHOICES)
        alert_type_distribution = [
            {
                'alert_type': t['alert_type'],
                'label': type_map.get(t['alert_type'], t['alert_type']),
                'count': t['count']
            }
            for t in alert_type_stats
        ]

        today = timezone.now().date()
        followup_overdue_count = WearAlert.objects.filter(
            status='followup', suggested_followup_date__lt=today
        ).count()
        followup_pending_count = WearAlert.objects.filter(status='followup').count()

        handled_alerts = WearAlert.objects.filter(
            handled_at__isnull=False, created_at__isnull=False
        )
        handle_durations = []
        for a in handled_alerts:
            delta = (a.handled_at - a.created_at).total_seconds() / 3600
            handle_durations.append(round(delta, 1))

        avg_handle_hours = round(sum(handle_durations) / len(handle_durations), 1) if handle_durations else 0

        resolved_with_followup = WearAlert.objects.filter(
            resolved_at__isnull=False, actual_followup_date__isnull=False
        ).count()
        total_resolved = WearAlert.objects.filter(resolved_at__isnull=False).count()
        followup_rate = round(resolved_with_followup / total_resolved * 100, 1) if total_resolved > 0 else 0

        return Response({
            'brand_fit_rate': brand_fit_rate,
            'avg_lifespan': avg_lifespan,
            'pain_hotspots': pain_hotspots,
            'level_preferences': level_preferences,
            'alert_status_distribution': alert_status_distribution,
            'alert_type_distribution': alert_type_distribution,
            'followup_overdue_count': followup_overdue_count,
            'followup_pending_count': followup_pending_count,
            'avg_handle_hours': avg_handle_hours,
            'followup_rate': followup_rate,
        })
