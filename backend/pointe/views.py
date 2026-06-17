from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Student, FootProfile, ShoeFitting, TrainingLog, WearAlert,
    PointeShoeInventory, ShoeBorrowing, ShoeReturnCheck, InventoryAlert,
    TrainingPlan, WeeklyExecutionRecord, PhaseEvaluation
)
from .serializers import (
    StudentSerializer, StudentWriteSerializer, FootProfileSerializer,
    ShoeFittingSerializer, TrainingLogSerializer, WearAlertSerializer,
    WearAlertHandleSerializer, WearAlertFollowupSerializer,
    PointeShoeInventorySerializer, ShoeBorrowingSerializer,
    ShoeBorrowingActionSerializer, ShoeReturnCheckSerializer,
    InventoryAlertSerializer, InventoryAlertHandleSerializer,
    InventoryStatisticsSerializer,
    TrainingPlanSerializer, WeeklyExecutionRecordSerializer,
    WeeklyExecutionRecordSubmitSerializer, PhaseEvaluationSerializer,
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


class PointeShoeInventoryViewSet(viewsets.ModelViewSet):
    queryset = PointeShoeInventory.objects.all()
    serializer_class = PointeShoeInventorySerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        brand = self.request.query_params.get('brand')
        shoe_type = self.request.query_params.get('shoe_type')
        status = self.request.query_params.get('status')
        size = self.request.query_params.get('size')
        classroom = self.request.query_params.get('classroom')
        if brand:
            qs = qs.filter(brand__icontains=brand)
        if shoe_type:
            qs = qs.filter(shoe_type=shoe_type)
        if status:
            qs = qs.filter(status=status)
        if size:
            qs = qs.filter(size__icontains=size)
        if classroom:
            qs = qs.filter(classroom__icontains=classroom)
        return qs

    @action(detail=False, methods=['get'], url_path='available')
    def available(self, request):
        qs = self.get_queryset().filter(status='available')
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        shoes = PointeShoeInventory.objects.exclude(status__in=['retired', 'lost'])
        model_groups = {}
        for shoe in shoes:
            key = (shoe.brand, shoe.last_type, shoe.size, shoe.shoe_type)
            if key not in model_groups:
                model_groups[key] = []
            model_groups[key].append(shoe)

        low_stock_items = []
        for key, group in model_groups.items():
            safety_stock = group[0].safety_stock
            if len(group) < safety_stock:
                brand, last_type, size, shoe_type = key
                low_stock_items.append({
                    'brand': brand,
                    'last_type': last_type,
                    'size': size,
                    'shoe_type': shoe_type,
                    'shoe_type_display': dict(PointeShoeInventory.SHOE_TYPE_CHOICES)[shoe_type],
                    'current_count': len(group),
                    'safety_stock': safety_stock,
                    'deficit': safety_stock - len(group),
                })
        return Response(low_stock_items)

    @action(detail=True, methods=['post'], url_path='set-status')
    def set_status(self, request, pk=None):
        shoe = self.get_object()
        new_status = request.data.get('status')
        if new_status not in [s[0] for s in PointeShoeInventory.STATUS_CHOICES]:
            return Response({'detail': '无效的状态'}, status=status.HTTP_400_BAD_REQUEST)
        shoe.status = new_status
        shoe.save()
        return Response(self.get_serializer(shoe).data)


class ShoeBorrowingViewSet(viewsets.ModelViewSet):
    queryset = ShoeBorrowing.objects.all()
    serializer_class = ShoeBorrowingSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student')
        shoe_id = self.request.query_params.get('shoe')
        fitting_id = self.request.query_params.get('fitting')
        status = self.request.query_params.get('status')
        purpose = self.request.query_params.get('purpose')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if student_id:
            qs = qs.filter(student_id=student_id)
        if shoe_id:
            qs = qs.filter(shoe_id=shoe_id)
        if fitting_id:
            qs = qs.filter(fitting_id=fitting_id)
        if status:
            qs = qs.filter(status=status)
        if purpose:
            qs = qs.filter(purpose=purpose)
        if date_from:
            qs = qs.filter(expected_start_time__gte=date_from)
        if date_to:
            qs = qs.filter(expected_end_time__lte=date_to)
        return qs

    @action(detail=False, methods=['get'], url_path='check-conflict')
    def check_conflict(self, request):
        shoe_id = request.query_params.get('shoe')
        start_time = request.query_params.get('start_time')
        end_time = request.query_params.get('end_time')

        if not all([shoe_id, start_time, end_time]):
            return Response({'detail': '缺少必要参数'}, status=status.HTTP_400_BAD_REQUEST)

        has_conflict = ShoeBorrowing.check_time_conflict(shoe_id, start_time, end_time)
        return Response({'has_conflict': has_conflict})

    @action(detail=True, methods=['post'], url_path='borrow')
    def borrow(self, request, pk=None):
        borrowing = self.get_object()
        if borrowing.status != 'reserved':
            return Response({'detail': '只有已预约的借用单可以执行借出操作'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ShoeBorrowingActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        borrowing.status = 'borrowed'
        borrowing.actual_start_time = timezone.now()
        borrowing.borrow_notes = serializer.validated_data.get('notes', '')
        borrowing.save()

        borrowing.shoe.status = 'borrowed'
        borrowing.shoe.save()

        return Response(self.get_serializer(borrowing).data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        borrowing = self.get_object()
        if borrowing.status not in ['reserved', 'overdue']:
            return Response({'detail': '该借用单状态不允许取消'}, status=status.HTTP_400_BAD_REQUEST)

        has_active = ShoeBorrowing.objects.filter(
            shoe=borrowing.shoe,
            status__in=['reserved', 'borrowed']
        ).exclude(id=borrowing.id).exists()

        if not has_active:
            borrowing.shoe.status = 'available'
            borrowing.shoe.save()

        borrowing.status = 'cancelled'
        borrowing.save()

        return Response(self.get_serializer(borrowing).data)

    def perform_destroy(self, instance):
        has_active = ShoeBorrowing.objects.filter(
            shoe=instance.shoe,
            status__in=['reserved', 'borrowed']
        ).exclude(id=instance.id).exists()

        if not has_active:
            instance.shoe.status = 'available'
            instance.shoe.save()

        instance.delete()


class ShoeReturnCheckViewSet(viewsets.ModelViewSet):
    queryset = ShoeReturnCheck.objects.all()
    serializer_class = ShoeReturnCheckSerializer
    pagination_class = StandardPagination
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student')
        shoe_id = self.request.query_params.get('shoe')
        abnormal = self.request.query_params.get('abnormal')
        if student_id:
            qs = qs.filter(student_id=student_id)
        if shoe_id:
            qs = qs.filter(shoe_id=shoe_id)
        if abnormal == 'true':
            qs = qs.exclude(abnormal_type='none')
        return qs


class InventoryAlertViewSet(viewsets.ModelViewSet):
    queryset = InventoryAlert.objects.all()
    serializer_class = InventoryAlertSerializer
    pagination_class = StandardPagination
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        alert_type = self.request.query_params.get('alert_type')
        status = self.request.query_params.get('status')
        shoe_id = self.request.query_params.get('shoe')
        student_id = self.request.query_params.get('student')

        if alert_type:
            qs = qs.filter(alert_type=alert_type)
        if status:
            qs = qs.filter(status=status)
        if shoe_id:
            qs = qs.filter(shoe_id=shoe_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    @action(detail=True, methods=['post'], url_path='acknowledge')
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        if alert.status != 'pending':
            return Response({'detail': '只有待处理的提醒可以确认'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InventoryAlertHandleSerializer(alert, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        alert.status = 'acknowledged'
        alert.acknowledged_at = timezone.now()
        alert.save()

        return Response(self.get_serializer(alert).data)

    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve(self, request, pk=None):
        alert = self.get_object()
        if alert.status not in ['pending', 'acknowledged']:
            return Response({'detail': '只有待处理或已确认的提醒可以解决'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = InventoryAlertHandleSerializer(alert, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        alert.status = 'resolved'
        alert.resolved_at = timezone.now()
        alert.save()

        return Response(self.get_serializer(alert).data)

    @action(detail=True, methods=['post'], url_path='dismiss')
    def dismiss(self, request, pk=None):
        alert = self.get_object()
        alert.status = 'dismissed'
        alert.resolved_at = timezone.now()
        alert.save()
        return Response(self.get_serializer(alert).data)

    @action(detail=False, methods=['post'], url_path='generate-alerts')
    def generate_alerts(self, request):
        InventoryAlert.create_overdue_alerts()
        InventoryAlert.create_low_stock_alerts()
        return Response({'detail': '提醒生成完成'})


class InventoryStatisticsViewSet(viewsets.ViewSet):
    def list(self, request):
        InventoryAlert.create_overdue_alerts()
        InventoryAlert.create_low_stock_alerts()

        borrowings = ShoeBorrowing.objects.all()
        total_borrowings = borrowings.count()
        overdue_borrowings = borrowings.filter(status='overdue').count()
        overdue_rate = round(overdue_borrowings / total_borrowings * 100, 1) if total_borrowings > 0 else 0

        return_checks = ShoeReturnCheck.objects.all()
        abnormal_returns = return_checks.exclude(abnormal_type='none')
        abnormal_type_map = dict(ShoeReturnCheck.ABNORMAL_TYPE_CHOICES)
        abnormal_distribution = (
            abnormal_returns.values('abnormal_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        abnormal_return_distribution = [
            {
                'type': a['abnormal_type'],
                'label': abnormal_type_map.get(a['abnormal_type'], a['abnormal_type']),
                'count': a['count']
            }
            for a in abnormal_distribution
        ]

        size_borrowings = (
            borrowings.values('shoe__size')
            .annotate(count=Count('id'))
            .order_by('-count')[:20]
        )
        popular_sizes = [
            {'size': s['shoe__size'], 'count': s['count']}
            for s in size_borrowings if s['shoe__size']
        ]

        brand_turnover_data = (
            borrowings.values('shoe__brand')
            .annotate(
                borrow_count=Count('id'),
                unique_shoes=Count('shoe', distinct=True)
            )
            .order_by('-borrow_count')
        )
        brand_turnover = [
            {
                'brand': b['shoe__brand'],
                'borrow_count': b['borrow_count'],
                'unique_shoes': b['unique_shoes'],
                'turnover_rate': round(b['borrow_count'] / b['unique_shoes'], 1) if b['unique_shoes'] > 0 else 0
            }
            for b in brand_turnover_data if b['shoe__brand']
        ]

        level_purpose_data = (
            borrowings.values('student__level', 'purpose')
            .annotate(count=Count('id'))
            .order_by('student__level', '-count')
        )
        level_map = dict(Student.LEVEL_CHOICES)
        purpose_map = dict(ShoeBorrowing.PURPOSE_CHOICES)
        level_purpose_preferences = [
            {
                'level': lp['student__level'],
                'level_label': level_map.get(lp['student__level'], lp['student__level']),
                'purpose': lp['purpose'],
                'purpose_label': purpose_map.get(lp['purpose'], lp['purpose']),
                'count': lp['count']
            }
            for lp in level_purpose_data
        ]

        inventory = PointeShoeInventory.objects.exclude(status__in=['retired', 'lost'])
        total_inventory = inventory.count()
        available_inventory = inventory.filter(status='available').count()
        borrowed_inventory = inventory.filter(status='borrowed').count()
        maintenance_inventory = inventory.filter(status='maintenance').count()

        pending_alerts = InventoryAlert.objects.filter(status='pending').count()

        return Response({
            'brand_turnover': brand_turnover,
            'popular_sizes': popular_sizes,
            'overdue_rate': overdue_rate,
            'abnormal_return_distribution': abnormal_return_distribution,
            'level_purpose_preferences': level_purpose_preferences,
            'total_inventory': total_inventory,
            'available_inventory': available_inventory,
            'borrowed_inventory': borrowed_inventory,
            'maintenance_inventory': maintenance_inventory,
            'total_borrowings': total_borrowings,
            'pending_alerts': pending_alerts,
        })


class TrainingPlanViewSet(viewsets.ModelViewSet):
    queryset = TrainingPlan.objects.all()
    serializer_class = TrainingPlanSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset().select_related('student', 'foot_profile', 'shoe_fitting')
        student_id = self.request.query_params.get('student')
        status_filter = self.request.query_params.get('status')
        risk_level = self.request.query_params.get('risk_level')
        teacher = self.request.query_params.get('teacher')
        if student_id:
            qs = qs.filter(student_id=student_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if risk_level:
            qs = qs.filter(risk_level=risk_level)
        if teacher:
            qs = qs.filter(responsible_teacher__icontains=teacher)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        instance.assess_risk()

    def perform_update(self, serializer):
        instance = serializer.save()
        instance.assess_risk()

    @action(detail=True, methods=['post'], url_path='assess-risk')
    def assess_risk(self, request, pk=None):
        plan = self.get_object()
        risk = plan.assess_risk()
        serializer = self.get_serializer(plan)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        plan = self.get_object()
        if plan.status != 'active':
            return Response({'detail': '只有进行中的计划可以完成'}, status=status.HTTP_400_BAD_REQUEST)
        plan.status = 'completed'
        plan.save()
        return Response(self.get_serializer(plan).data)

    @action(detail=True, methods=['post'], url_path='pause')
    def pause(self, request, pk=None):
        plan = self.get_object()
        if plan.status != 'active':
            return Response({'detail': '只有进行中的计划可以暂停'}, status=status.HTTP_400_BAD_REQUEST)
        plan.status = 'paused'
        plan.save()
        return Response(self.get_serializer(plan).data)

    @action(detail=True, methods=['post'], url_path='resume')
    def resume(self, request, pk=None):
        plan = self.get_object()
        if plan.status != 'paused':
            return Response({'detail': '只有已暂停的计划可以恢复'}, status=status.HTTP_400_BAD_REQUEST)
        plan.status = 'active'
        plan.save()
        return Response(self.get_serializer(plan).data)


class WeeklyExecutionRecordViewSet(viewsets.ModelViewSet):
    queryset = WeeklyExecutionRecord.objects.all()
    serializer_class = WeeklyExecutionRecordSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset().select_related('training_plan', 'training_plan__student')
        plan_id = self.request.query_params.get('training_plan')
        student_id = self.request.query_params.get('student')
        if plan_id:
            qs = qs.filter(training_plan_id=plan_id)
        if student_id:
            qs = qs.filter(training_plan__student_id=student_id)
        return qs

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        record = self.get_object()
        if record.is_submitted:
            return Response({'detail': '该周记录已提交，不可重复提交'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = WeeklyExecutionRecordSubmitSerializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        record.is_submitted = True
        record.submitted_at = timezone.now()
        record.submitted_by = request.data.get('submitted_by', '')
        record.save()

        plan = record.training_plan
        plan.assess_risk()

        return Response(WeeklyExecutionRecordSerializer(record).data)


class PhaseEvaluationViewSet(viewsets.ModelViewSet):
    queryset = PhaseEvaluation.objects.all()
    serializer_class = PhaseEvaluationSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = super().get_queryset().select_related('training_plan', 'training_plan__student')
        plan_id = self.request.query_params.get('training_plan')
        student_id = self.request.query_params.get('student')
        if plan_id:
            qs = qs.filter(training_plan_id=plan_id)
        if student_id:
            qs = qs.filter(training_plan__student_id=student_id)
        return qs


class PlanRiskAlertViewSet(viewsets.ViewSet):
    def list(self, request):
        risk_plans = TrainingPlan.objects.filter(
            status='active', risk_level__in=['low', 'medium', 'high']
        ).select_related('student')

        serializer = TrainingPlanSerializer(risk_plans, many=True)
        return Response(serializer.data)


class PlanStatisticsViewSet(viewsets.ViewSet):
    def list(self, request):
        level_map = dict(Student.LEVEL_CHOICES)
        risk_map = dict(TrainingPlan.RISK_LEVEL_CHOICES)
        adjustment_map = dict(TrainingPlan.ADJUSTMENT_CHOICES)
        suggestion_map = dict(PhaseEvaluation.PROGRESS_SUGGESTION_CHOICES)

        plans = TrainingPlan.objects.all()
        active_plans = plans.filter(status='active')
        completed_plans = plans.filter(status='completed')

        level_completion_rate = []
        for level_key, level_label in Student.LEVEL_CHOICES:
            level_plans = plans.filter(student__level=level_key)
            total = level_plans.count()
            completed = level_plans.filter(status='completed').count()
            level_completion_rate.append({
                'level': level_key,
                'level_label': level_label,
                'total_plans': total,
                'completed_plans': completed,
                'completion_rate': round(completed / total * 100, 1) if total > 0 else 0,
            })

        total_active = active_plans.count()
        risk_plan_ratio = []
        for risk_key, risk_label in TrainingPlan.RISK_LEVEL_CHOICES:
            count = active_plans.filter(risk_level=risk_key).count()
            risk_plan_ratio.append({
                'risk_level': risk_key,
                'risk_label': risk_label,
                'count': count,
                'ratio': round(count / total_active * 100, 1) if total_active > 0 else 0,
            })

        adjustment_counts = {}
        for plan in active_plans.filter(risk_level__in=['low', 'medium', 'high']):
            reasons = plan.risk_reasons.split('；') if plan.risk_reasons else []
            suggestion = adjustment_map.get(plan.adjustment_suggestion, plan.adjustment_suggestion)
            if suggestion not in adjustment_counts:
                adjustment_counts[suggestion] = {'suggestion': suggestion, 'reasons': [], 'count': 0}
            adjustment_counts[suggestion]['count'] += 1
            adjustment_counts[suggestion]['reasons'].extend(reasons)
        common_adjustment_reasons = sorted(adjustment_counts.values(), key=lambda x: x['count'], reverse=True)[:10]

        target_achievement_rate = []
        evaluations = PhaseEvaluation.objects.all()
        for result_key, result_label in PhaseEvaluation.ACHIEVEMENT_CHOICES:
            count = evaluations.filter(overall_result=result_key).count()
            total_eval = evaluations.count()
            target_achievement_rate.append({
                'result': result_key,
                'result_label': result_label,
                'count': count,
                'rate': round(count / total_eval * 100, 1) if total_eval > 0 else 0,
            })

        teacher_data = (
            plans.values('responsible_teacher')
            .annotate(
                total_plans=Count('id'),
                active_plans=Count('id', filter=Q(status='active')),
                completed_plans=Count('id', filter=Q(status='completed')),
                risk_plans=Count('id', filter=Q(status='active', risk_level__in=['low', 'medium', 'high'])),
                evaluations=Count('phase_evaluations', filter=Q(phase_evaluations__isnull=False)),
            )
            .order_by('-total_plans')
        )
        teacher_followup = [
            {
                'teacher': td['responsible_teacher'],
                'total_plans': td['total_plans'],
                'active_plans': td['active_plans'],
                'completed_plans': td['completed_plans'],
                'risk_plans': td['risk_plans'],
                'evaluations': td['evaluations'],
            }
            for td in teacher_data
        ]

        return Response({
            'level_completion_rate': level_completion_rate,
            'risk_plan_ratio': risk_plan_ratio,
            'common_adjustment_reasons': common_adjustment_reasons,
            'target_achievement_rate': target_achievement_rate,
            'teacher_followup': teacher_followup,
            'total_plans': plans.count(),
            'active_plans': active_plans.count(),
            'completed_plans': completed_plans.count(),
            'risk_plans': active_plans.filter(risk_level__in=['low', 'medium', 'high']).count(),
        })
