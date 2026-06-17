import React, { useState, useEffect } from 'react';
import { getPlanStatistics } from '../api';
import { PLAN_RISK_LEVEL_MAP, PLAN_STATUS_MAP } from '../constants';

export default function PlanStatistics() {
  const [stats, setStats] = useState(null);

  const fetchData = async () => {
    try {
      const data = await getPlanStatistics();
      setStats(data);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const achievementBadge = (r) => {
    const map = { excellent: 'badge-success', good: 'badge-info', fair: 'badge-warning', poor: 'badge-danger' };
    return map[r] || 'badge-info';
  };

  const riskColor = (level) => {
    const map = { normal: 'var(--success)', low: 'var(--warning)', medium: 'var(--info)', high: 'var(--danger)' };
    return map[level] || 'var(--text-secondary)';
  };

  if (!stats) {
    return (
      <div className="card">
        <div className="empty-state"><p>加载中...</p></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>计划统计</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>总计划数</h3>
          <div className="stat-value">{stats.total_plans || 0}</div>
        </div>
        <div className="stat-card">
          <h3>进行中</h3>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.active_plans || 0}</div>
        </div>
        <div className="stat-card">
          <h3>已完成</h3>
          <div className="stat-value" style={{ color: 'var(--info)' }}>{stats.completed_plans || 0}</div>
        </div>
        <div className="stat-card">
          <h3>风险计划</h3>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.risk_plans || 0}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>不同级别学员计划完成率</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(stats.level_completion_rate || []).map(item => (
            <div key={item.level}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{item.level_label}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {item.completed_plans}/{item.total_plans} 完成 · {item.completion_rate}%
                </span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${item.completion_rate}%`,
                    background: 'var(--primary)',
                    borderRadius: 4,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>风险计划占比</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {(stats.risk_plan_ratio || []).map(item => (
            <div
              key={item.risk_level}
              style={{
                flex: 1,
                minWidth: 120,
                padding: 16,
                background: '#f8f7ff',
                borderRadius: 8,
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 600, color: riskColor(item.risk_level) }}>
                {item.ratio}%
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                {item.risk_label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {item.count} 个计划
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>常见调整原因</h3>
        {(stats.common_adjustment_reasons || []).length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}><p>暂无调整记录</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>调整建议</th>
                <th>计划数</th>
                <th>常见原因</th>
              </tr>
            </thead>
            <tbody>
              {(stats.common_adjustment_reasons || []).map((item, idx) => (
                <tr key={idx}>
                  <td><strong>{item.suggestion}</strong></td>
                  <td>{item.count}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {item.reasons && item.reasons.length > 0
                      ? [...new Set(item.reasons)].join('；')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>训练目标达成率</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {(stats.target_achievement_rate || []).map(item => (
            <div
              key={item.result}
              style={{
                flex: 1,
                minWidth: 120,
                padding: 16,
                background: '#f8f7ff',
                borderRadius: 8,
                textAlign: 'center'
              }}
            >
              <span className={`badge ${achievementBadge(item.result)}`} style={{ marginBottom: 8 }}>
                {item.result_label}
              </span>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 8 }}>
                {item.rate}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {item.count} 次评估
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>负责教师计划跟进情况</h3>
        {(stats.teacher_followup || []).length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}><p>暂无数据</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>负责教师</th>
                <th>总计划数</th>
                <th>进行中</th>
                <th>已完成</th>
                <th>风险计划</th>
                <th>评估次数</th>
              </tr>
            </thead>
            <tbody>
              {(stats.teacher_followup || []).map((item, idx) => (
                <tr key={idx}>
                  <td><strong>{item.teacher || '未指定'}</strong></td>
                  <td>{item.total_plans}</td>
                  <td style={{ color: 'var(--success)' }}>{item.active_plans}</td>
                  <td style={{ color: 'var(--info)' }}>{item.completed_plans}</td>
                  <td>
                    {item.risk_plans > 0 ? (
                      <span className="badge badge-danger">{item.risk_plans} 个风险</span>
                    ) : '-'}
                  </td>
                  <td>{item.evaluations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
