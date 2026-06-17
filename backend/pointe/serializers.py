from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from .models import (
    Student, FootProfile, ShoeFitting, TrainingLog, WearAlert,
    PointeShoeInventory, ShoeBorrowing, ShoeReturnCheck, InventoryAlert
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


class ShoeBorrowingSerializer(serializers.ModelSerializer):
    shoe_brand = serializers.CharField(source='shoe.brand', read_only=True)
    shoe_size = serializers.CharField(source='shoe.size', read_only=True)
    shoe_last_type = serializers.CharField(source='shoe.last_type', read_only=True)
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
