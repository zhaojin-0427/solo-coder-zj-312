from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from .models import (
    Student, FootProfile, ShoeFitting, TrainingLog, WearAlert,
    PointeShoeInventory, ShoeBorrowing, ShoeReturnCheck, InventoryAlert,
    TrainingPlan, WeeklyExecutionRecord, PhaseEvaluation,
    InjuryIntervention, RehabilitationReview, InterventionReminder
)


class FootProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FootProfile
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class StudentSerializer(serializers.ModelSerializer):
    foot_profile = FootProfileSerializer(read_only=True)

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class StudentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ShoeFittingSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = ShoeFitting
        fields = '__all__'
        read_only_fields = ['created_at']


class TrainingLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = TrainingLog
        fields = '__all__'
        read_only_fields = ['created_at']


class WearAlertSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_followup_overdue = serializers.SerializerMethodField()

    class Meta:
        model = WearAlert
        fields = '__all__'
        read_only_fields = ['created_at', 'handled_at', 'resolved_at']

    def get_is_followup_overdue(self, obj):
        if obj.status == 'followup' and obj.suggested_followup_date:
            from django.utils import timezone
            today = timezone.now().date()
            return today > obj.suggested_followup_date
        return False


class WearAlertHandleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WearAlert
        fields = ['handler', 'handling_plan', 'handling_notes', 'suggested_followup_date']


class WearAlertFollowupSerializer(serializers.ModelSerializer):
    class Meta:
        model = WearAlert
        fields = ['actual_followup_date', 'handling_notes']


class StatisticsSerializer(serializers.Serializer):
    brand_fit_rate = serializers.ListField()
    avg_lifespan = serializers.ListField()
    pain_hotspots = serializers.ListField()
    level_preferences = serializers.ListField()


class PointeShoeInventorySerializer(serializers.ModelSerializer):
    shoe_type_display = serializers.CharField(source='get_shoe_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    hardness_display = serializers.CharField(source='get_hardness_display', read_only=True)
    box_height_display = serializers.CharField(source='get_box_height_display', read_only=True)
    remaining_borrow_count = serializers.IntegerField(read_only=True)
    is_below_safety_stock = serializers.BooleanField(read_only=True)
    current_borrowing = serializers.SerializerMethodField()

    class Meta:
        model = PointeShoeInventory
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'current_borrow_count']

    def get_current_borrowing(self, obj):
        current = obj.borrowings.filter(status__in=['reserved', 'borrowed']).first()
        if current:
            return {
                'id': current.id,
                'student_name': current.student.name,
                'student_id': current.student.id,
                'status': current.status,
                'status_display': current.get_status_display(),
                'expected_end_time': current.expected_end_time,
            }
        return None


class PointeShoeInventoryNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointeShoeInventory
        fields = ['id', 'brand', 'last_type', 'size', 'hardness', 'shoe_type', 'status', 'classroom', 'cabinet', 'width', 'box_height', 'remaining_borrow_count', 'current_borrow_count']

class StudentNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'name', 'level', 'age']

class ShoeFittingNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoeFitting
        fields = ['id', 'brand', 'last_type', 'size', 'hardness', 'box_height', 'fit_result', 'fitting_date']

class ShoeBorrowingSerializer(serializers.ModelSerializer):
    shoe_brand = serializers.CharField(source='shoe.brand', read_only=True)
    shoe_size = serializers.CharField(source='shoe.size', read_only=True)
    shoe_last_type = serializers.CharField(source='shoe.last_type', read_only=True)
    shoe = PointeShoeInventoryNestedSerializer(read_only=True)
    shoe_id = serializers.PrimaryKeyRelatedField(queryset=PointeShoeInventory.objects.all(), source='shoe', write_only=True)
    student = StudentNestedSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), source='student', write_only=True)
    fitting = ShoeFittingNestedSerializer(read_only=True)
    fitting_id = serializers.PrimaryKeyRelatedField(queryset=ShoeFitting.objects.all(), source='fitting', write_only=True, required=False, allow_null=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_level = serializers.CharField(source='student.level', read_only=True)
    purpose_display = serializers.CharField(source='get_purpose_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    has_return_check = serializers.SerializerMethodField()

    class Meta:
        model = ShoeBorrowing
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'actual_start_time', 'actual_end_time']

    def get_has_return_check(self, obj):
        return hasattr(obj, 'return_check')

    def validate(self, data):
        if data['expected_start_time'] >= data['expected_end_time']:
            raise ValidationError('预计开始时间必须早于预计归还时间')

        if ShoeBorrowing.check_time_conflict(
            data['shoe'].id,
            data['expected_start_time'],
            data['expected_end_time'],
            self.instance.id if self.instance else None
        ):
            raise ValidationError('该鞋款在所选时间段内已有预约或借出记录')

        if data['shoe'].status not in ['available', 'reserved']:
            raise ValidationError(f'该鞋款当前状态为【{data["shoe"].get_status_display()}】，无法预约')

        if data['shoe'].remaining_borrow_count <= 0:
            raise ValidationError('该鞋款已达到最大借用次数')

        return data

    def create(self, validated_data):
        instance = super().create(validated_data)
        instance.shoe.status = 'reserved'
        instance.shoe.save()
        return instance


class ShoeBorrowingActionSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)


class ShoeReturnCheckSerializer(serializers.ModelSerializer):
    borrowing_info = serializers.SerializerMethodField()
    shoe_brand = serializers.CharField(source='shoe.brand', read_only=True)
    shoe_size = serializers.CharField(source='shoe.size', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    overall_condition_display = serializers.CharField(source='get_overall_condition_display', read_only=True)
    abnormal_type_display = serializers.CharField(source='get_abnormal_type_display', read_only=True)

    class Meta:
        model = ShoeReturnCheck
        fields = '__all__'
        read_only_fields = ['created_at', 'shoe', 'student']

    def get_borrowing_info(self, obj):
        return {
            'id': obj.borrowing.id,
            'expected_start_time': obj.borrowing.expected_start_time,
            'expected_end_time': obj.borrowing.expected_end_time,
            'actual_start_time': obj.borrowing.actual_start_time,
            'purpose': obj.borrowing.purpose,
            'purpose_display': obj.borrowing.get_purpose_display(),
        }

    def create(self, validated_data):
        borrowing = validated_data['borrowing']
        shoe = borrowing.shoe
        student = borrowing.student

        validated_data['shoe'] = shoe
        validated_data['student'] = student

        instance = super().create(validated_data)

        borrowing.status = 'returned'
        borrowing.actual_end_time = validated_data.get('return_date', timezone.now())
        borrowing.save()

        shoe.current_borrow_count += 1
        shoe.status = 'available'

        if validated_data.get('cleaning_needed') or validated_data.get('repair_needed'):
            shoe.status = 'maintenance'
        if validated_data.get('retire_shoe'):
            shoe.status = 'retired'

        shoe.save()

        abnormal_type = validated_data.get('abnormal_type', 'none')
        if abnormal_type and abnormal_type != 'none':
            InventoryAlert.objects.get_or_create(
                alert_type='abnormal_return',
                borrowing=borrowing,
                shoe=shoe,
                student=student,
                status='pending',
                defaults={
                    'message': f'鞋款【{shoe}】归还异常：{dict(ShoeReturnCheck.ABNORMAL_TYPE_CHOICES).get(abnormal_type, abnormal_type)} - {validated_data.get("abnormal_description", "")}'
                }
            )

        if shoe.remaining_borrow_count <= 2:
            InventoryAlert.objects.get_or_create(
                alert_type='high_borrow_count',
                shoe=shoe,
                status='pending',
                defaults={
                    'message': f'鞋款【{shoe}】剩余可借用次数不足，已借用{shoe.current_borrow_count}次，剩余{shoe.remaining_borrow_count}次'
                }
            )

        InventoryAlert.create_low_stock_alerts()

        return instance


class InventoryAlertSerializer(serializers.ModelSerializer):
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    shoe_info = serializers.SerializerMethodField()
    shoe = PointeShoeInventoryNestedSerializer(read_only=True)
    shoe_id = serializers.PrimaryKeyRelatedField(queryset=PointeShoeInventory.objects.all(), source='shoe', write_only=True, required=False, allow_null=True)
    student = StudentNestedSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), source='student', write_only=True, required=False, allow_null=True)
    student_name = serializers.SerializerMethodField()
    borrowing_info = serializers.SerializerMethodField()

    class Meta:
        model = InventoryAlert
        fields = '__all__'
        read_only_fields = ['created_at', 'acknowledged_at', 'resolved_at']

    def get_shoe_info(self, obj):
        if obj.shoe:
            return {
                'id': obj.shoe.id,
                'brand': obj.shoe.brand,
                'last_type': obj.shoe.last_type,
                'size': obj.shoe.size,
                'status': obj.shoe.status,
                'status_display': obj.shoe.get_status_display(),
            }
        return None

    def get_student_name(self, obj):
        return obj.student.name if obj.student else None

    def get_borrowing_info(self, obj):
        if obj.borrowing:
            return {
                'id': obj.borrowing.id,
                'expected_end_time': obj.borrowing.expected_end_time,
                'status': obj.borrowing.status,
            }
        return None


class InventoryAlertHandleSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryAlert
        fields = ['handled_by', 'handling_notes']


class InventoryStatisticsSerializer(serializers.Serializer):
    brand_turnover = serializers.ListField()
    popular_sizes = serializers.ListField()
    overdue_rate = serializers.FloatField()
    abnormal_return_distribution = serializers.ListField()
    level_purpose_preferences = serializers.ListField()
    total_inventory = serializers.IntegerField()
    available_inventory = serializers.IntegerField()
    borrowed_inventory = serializers.IntegerField()
    maintenance_inventory = serializers.IntegerField()
    total_borrowings = serializers.IntegerField()
    pending_alerts = serializers.IntegerField()


class TrainingPlanSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_level = serializers.CharField(source='student.level', read_only=True)
    target_level_display = serializers.CharField(source='get_target_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    adjustment_suggestion_display = serializers.CharField(source='get_adjustment_suggestion_display', read_only=True)
    progress_percent = serializers.FloatField(read_only=True)
    current_week_number = serializers.IntegerField(read_only=True)
    latest_evaluation = serializers.SerializerMethodField()

    class Meta:
        model = TrainingPlan
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'risk_level', 'risk_reasons', 'adjustment_suggestion']

    def get_latest_evaluation(self, obj):
        latest = obj.phase_evaluations.order_by('-evaluation_date').first()
        if latest:
            return PhaseEvaluationSerializer(latest).data
        return None

    def validate(self, data):
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] >= data['end_date']:
                raise ValidationError('开始日期必须早于结束日期')
        if data.get('weekly_max_duration') and data['weekly_max_duration'] <= 0:
            raise ValidationError('每周上鞋时长上限必须大于0')

        student = data.get('student')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        if student and start_date and end_date:
            qs = TrainingPlan.objects.filter(
                student=student,
                status='active',
                start_date__lt=end_date,
                end_date__gt=start_date,
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise ValidationError('该学员在所选时间段内已有进行中的训练计划')
        return data


class WeeklyExecutionRecordSerializer(serializers.ModelSerializer):
    exercise_completion_display = serializers.CharField(source='get_exercise_completion_display', read_only=True)
    pain_location_display = serializers.CharField(source='get_pain_location_display', read_only=True)

    class Meta:
        model = WeeklyExecutionRecord
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'is_submitted', 'submitted_at', 'submitted_by']

    def validate_stability_score(self, value):
        if value is not None and (value < 0 or value > 100):
            raise ValidationError('稳定度评分范围为0-100')
        return value

    def validate_pain_level(self, value):
        if value < 0 or value > 10:
            raise ValidationError('疼痛等级范围为0-10')
        return value


class WeeklyExecutionRecordSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyExecutionRecord
        fields = ['actual_duration', 'exercise_completion', 'stability_score',
                   'pain_location', 'pain_level', 'teacher_comments',
                   'needs_adjustment', 'adjustment_reason']


class PhaseEvaluationSerializer(serializers.ModelSerializer):
    target_achievement_display = serializers.CharField(source='get_target_achievement_display', read_only=True)
    stability_evaluation_display = serializers.CharField(source='get_stability_evaluation_display', read_only=True)
    strength_evaluation_display = serializers.CharField(source='get_strength_evaluation_display', read_only=True)
    pain_status_display = serializers.CharField(source='get_pain_status_display', read_only=True)
    overall_result_display = serializers.CharField(source='get_overall_result_display', read_only=True)
    progress_suggestion_display = serializers.CharField(source='get_progress_suggestion_display', read_only=True)
    plan_name = serializers.CharField(source='training_plan.plan_name', read_only=True)
    student_name = serializers.CharField(source='training_plan.student.name', read_only=True)

    class Meta:
        model = PhaseEvaluation
        fields = '__all__'
        read_only_fields = ['created_at']


class PlanStatisticsSerializer(serializers.Serializer):
    level_completion_rate = serializers.ListField()
    risk_plan_ratio = serializers.ListField()
    common_adjustment_reasons = serializers.ListField()
    target_achievement_rate = serializers.ListField()
    teacher_followup = serializers.ListField()


class RehabilitationReviewNestedSerializer(serializers.ModelSerializer):
    pain_change_display = serializers.CharField(source='get_pain_change_display', read_only=True)
    stability_recovery_display = serializers.CharField(source='get_stability_recovery_display', read_only=True)

    class Meta:
        model = RehabilitationReview
        fields = ['id', 'review_date', 'pain_level', 'pain_change', 'pain_change_display',
                   'stability_recovery', 'stability_recovery_display',
                   'allow_resume_pointe', 'need_refit', 'need_insole_adjust',
                   'review_notes', 'reviewer', 'created_at']


class InjuryInterventionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_level = serializers.CharField(source='student.level', read_only=True)
    trigger_source_display = serializers.CharField(source='get_trigger_source_display', read_only=True)
    pain_location_display = serializers.CharField(source='get_pain_location_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_review_overdue = serializers.BooleanField(read_only=True)
    latest_review = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = InjuryIntervention
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'closed_at']

    def get_latest_review(self, obj):
        latest = obj.reviews.order_by('-review_date').first()
        if latest:
            return RehabilitationReviewNestedSerializer(latest).data
        return None

    def get_review_count(self, obj):
        return obj.reviews.count()

    def validate(self, data):
        if data.get('pain_level') is not None:
            if data['pain_level'] < 0 or data['pain_level'] > 10:
                raise ValidationError('疼痛等级范围为0-10')

        student = data.get('student')
        pain_location = data.get('pain_location')
        if student and pain_location:
            exclude_id = self.instance.id if self.instance else None
            if InjuryIntervention.check_duplicate_open(student.id, pain_location, exclude_id):
                raise ValidationError(f'该学员在【{dict(InjuryIntervention.PAIN_LOCATION_CHOICES).get(pain_location, pain_location)}】部位已存在未关闭的干预单')

        return data


class InjuryInterventionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = InjuryIntervention
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'closed_at']

    def validate(self, data):
        if data.get('pain_level') is not None:
            if data['pain_level'] < 0 or data['pain_level'] > 10:
                raise ValidationError('疼痛等级范围为0-10')

        student = data.get('student')
        pain_location = data.get('pain_location')
        if student and pain_location:
            exclude_id = self.instance.id if self.instance else None
            if InjuryIntervention.check_duplicate_open(student.id, pain_location, exclude_id):
                raise ValidationError(f'该学员在【{dict(InjuryIntervention.PAIN_LOCATION_CHOICES).get(pain_location, pain_location)}】部位已存在未关闭的干预单')

        return data


class RehabilitationReviewSerializer(serializers.ModelSerializer):
    intervention_info = serializers.SerializerMethodField()
    student_name = serializers.CharField(source='intervention.student.name', read_only=True)
    pain_change_display = serializers.CharField(source='get_pain_change_display', read_only=True)
    stability_recovery_display = serializers.CharField(source='get_stability_recovery_display', read_only=True)

    class Meta:
        model = RehabilitationReview
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_intervention_info(self, obj):
        return {
            'id': obj.intervention.id,
            'student_name': obj.intervention.student.name,
            'pain_location': obj.intervention.pain_location,
            'pain_location_display': obj.intervention.get_pain_location_display(),
            'status': obj.intervention.status,
        }

    def validate(self, data):
        if data.get('pain_level') is not None:
            if data['pain_level'] < 0 or data['pain_level'] > 10:
                raise ValidationError('疼痛等级范围为0-10')
        return data

    def create(self, validated_data):
        instance = super().create(validated_data)
        intervention = instance.intervention

        intervention.pain_level = instance.pain_level
        if instance.pain_change == 'worsened':
            if intervention.status == 'paused':
                intervention.status = 'active'
        elif instance.pain_change == 'improved' and instance.pain_level <= 3:
            if instance.allow_resume_pointe:
                intervention.status = 'closed'
                intervention.closed_at = timezone.now()
            else:
                intervention.status = 'paused'

        if instance.need_refit:
            intervention.status = 'active'

        if instance.allow_resume_pointe and instance.pain_level <= 3:
            intervention.status = 'closed'
            intervention.closed_at = timezone.now()

        next_review = instance.review_date + __import__('datetime').timedelta(days=7)
        intervention.next_review_date = next_review
        intervention.save()

        if intervention.related_training_plan:
            plan = intervention.related_training_plan
            if instance.pain_change == 'worsened':
                plan.risk_level = 'high'
                plan.risk_reasons = f'干预复查疼痛加重，部位：{intervention.get_pain_location_display()}'
                plan.adjustment_suggestion = 'pause'
            elif instance.pain_change == 'stable' and instance.pain_level >= 5:
                if plan.risk_level not in ['high']:
                    plan.risk_level = 'medium'
                plan.risk_reasons = f'干预复查疼痛稳定但等级较高({instance.pain_level}/10)'
                plan.adjustment_suggestion = 'downgrade'
            elif instance.pain_change == 'improved' and instance.pain_level <= 3:
                plan.risk_level = 'normal'
                plan.risk_reasons = ''
                plan.adjustment_suggestion = 'none'
            plan.save()

        if intervention.related_wear_alert:
            alert = intervention.related_wear_alert
            if instance.pain_change == 'improved' and instance.pain_level <= 3:
                alert.status = 'resolved'
                alert.resolved_at = timezone.now()
                alert.save()

        InterventionReminder.generate_reminders()

        return instance


class InterventionReminderSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    reminder_type_display = serializers.CharField(source='get_reminder_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    intervention_info = serializers.SerializerMethodField()

    class Meta:
        model = InterventionReminder
        fields = '__all__'
        read_only_fields = ['created_at', 'acknowledged_at', 'resolved_at']

    def get_intervention_info(self, obj):
        return {
            'id': obj.intervention.id,
            'pain_location': obj.intervention.pain_location,
            'pain_location_display': obj.intervention.get_pain_location_display(),
            'status': obj.intervention.status,
        }


class InterventionReminderHandleSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterventionReminder
        fields = ['handled_by', 'handling_notes']


class RehabilitationStatisticsSerializer(serializers.Serializer):
    pain_location_distribution = serializers.ListField()
    level_intervention_count = serializers.ListField()
    avg_recovery_days = serializers.FloatField()
    review_overdue_rate = serializers.FloatField()
    intervention_measure_effectiveness = serializers.ListField()
    total_interventions = serializers.IntegerField()
    active_interventions = serializers.IntegerField()
    closed_interventions = serializers.IntegerField()
    total_reviews = serializers.IntegerField()
    total_reminders = serializers.IntegerField()
    pending_reminders = serializers.IntegerField()
