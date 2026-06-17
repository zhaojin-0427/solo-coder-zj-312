from django.db import models


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
        ('resolved', '已解决'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='wear_alerts', verbose_name='学员')
    shoe_fitting = models.ForeignKey(ShoeFitting, on_delete=models.CASCADE, related_name='wear_alerts', verbose_name='关联鞋子')
    alert_type = models.CharField(max_length=10, choices=ALERT_TYPE_CHOICES, default='replace', verbose_name='预警类型')
    reason = models.TextField(verbose_name='预警原因')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解决时间')

    class Meta:
        verbose_name = '磨损预警'
        verbose_name_plural = '磨损预警'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.student.name} - {self.get_alert_type_display()}'
