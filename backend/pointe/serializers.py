from rest_framework import serializers
from .models import Student, FootProfile, ShoeFitting, TrainingLog, WearAlert


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

    class Meta:
        model = WearAlert
        fields = '__all__'
        read_only_fields = ['created_at', 'resolved_at']


class StatisticsSerializer(serializers.Serializer):
    brand_fit_rate = serializers.ListField()
    avg_lifespan = serializers.ListField()
    pain_hotspots = serializers.ListField()
    level_preferences = serializers.ListField()
