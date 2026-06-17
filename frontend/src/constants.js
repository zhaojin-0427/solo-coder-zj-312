export const LEVEL_MAP = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
  professional: '专业',
};

export const ARCH_MAP = {
  low: '低足弓',
  medium: '正常足弓',
  high: '高足弓',
};

export const INSTEP_MAP = {
  weak: '较弱',
  medium: '中等',
  strong: '较强',
};

export const HARDNESS_MAP = {
  soft: '软',
  medium: '中等',
  hard: '硬',
};

export const BOX_HEIGHT_MAP = {
  low: '低',
  medium: '中等',
  high: '高',
};

export const RIBBON_MAP = {
  cross: '交叉式',
  straight: '直绑式',
  wrap: '缠绕式',
};

export const FIT_RESULT_MAP = {
  excellent: '非常合适',
  good: '较合适',
  fair: '一般',
  poor: '不合适',
};

export const STABILITY_MAP = {
  excellent: '非常稳定',
  good: '较稳定',
  fair: '一般',
  poor: '不稳定',
};

export const SOFTENING_MAP = {
  none: '无明显软化',
  slight: '轻微软化',
  moderate: '中度软化',
  severe: '严重软化',
};

export const PAIN_LOCATION_MAP = {
  none: '无疼痛',
  toe: '脚趾',
  ball: '前脚掌',
  arch: '足弓',
  heel: '脚跟',
  ankle: '脚踝',
  instep: '脚背',
  multiple: '多部位',
};

export const ALERT_TYPE_MAP = {
  replace: '建议换鞋',
  insole: '建议调整鞋垫',
  hardness: '建议调整硬度',
  check: '建议检查',
};

export const ALERT_STATUS_MAP = {
  pending: '待处理',
  acknowledged: '已确认',
  handled: '已处置',
  followup: '待回访',
  resolved: '已解决',
};

export const SHOE_TYPE_MAP = {
  pointe: '足尖鞋',
  slipper: '训练软鞋',
  sample: '样鞋',
};

export const SHOE_STATUS_MAP = {
  available: '可借用',
  borrowed: '已借出',
  maintenance: '维护中',
  reserved: '已预留',
  retired: '已退役',
  lost: '已丢失',
};

export const SHOE_HARDNESS_MAP = {
  soft: '软',
  medium: '中等',
  hard: '硬',
  extra_hard: '特硬',
};

export const BORROWING_PURPOSE_MAP = {
  fitting: '试穿预约',
  training: '训练借用',
  performance: '演出借用',
  rehearsal: '排练借用',
  testing: '样鞋测试',
  other: '其他',
};

export const BORROWING_STATUS_MAP = {
  reserved: '已预约',
  borrowed: '已借出',
  returned: '已归还',
  overdue: '已逾期',
  cancelled: '已取消',
};

export const RETURN_CONDITION_MAP = {
  excellent: '完好',
  good: '良好',
  fair: '一般',
  poor: '破损',
};

export const ABNORMAL_TYPE_MAP = {
  none: '无异常',
  dirty: '污渍',
  damaged: '破损',
  worn: '严重磨损',
  missing_part: '配件缺失',
  wrong_size: '尺码错误',
  other: '其他',
};

export const INVENTORY_ALERT_TYPE_MAP = {
  overdue: '借用逾期',
  abnormal_return: '归还异常',
  low_stock: '库存不足',
  high_borrow_count: '借用次数过高',
  maintenance_due: '待维护',
  lost: '已丢失',
};

export const INVENTORY_ALERT_STATUS_MAP = {
  pending: '待处理',
  acknowledged: '已确认',
  resolved: '已解决',
  dismissed: '已忽略',
};

export const PLAN_STATUS_MAP = {
  active: '进行中',
  completed: '已完成',
  paused: '已暂停',
  cancelled: '已取消',
};

export const PLAN_RISK_LEVEL_MAP = {
  normal: '正常',
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

export const PLAN_ADJUSTMENT_MAP = {
  none: '无需调整',
  downgrade: '建议降级训练',
  pause: '建议暂停上鞋',
  insole: '建议调整鞋垫',
  refit: '建议重新试鞋',
  strengthen: '建议加强力量训练',
  stretch: '建议增加拉伸',
};

export const TARGET_LEVEL_MAP = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
  professional: '专业',
};

export const EXERCISE_COMPLETION_MAP = {
  excellent: '优秀(≥90%)',
  good: '良好(70-89%)',
  fair: '一般(50-69%)',
  poor: '较差(<50%)',
};

export const ACHIEVEMENT_MAP = {
  excellent: '优秀',
  good: '良好',
  fair: '一般',
  poor: '未达标',
};

export const PROGRESS_SUGGESTION_MAP = {
  promote: '建议晋级',
  continue: '继续当前阶段',
  adjust: '调整计划后继续',
  regress: '建议降级',
};
