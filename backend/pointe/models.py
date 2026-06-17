from django.db import models
from django.db.models import Q
from django.utils import timezone


class Student(models.Model):
    LEVEL_CHOICES = [
        ('beginner', '初级'),
        ('intermediate', '中级'),
        ('advanced', '高级'),
        ('professional', '专业'),
    ]

    name = models.CharField(max_length=100, verbose_name='姓名')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner', verbose_name='级别')
    age = models.IntegerField(verbose_name='年龄')
    phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '学员'
        verbose_name_plural = '学员'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.get_level_display()})'


class FootProfile(models.Model):
    ARCH_CHOICES = [
        ('low', '低足弓'),
        ('medium', '正常足弓'),
        ('high', '高足弓'),
    ]
    INSTEP_CHOICES = [
        ('weak', '较弱'),
        ('medium', '中等'),
        ('strong', '较强'),
    ]

    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='foot_profile', verbose_name='学员')
    foot_length = models.FloatField(verbose_name='脚长(mm)')
    foot_width = models.FloatField(verbose_name='脚宽(mm)')
    arch_height = models.CharField(max_length=10, choices=ARCH_CHOICES, default='medium', verbose_name='足弓高度')
    instep_strength = models.CharField(max_length=10, choices=INSTEP_CHOICES, default='medium', verbose_name='脚背力量')
    past_injuries = models.TextField(blank=True, verbose_name='既往伤痛')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '足型档案'
        verbose_name_plural = '足型档案'

    def __str__(self):
        return f'{self.student.name} 足型档案'


class ShoeBrand(models.Model):
    name = models.CharField(max_length=100, verbose_name='品牌名称')

    class Meta:
        verbose_name = '鞋品牌'
        verbose_name_plural = '鞋品牌'

    def __str__(self):
        return self.name


class ShoeFitting(models.Model):
    HARDNESS_CHOICES = [
        ('soft', '软'),
        ('medium', '中等'),
        ('hard', '硬'),
    ]
    BOX_HEIGHT_CHOICES = [
        ('low', '低'),
        ('medium', '中等'),
        ('high', '高'),
    ]
    RIBBON_CHOICES = [
        ('cross', '交叉式'),
        ('straight', '直绑式'),
        ('wrap', '缠绕式'),
    ]
    FIT_RESULT_CHOICES = [
        ('excellent', '非常合适'),
        ('good', '较合适'),
        ('fair', '一般'),
        ('poor', '不合适'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='shoe_fittings', verbose_name='学员')
    brand = models.CharField(max_length=100, verbose_name='品牌')
    last_type = models.CharField(max_length=100, verbose_name='楦型')
    hardness = models.CharField(max_length=10, choices=HARDNESS_CHOICES, default='medium', verbose_name='硬度')
    box_height = models.CharField(max_length=10, choices=BOX_HEIGHT_CHOICES, default='medium', verbose_name='鞋盒高度')
    ribbon_style = models.CharField(max_length=10, choices=RIBBON_CHOICES, default='cross', verbose_name='缎带固定方式')
    size = models.CharField(max_length=20, verbose_name='鞋码')
    fit_result = models.CharField(max_length=10, choices=FIT_RESULT_CHOICES, default='good', verbose_name='适配结果')
    fitting_date = models.DateField(verbose_name='试鞋日期')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '试鞋记录'
        verbose_name_plural = '试鞋记录'
        ordering = ['-fitting_date']

    def __str__(self):
        return f'{self.student.name} - {self.brand} {self.last_type}'


class TrainingLog(models.Model):
    STABILITY_CHOICES = [
        ('excellent', '非常稳定'),
        ('good', '较稳定'),
        ('fair', '一般'),
        ('poor', '不稳定'),
    ]
    SOFTENING_CHOICES = [
        ('none', '无明显软化'),
        ('slight', '轻微软化'),
        ('moderate', '中度软化'),
        ('severe', '严重软化'),
    ]
    PAIN_LOCATION_CHOICES = [
        ('none', '无疼痛'),
        ('toe', '脚趾'),
        ('ball', '前脚掌'),
        ('arch', '足弓'),
        ('heel', '脚跟'),
        ('ankle', '脚踝'),
        ('instep', '脚背'),
        ('multiple', '多部位'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='training_logs', verbose_name='学员')
    shoe_fitting = models.ForeignKey(ShoeFitting, on_delete=models.SET_NULL, null=True, blank=True, related_name='training_logs', verbose_name='关联鞋子')
    date = models.DateField(verbose_name='训练日期')
    duration_minutes = models.IntegerField(verbose_name='上鞋时长(分钟)')
    stability = models.CharField(max_length=10, choices=STABILITY_CHOICES, default='good', verbose_name='足尖稳定度')
    pain_location = models.CharField(max_length=10, choices=PAIN_LOCATION_CHOICES, default='none', verbose_name='疼痛部位')
    pain_level = models.IntegerField(default=0, verbose_name='疼痛等级(0-10)')
    sole_softening = models.CharField(max_length=10, choices=SOFTENING_CHOICES, default='none', verbose_name='鞋底软化程度')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '训练日志'
        verbose_name_plural = '训练日志'
        ordering = ['-date']

    def __str__(self):
        return f'{self.student.name} - {self.date}'


class WearAlert(models.Model):
    ALERT_TYPE_CHOICES = [
        ('replace', '建议换鞋'),
        ('insole', '建议调整鞋垫'),
        ('hardness', '建议调整硬度'),
        ('check', '建议检查'),
    ]
    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('acknowledged', '已确认'),
        ('handled', '已处置'),
        ('followup', '待回访'),
        ('resolved', '已解决'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='wear_alerts', verbose_name='学员')
    shoe_fitting = models.ForeignKey(ShoeFitting, on_delete=models.CASCADE, related_name='wear_alerts', verbose_name='关联鞋子')
    alert_type = models.CharField(max_length=10, choices=ALERT_TYPE_CHOICES, default='replace', verbose_name='预警类型')
    reason = models.TextField(verbose_name='预警原因')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    handler = models.CharField(max_length=100, blank=True, verbose_name='处置人')
    handling_plan = models.TextField(blank=True, verbose_name='处置方案')
    handling_notes = models.TextField(blank=True, verbose_name='备注')
    suggested_followup_date = models.DateField(null=True, blank=True, verbose_name='建议回访日期')
    actual_followup_date = models.DateField(null=True, blank=True, verbose_name='实际回访日期')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    handled_at = models.DateTimeField(null=True, blank=True, verbose_name='处置时间')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解决时间')

    class Meta:
        verbose_name = '磨损预警'
        verbose_name_plural = '磨损预警'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.student.name} - {self.get_alert_type_display()}'


class PointeShoeInventory(models.Model):
    SHOE_TYPE_CHOICES = [
        ('pointe', '足尖鞋'),
        ('slipper', '训练软鞋'),
        ('sample', '样鞋'),
    ]

    STATUS_CHOICES = [
        ('available', '可借用'),
        ('borrowed', '已借出'),
        ('maintenance', '维护中'),
        ('reserved', '已预留'),
        ('retired', '已退役'),
        ('lost', '已丢失'),
    ]

    HARDNESS_CHOICES = [
        ('soft', '软'),
        ('medium', '中等'),
        ('hard', '硬'),
        ('extra_hard', '特硬'),
    ]

    BOX_HEIGHT_CHOICES = [
        ('low', '低'),
        ('medium', '中等'),
        ('high', '高'),
    ]

    shoe_type = models.CharField(max_length=20, choices=SHOE_TYPE_CHOICES, default='pointe', verbose_name='鞋类型')
    brand = models.CharField(max_length=100, verbose_name='品牌')
    last_type = models.CharField(max_length=100, verbose_name='楦型')
    size = models.CharField(max_length=20, verbose_name='尺码')
    width = models.CharField(max_length=10, blank=True, verbose_name='鞋宽')
    hardness = models.CharField(max_length=20, choices=HARDNESS_CHOICES, default='medium', verbose_name='硬度')
    box_height = models.CharField(max_length=10, choices=BOX_HEIGHT_CHOICES, default='medium', verbose_name='鞋盒高度')
    shank_type = models.CharField(max_length=50, blank=True, verbose_name='鞋底类型')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available', verbose_name='当前状态')
    classroom = models.CharField(max_length=100, blank=True, verbose_name='所在教室')
    cabinet = models.CharField(max_length=50, blank=True, verbose_name='柜位')
    purchase_date = models.DateField(null=True, blank=True, verbose_name='购入日期')
    entry_date = models.DateField(auto_now_add=True, verbose_name='入库日期')
    max_borrow_count = models.IntegerField(default=10, verbose_name='最大可借用次数')
    current_borrow_count = models.IntegerField(default=0, verbose_name='已借用次数')
    safety_stock = models.IntegerField(default=1, verbose_name='安全库存数量')
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='购入价格')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '鞋款库存'
        verbose_name_plural = '鞋款库存'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.brand} {self.last_type} {self.size} {self.get_shoe_type_display()}'

    @property
    def remaining_borrow_count(self):
        return max(0, self.max_borrow_count - self.current_borrow_count)

    @property
    def is_below_safety_stock(self):
        same_models = PointeShoeInventory.objects.filter(
            brand=self.brand,
            last_type=self.last_type,
            size=self.size,
            shoe_type=self.shoe_type
        ).exclude(status__in=['retired', 'lost'])
        return same_models.count() < self.safety_stock


class ShoeBorrowing(models.Model):
    PURPOSE_CHOICES = [
        ('fitting', '试穿预约'),
        ('training', '训练借用'),
        ('performance', '演出借用'),
        ('rehearsal', '排练借用'),
        ('testing', '样鞋测试'),
        ('other', '其他'),
    ]

    STATUS_CHOICES = [
        ('reserved', '已预约'),
        ('borrowed', '已借出'),
        ('returned', '已归还'),
        ('overdue', '已逾期'),
        ('cancelled', '已取消'),
    ]

    shoe = models.ForeignKey(PointeShoeInventory, on_delete=models.CASCADE, related_name='borrowings', verbose_name='鞋款')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='shoe_borrowings', verbose_name='学员')
    fitting = models.ForeignKey(ShoeFitting, on_delete=models.SET_NULL, null=True, blank=True, related_name='borrowings', verbose_name='关联试鞋记录')
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='training', verbose_name='借用用途')
    expected_start_time = models.DateTimeField(verbose_name='预计开始时间')
    expected_end_time = models.DateTimeField(verbose_name='预计归还时间')
    actual_start_time = models.DateTimeField(null=True, blank=True, verbose_name='实际借出时间')
    actual_end_time = models.DateTimeField(null=True, blank=True, verbose_name='实际归还时间')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reserved', verbose_name='状态')
    reservation_notes = models.TextField(blank=True, verbose_name='预约备注')
    borrow_notes = models.TextField(blank=True, verbose_name='借出备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '借用排班'
        verbose_name_plural = '借用排班'
        ordering = ['-expected_start_time']

    def __str__(self):
        return f'{self.student.name} - {self.shoe.brand} {self.shoe.size}'

    @property
    def is_overdue(self):
        if self.status in ['returned', 'cancelled']:
            return False
        now = timezone.now()
        return now > self.expected_end_time

    @classmethod
    def check_time_conflict(cls, shoe_id, start_time, end_time, exclude_id=None):
        overlapping = cls.objects.filter(
            shoe_id=shoe_id,
            status__in=['reserved', 'borrowed'],
            expected_start_time__lt=end_time,
            expected_end_time__gt=start_time
        )
        if exclude_id:
            overlapping = overlapping.exclude(id=exclude_id)
        return overlapping.exists()


class ShoeReturnCheck(models.Model):
    CONDITION_CHOICES = [
        ('excellent', '完好'),
        ('good', '良好'),
        ('fair', '一般'),
        ('poor', '破损'),
    ]

    ABNORMAL_TYPE_CHOICES = [
        ('none', '无异常'),
        ('dirty', '污渍'),
        ('damaged', '破损'),
        ('worn', '严重磨损'),
        ('missing_part', '配件缺失'),
        ('wrong_size', '尺码错误'),
        ('other', '其他'),
    ]

    borrowing = models.OneToOneField(ShoeBorrowing, on_delete=models.CASCADE, related_name='return_check', verbose_name='借用单')
    shoe = models.ForeignKey(PointeShoeInventory, on_delete=models.CASCADE, related_name='return_checks', verbose_name='鞋款')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='return_checks', verbose_name='学员')
    return_date = models.DateTimeField(default=timezone.now, verbose_name='归还日期')
    overall_condition = models.CharField(max_length=10, choices=CONDITION_CHOICES, default='good', verbose_name='整体状况')
    abnormal_type = models.CharField(max_length=20, choices=ABNORMAL_TYPE_CHOICES, default='none', verbose_name='异常类型')
    abnormal_description = models.TextField(blank=True, verbose_name='异常说明')
    cleaning_needed = models.BooleanField(default=False, verbose_name='需要清洁')
    repair_needed = models.BooleanField(default=False, verbose_name='需要维修')
    retire_shoe = models.BooleanField(default=False, verbose_name='建议退役')
    checked_by = models.CharField(max_length=100, blank=True, verbose_name='检查人')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '归还检查'
        verbose_name_plural = '归还检查'
        ordering = ['-return_date']

    def __str__(self):
        return f'{self.shoe.brand} 归还检查 - {self.return_date}'


class TrainingPlan(models.Model):
    STATUS_CHOICES = [
        ('active', '进行中'),
        ('completed', '已完成'),
        ('paused', '已暂停'),
        ('cancelled', '已取消'),
    ]
    RISK_LEVEL_CHOICES = [
        ('normal', '正常'),
        ('low', '低风险'),
        ('medium', '中风险'),
        ('high', '高风险'),
    ]
    ADJUSTMENT_CHOICES = [
        ('none', '无需调整'),
        ('downgrade', '建议降级训练'),
        ('pause', '建议暂停上鞋'),
        ('insole', '建议调整鞋垫'),
        ('refit', '建议重新试鞋'),
        ('strengthen', '建议加强力量训练'),
        ('stretch', '建议增加拉伸'),
    ]
    TARGET_LEVEL_CHOICES = [
        ('beginner', '初级'),
        ('intermediate', '中级'),
        ('advanced', '高级'),
        ('professional', '专业'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='training_plans', verbose_name='学员')
    foot_profile = models.ForeignKey(FootProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='training_plans', verbose_name='足型档案')
    shoe_fitting = models.ForeignKey(ShoeFitting, on_delete=models.SET_NULL, null=True, blank=True, related_name='training_plans', verbose_name='试鞋记录')
    plan_name = models.CharField(max_length=200, verbose_name='计划名称')
    start_date = models.DateField(verbose_name='开始日期')
    end_date = models.DateField(verbose_name='结束日期')
    target_level = models.CharField(max_length=20, choices=TARGET_LEVEL_CHOICES, verbose_name='训练级别目标')
    weekly_max_duration = models.IntegerField(verbose_name='每周上鞋时长上限(分钟)')
    key_exercises = models.TextField(verbose_name='重点练习动作')
    forbidden_exercises = models.TextField(blank=True, verbose_name='禁忌动作')
    strength_training = models.TextField(blank=True, verbose_name='辅助力量训练')
    evaluation_criteria = models.TextField(verbose_name='阶段评估标准')
    responsible_teacher = models.CharField(max_length=100, verbose_name='负责教师')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='状态')
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, default='normal', verbose_name='风险等级')
    risk_reasons = models.TextField(blank=True, verbose_name='风险原因')
    adjustment_suggestion = models.CharField(max_length=20, choices=ADJUSTMENT_CHOICES, default='none', verbose_name='调整建议')
    adjustment_notes = models.TextField(blank=True, verbose_name='调整说明')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '训练计划'
        verbose_name_plural = '训练计划'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.student.name} - {self.plan_name}'

    @property
    def progress_percent(self):
        records = self.weekly_records.all()
        if not records.exists():
            return 0
        total_weeks = max((self.end_date - self.start_date).days // 7, 1)
        submitted_weeks = records.filter(is_submitted=True).count()
        return min(round(submitted_weeks / total_weeks * 100, 1), 100)

    @property
    def current_week_number(self):
        today = timezone.now().date()
        if today < self.start_date:
            return 0
        return min((today - self.start_date).days // 7 + 1, max((self.end_date - self.start_date).days // 7, 1))

    def assess_risk(self):
        reasons = []
        risk = 'normal'
        records = self.weekly_records.filter(is_submitted=True).order_by('week_number')

        consecutive_pain_count = 0
        stability_declining = False
        prev_stability = None
        overtime_count = 0

        for r in records:
            if r.pain_level >= 5:
                consecutive_pain_count += 1
            else:
                consecutive_pain_count = 0

            if prev_stability is not None and r.stability_score is not None and prev_stability is not None:
                if r.stability_score < prev_stability - 10:
                    stability_declining = True
            if r.stability_score is not None:
                prev_stability = r.stability_score

            if r.actual_duration > self.weekly_max_duration:
                overtime_count += 1

        if consecutive_pain_count >= 3:
            risk = 'high'
            reasons.append(f'连续{consecutive_pain_count}周出现疼痛(等级≥5)')
        elif consecutive_pain_count >= 2:
            risk = 'medium'
            reasons.append(f'连续{consecutive_pain_count}周出现疼痛(等级≥5)')

        if stability_declining:
            if risk in ('normal', 'low'):
                risk = 'medium'
            reasons.append('稳定度评分持续下降(降幅>10)')

        if overtime_count >= 2:
            if risk == 'normal':
                risk = 'low'
            elif risk == 'low':
                risk = 'medium'
            reasons.append(f'累计{overtime_count}周超时训练')

        unhandled_wear_alerts = WearAlert.objects.filter(
            student=self.student, status__in=['pending', 'acknowledged']
        )
        if unhandled_wear_alerts.exists():
            if risk == 'normal':
                risk = 'low'
            reasons.append(f'{unhandled_wear_alerts.count()}条磨损预警未处理')

        suggestion = 'none'
        if risk == 'high':
            if consecutive_pain_count >= 3:
                suggestion = 'pause'
            else:
                suggestion = 'downgrade'
        elif risk == 'medium':
            if stability_declining:
                suggestion = 'insole'
            elif consecutive_pain_count >= 2:
                suggestion = 'downgrade'
            elif unhandled_wear_alerts.exists():
                suggestion = 'refit'
        elif risk == 'low':
            if overtime_count >= 2:
                suggestion = 'strengthen'
            elif unhandled_wear_alerts.exists():
                suggestion = 'refit'

        self.risk_level = risk
        self.risk_reasons = '；'.join(reasons) if reasons else ''
        self.adjustment_suggestion = suggestion
        self.save(update_fields=['risk_level', 'risk_reasons', 'adjustment_suggestion', 'updated_at'])
        return risk


class WeeklyExecutionRecord(models.Model):
    EXERCISE_COMPLETION_CHOICES = [
        ('excellent', '优秀(≥90%)'),
        ('good', '良好(70-89%)'),
        ('fair', '一般(50-69%)'),
        ('poor', '较差(<50%)'),
    ]
    PAIN_LOCATION_CHOICES = [
        ('none', '无疼痛'),
        ('toe', '脚趾'),
        ('ball', '前脚掌'),
        ('arch', '足弓'),
        ('heel', '脚跟'),
        ('ankle', '脚踝'),
        ('instep', '脚背'),
        ('multiple', '多部位'),
    ]

    training_plan = models.ForeignKey(TrainingPlan, on_delete=models.CASCADE, related_name='weekly_records', verbose_name='训练计划')
    week_number = models.IntegerField(verbose_name='周次')
    week_start_date = models.DateField(verbose_name='周开始日期')
    week_end_date = models.DateField(verbose_name='周结束日期')
    actual_duration = models.IntegerField(default=0, verbose_name='实际完成时长(分钟)')
    exercise_completion = models.CharField(max_length=20, choices=EXERCISE_COMPLETION_CHOICES, default='good', verbose_name='动作完成度')
    stability_score = models.IntegerField(null=True, blank=True, verbose_name='稳定度评分(0-100)')
    pain_location = models.CharField(max_length=20, choices=PAIN_LOCATION_CHOICES, default='none', verbose_name='疼痛部位')
    pain_level = models.IntegerField(default=0, verbose_name='疼痛等级(0-10)')
    teacher_comments = models.TextField(blank=True, verbose_name='教师评语')
    needs_adjustment = models.BooleanField(default=False, verbose_name='是否需要调整计划')
    adjustment_reason = models.TextField(blank=True, verbose_name='调整原因')
    is_submitted = models.BooleanField(default=False, verbose_name='是否已提交')
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name='提交时间')
    submitted_by = models.CharField(max_length=100, blank=True, verbose_name='提交人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '周执行记录'
        verbose_name_plural = '周执行记录'
        ordering = ['training_plan', 'week_number']
        unique_together = [('training_plan', 'week_number')]

    def __str__(self):
        return f'{self.training_plan.plan_name} 第{self.week_number}周'


class PhaseEvaluation(models.Model):
    ACHIEVEMENT_CHOICES = [
        ('excellent', '优秀'),
        ('good', '良好'),
        ('fair', '一般'),
        ('poor', '未达标'),
    ]
    PROGRESS_SUGGESTION_CHOICES = [
        ('promote', '建议晋级'),
        ('continue', '继续当前阶段'),
        ('adjust', '调整计划后继续'),
        ('regress', '建议降级'),
    ]

    training_plan = models.ForeignKey(TrainingPlan, on_delete=models.CASCADE, related_name='phase_evaluations', verbose_name='训练计划')
    evaluation_date = models.DateField(verbose_name='评估日期')
    phase_name = models.CharField(max_length=100, verbose_name='评估阶段')
    target_achievement = models.CharField(max_length=20, choices=ACHIEVEMENT_CHOICES, default='good', verbose_name='目标达成情况')
    stability_evaluation = models.CharField(max_length=20, choices=ACHIEVEMENT_CHOICES, default='good', verbose_name='稳定度评估')
    strength_evaluation = models.CharField(max_length=20, choices=ACHIEVEMENT_CHOICES, default='good', verbose_name='力量评估')
    pain_status = models.CharField(max_length=20, choices=ACHIEVEMENT_CHOICES, default='good', verbose_name='疼痛状况')
    overall_result = models.CharField(max_length=20, choices=ACHIEVEMENT_CHOICES, default='good', verbose_name='总体评估结果')
    progress_suggestion = models.CharField(max_length=20, choices=PROGRESS_SUGGESTION_CHOICES, default='continue', verbose_name='发展建议')
    improvement_points = models.TextField(blank=True, verbose_name='改进要点')
    next_phase_goals = models.TextField(blank=True, verbose_name='下一阶段目标')
    evaluator = models.CharField(max_length=100, verbose_name='评估人')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '阶段评估'
        verbose_name_plural = '阶段评估'
        ordering = ['training_plan', '-evaluation_date']

    def __str__(self):
        return f'{self.training_plan.plan_name} - {self.phase_name}'


class InventoryAlert(models.Model):
    ALERT_TYPE_CHOICES = [
        ('overdue', '借用逾期'),
        ('abnormal_return', '归还异常'),
        ('low_stock', '库存不足'),
        ('high_borrow_count', '借用次数过高'),
        ('maintenance_due', '待维护'),
        ('lost', '已丢失'),
    ]

    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('acknowledged', '已确认'),
        ('resolved', '已解决'),
        ('dismissed', '已忽略'),
    ]

    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES, verbose_name='提醒类型')
    shoe = models.ForeignKey(PointeShoeInventory, on_delete=models.CASCADE, related_name='alerts', null=True, blank=True, verbose_name='关联鞋款')
    borrowing = models.ForeignKey(ShoeBorrowing, on_delete=models.CASCADE, related_name='alerts', null=True, blank=True, verbose_name='关联借用单')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='inventory_alerts', null=True, blank=True, verbose_name='关联学员')
    message = models.TextField(verbose_name='提醒内容')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    handled_by = models.CharField(max_length=100, blank=True, verbose_name='处理人')
    handling_notes = models.TextField(blank=True, verbose_name='处理备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    acknowledged_at = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解决时间')

    class Meta:
        verbose_name = '库存提醒'
        verbose_name_plural = '库存提醒'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_alert_type_display()} - {self.status}'

    @classmethod
    def create_overdue_alerts(cls):
        now = timezone.now()
        overdue_borrowings = ShoeBorrowing.objects.filter(
            status__in=['reserved', 'borrowed'],
            expected_end_time__lt=now
        )
        for borrowing in overdue_borrowings:
            borrowing.status = 'overdue'
            borrowing.save()
            cls.objects.get_or_create(
                alert_type='overdue',
                borrowing=borrowing,
                shoe=borrowing.shoe,
                student=borrowing.student,
                status='pending',
                defaults={
                    'message': f'鞋款【{borrowing.shoe}】已逾期未归还，预计归还时间：{borrowing.expected_end_time}'
                }
            )

    @classmethod
    def create_low_stock_alerts(cls):
        shoes = PointeShoeInventory.objects.exclude(status__in=['retired', 'lost'])
        model_groups = {}
        for shoe in shoes:
            key = (shoe.brand, shoe.last_type, shoe.size, shoe.shoe_type)
            if key not in model_groups:
                model_groups[key] = []
            model_groups[key].append(shoe)

        for key, group in model_groups.items():
            safety_stock = group[0].safety_stock
            if len(group) < safety_stock:
                brand, last_type, size, shoe_type = key
                cls.objects.get_or_create(
                    alert_type='low_stock',
                    status='pending',
                    defaults={
                        'message': f'鞋款库存不足：{brand} {last_type} {size}（{dict(PointeShoeInventory.SHOE_TYPE_CHOICES)[shoe_type]}），当前库存：{len(group)}，安全库存：{safety_stock}'
                    }
                )

