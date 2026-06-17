import React, { useState, useEffect } from 'react';
import { getRehabilitationStatistics } from '../api';
import { INTERVENTION_PAIN_LOCATION_MAP, LEVEL_MAP } from '../constants';

export default function RehabilitationStatistics() {
  const [stats, setStats] = useState(null);

  const fetchData = async () => {
    try {
      const data = await getRehabilitationStatistics();
      setStats(data);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const overdueBadge = (rate) => {
    if (rate >= 50) return 'badge-danger';
    if (rate >= 30) return 'badge-warning';
    return 'badge-success';
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
        <h2>康复统计</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>总干预单数</h3>
          <div className="stat-value">{stats.total_interventions || 0}</div>
        </div>
        <div className="stat-card">
          <h3>干预中</h3>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.active_interventions || 0}</div>
        </div>
        <div className="stat-card">
          <h3>已关闭</h3>
          <div className="stat-value" style={{ color: 'var(--info)' }}>{stats.closed_interventions || 0}</div>
        </div>
        <div className="stat-card">
          <h3>待处理提醒</h3>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.pending_reminders || 0}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>高发疼痛部位分布</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(stats.pain_location_distribution || []).map(item => (
            <div key={item.pain_location}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>{INTERVENTION_PAIN_LOCATION_MAP[item.pain_location] || item.pain_location}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {item.count} 次 · 平均疼痛等级 {item.avg_pain_level}
                </span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(item.avg_pain_level * 10, 100)}%`,
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
        <h3 style={{ marginTop: 0 }}>不同级别学员干预数量</h3>
        {(stats.level_intervention_count || []).length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}><p>暂无数据</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>级别</th>
                <th>干预数量</th>
              </tr>
            </thead>
            <tbody>
              {(stats.level_intervention_count || []).map((item, idx) => (
                <tr key={idx}>
                  <td><strong>{LEVEL_MAP[item.level] || item.level}</strong></td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>平均恢复周期</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              minWidth: 120,
              padding: 16,
              background: '#f8f7ff',
              borderRadius: 8,
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 600, color: 'var(--primary)' }}>
              {stats.avg_recovery_days || 0}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              天
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>复查逾期率</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              minWidth: 120,
              padding: 16,
              background: '#f8f7ff',
              borderRadius: 8,
              textAlign: 'center'
            }}
          >
            <span className={`badge ${overdueBadge(stats.review_overdue_rate || 0)}`} style={{ marginBottom: 8 }}>
              {stats.review_overdue_rate >= 50 ? '需关注' : stats.review_overdue_rate >= 30 ? '一般' : '良好'}
            </span>
            <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>
              {stats.review_overdue_rate || 0}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              逾期率
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>干预措施效果</h3>
        {(stats.intervention_measure_effectiveness || []).length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}><p>暂无数据</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>干预措施</th>
                <th>数量</th>
                <th>平均初始疼痛</th>
                <th>平均复查疼痛</th>
                <th>改善率</th>
              </tr>
            </thead>
            <tbody>
              {(stats.intervention_measure_effectiveness || []).map((item, idx) => (
                <tr key={idx}>
                  <td><strong>{item.measure_name}</strong></td>
                  <td>{item.count}</td>
                  <td>{item.avg_initial_pain}</td>
                  <td>{item.avg_review_pain}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${item.improvement_rate}%`,
                            background: 'var(--success)',
                            borderRadius: 4,
                            transition: 'width 0.3s'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 40 }}>
                        {item.improvement_rate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
