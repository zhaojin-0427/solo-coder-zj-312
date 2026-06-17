import React, { useState, useEffect } from 'react';
import {
  getPlanRiskAlerts, assessPlanRisk, pausePlan, completePlan, updateTrainingPlan
} from '../api';
import { PLAN_RISK_LEVEL_MAP, PLAN_ADJUSTMENT_MAP, PLAN_STATUS_MAP, LEVEL_MAP } from '../constants';

export default function PlanRiskAlerts() {
  const [plans, setPlans] = useState([]);

  const fetchData = async () => {
    try {
      const res = await getPlanRiskAlerts();
      const results = res.results || res;
      setPlans(Array.isArray(results) ? results : []);
    } catch {
      setPlans([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssess = async (id) => {
    await assessPlanRisk(id);
    fetchData();
  };

  const handlePause = async (id) => {
    if (!window.confirm('确定暂停该计划？')) return;
    await pausePlan(id);
    fetchData();
  };

  const handleComplete = async (id) => {
    if (!window.confirm('确定完成该计划？')) return;
    await completePlan(id);
    fetchData();
  };

  const riskLevelBadge = (level) => {
    const map = { low: 'badge-warning', medium: 'badge-info', high: 'badge-danger', normal: 'badge-success' };
    return map[level] || 'badge-info';
  };

  const riskBorderStyle = (level) => {
    const map = { high: 'var(--danger)', medium: 'var(--info)', low: 'var(--warning)', normal: 'var(--success)' };
    return { borderLeft: `4px solid ${map[level] || 'var(--info)'}` };
  };

  const adjustmentBadge = (adj) => {
    const map = { downgrade: 'badge-danger', pause: 'badge-danger', insole: 'badge-warning', refit: 'badge-warning', strengthen: 'badge-info', stretch: 'badge-info', none: 'badge-success' };
    return map[adj] || 'badge-info';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN');
  };

  const progressPercent = (plan) => {
    if (plan.progress_percent != null) return plan.progress_percent;
    if (plan.start_date && plan.end_date) {
      const start = new Date(plan.start_date).getTime();
      const end = new Date(plan.end_date).getTime();
      const now = Date.now();
      if (end <= start) return 0;
      const pct = Math.round(((now - start) / (end - start)) * 100);
      return Math.max(0, Math.min(100, pct));
    }
    return 0;
  };

  return (
    <div>
      <div className="page-header">
        <h2>计划风险提醒</h2>
        {plans.length > 0 && (
          <span className="badge badge-danger" style={{ fontSize: 14, padding: '6px 14px' }}>
            {plans.length} 个风险计划
          </span>
        )}
      </div>

      {plans.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
            <p>暂无风险计划</p>
          </div>
        </div>
      ) : (
        <div className="stats-grid">
          {plans.map(plan => (
            <div key={plan.id} className="stat-card" style={riskBorderStyle(plan.risk_level)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{plan.plan_name || plan.name || '-'}</h3>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{plan.student_name || plan.student?.name || '-'}</span>
                </div>
                <span className={`badge ${riskLevelBadge(plan.risk_level)}`}>
                  {PLAN_RISK_LEVEL_MAP[plan.risk_level] || plan.risk_level}
                </span>
              </div>

              {plan.risk_reasons && (
                <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)' }}>{plan.risk_reasons}</p>
              )}

              {plan.adjustment_suggestion && (
                <div style={{ marginBottom: 8 }}>
                  <span className={`badge ${adjustmentBadge(plan.adjustment_suggestion)}`}>
                    {PLAN_ADJUSTMENT_MAP[plan.adjustment_suggestion] || plan.adjustment_suggestion}
                  </span>
                </div>
              )}

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                计划周期：{formatDate(plan.start_date)} ~ {formatDate(plan.end_date)}
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                负责教师：{plan.teacher_name || plan.teacher?.name || '-'}
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span>进度</span>
                  <span>{progressPercent(plan)}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPercent(plan)}%`, background: 'var(--primary)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn btn-info btn-sm" onClick={() => handleAssess(plan.id)}>风险评估</button>
                {plan.status !== 'paused' && (
                  <button className="btn btn-warning btn-sm" onClick={() => handlePause(plan.id)}>暂停计划</button>
                )}
                {plan.status !== 'completed' && (
                  <button className="btn btn-success btn-sm" onClick={() => handleComplete(plan.id)}>完成计划</button>
                )}
                <button className="btn btn-outline btn-sm">查看详情</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
