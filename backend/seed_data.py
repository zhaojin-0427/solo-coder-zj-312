import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from pointe.models import Student, FootProfile, ShoeFitting, TrainingLog, WearAlert
from datetime import date, timedelta
import random

Student.objects.all().delete()

names = ['李雪', '王芳', '张娜', '刘洋', '陈静', '赵敏', '孙婷', '周琳', '吴悦', '郑瑶',
         '黄蕾', '马欣', '朱颖', '胡雪', '林菲', '何冰', '高洁', '郭美', '罗曼', '梁韵']
levels = ['beginner', 'intermediate', 'advanced', 'professional']
level_names = {'beginner': '初级', 'intermediate': '中级', 'advanced': '高级', 'professional': '专业'}
arches = ['low', 'medium', 'high']
insteps = ['weak', 'medium', 'strong']
brands = ['Grishko', 'Freed', 'Bloch', 'Capezio', 'Gaynor Minden', 'Suffolk', 'Russian Pointe']
last_types = ['U-cut', 'V-cut', 'Square', 'Tapered']
hardnesses = ['soft', 'medium', 'hard']
box_heights = ['low', 'medium', 'high']
ribbons = ['cross', 'straight', 'wrap']
fit_results = ['excellent', 'good', 'fair', 'poor']
stabilities = ['excellent', 'good', 'fair', 'poor']
softenings = ['none', 'slight', 'moderate', 'severe']
pain_locs = ['none', 'toe', 'ball', 'arch', 'heel', 'ankle', 'instep', 'multiple']

students = []
for i, name in enumerate(names):
    s = Student.objects.create(
        name=name,
        level=random.choice(levels),
        age=random.randint(12, 28),
        phone=f'138{random.randint(10000000, 99999999)}'
    )
    students.append(s)

    FootProfile.objects.create(
        student=s,
        foot_length=random.uniform(220, 270),
        foot_width=random.uniform(80, 105),
        arch_height=random.choice(arches),
        instep_strength=random.choice(insteps),
        past_injuries=random.choice(['无', '脚踝扭伤', '足底筋膜炎', '拇外翻', '应力性骨折', '无', '无', '无']),
    )

fittings = []
for s in students:
    for _ in range(random.randint(1, 3)):
        f = ShoeFitting.objects.create(
            student=s,
            brand=random.choice(brands),
            last_type=random.choice(last_types),
            hardness=random.choice(hardnesses),
            box_height=random.choice(box_heights),
            ribbon_style=random.choice(ribbons),
            size=f'{random.randint(3, 8)}{random.choice(["", "X", "XX"])}',
            fit_result=random.choice(fit_results),
            fitting_date=date.today() - timedelta(days=random.randint(30, 180)),
        )
        fittings.append(f)

today = date.today()
for f in fittings:
    max_days = (today - f.fitting_date).days
    num_logs = min(random.randint(15, 40), max_days // 2 + 1)
    for j in range(num_logs):
        log_date = f.fitting_date + timedelta(days=j * 2 + random.randint(0, 2))
        if log_date > today:
            log_date = today - timedelta(days=random.randint(0, j))
        dur = random.randint(60, 180)
        pain_loc = random.choice(pain_locs)
        pain_lvl = random.randint(0, 8) if pain_loc != 'none' else 0
        TrainingLog.objects.create(
            student=f.student,
            shoe_fitting=f,
            date=log_date,
            duration_minutes=dur,
            stability=random.choice(stabilities),
            pain_location=pain_loc,
            pain_level=pain_lvl,
            sole_softening=random.choice(softenings),
        )

for f in fittings:
    logs = TrainingLog.objects.filter(shoe_fitting=f)
    total_hours = sum(l.duration_minutes for l in logs) / 60
    if total_hours >= 30:
        if total_hours >= 80:
            alert_type = 'replace'
            reason = f'累计训练{total_hours:.1f}小时，已超过建议使用寿命，建议更换足尖鞋'
        elif total_hours >= 50:
            alert_type = 'insole'
            reason = f'累计训练{total_hours:.1f}小时，建议调整鞋垫以增强支撑'
        else:
            alert_type = random.choice(['hardness', 'check'])
            if alert_type == 'hardness':
                reason = f'鞋底出现软化迹象，累计训练{total_hours:.1f}小时，建议考虑调整硬度'
            else:
                reason = f'训练反馈有疼痛情况，累计训练{total_hours:.1f}小时，建议检查鞋型适配'
        WearAlert.objects.create(
            student=f.student,
            shoe_fitting=f,
            alert_type=alert_type,
            reason=reason,
            status=random.choice(['pending', 'acknowledged', 'resolved'])
        )

print('种子数据创建完成！')
print(f'学员: {Student.objects.count()}')
print(f'足型档案: {FootProfile.objects.count()}')
print(f'试鞋记录: {ShoeFitting.objects.count()}')
print(f'训练日志: {TrainingLog.objects.count()}')
print(f'磨损预警: {WearAlert.objects.count()}')
