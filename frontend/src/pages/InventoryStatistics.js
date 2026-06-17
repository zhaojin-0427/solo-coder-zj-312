import React, { useState, useEffect } from 'react';
import { getInventoryStatistics } from '../api';
import { LEVEL_MAP, BORROWING_PURPOSE_MAP } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export default function InventoryStatistics() {
  const [data, setData] = useState({
    brand_turnover: [],
    popular_sizes: [],
    abnormal_return_distribution: [],
    level_purpose_preferences: [],
    total_inventory: 0,
    available_inventory: 0,
    borrowed_inventory: 0,
    maintenance_inventory: 0,
    total_borrowings: 0,
    overdue_rate: 0,
    pending_alerts: 0,
  });

  useEffect(() => {
    getInventoryStatistics().then(setData).catch(console.error);
  }, []);

  const brandTurnoverData = data.brand_turnover.map(b => ({
    brand: b.brand,
    '周转率': b.turnover_rate,
    '借用次数': b.borrow_count,
    '鞋款数量': b.unique_shoes,
  }));

  const sizeBorrowData = data.popular_sizes.map(s => ({
    size: s.size,
    '借用次数': s.count,
  }));

  const abnormalReturnPieData = data.abnormal_return_distribution.map(r => ({
    name: r.label,
    value: r.count,
  }));

  const levelPrefMap = {};
  data.level_purpose_preferences.forEach(lp => {
    const key = LEVEL_MAP[lp.level] || lp.level;
    if (!levelPrefMap[key]) levelPrefMap[key] = { name: key };
    const purposeLabel = BORROWING_PURPOSE_MAP[lp.purpose] || lp.purpose;
    levelPrefMap[key][purposeLabel] = lp.count;
  });

  const levelPrefPurposes = [...new Set(data.level_purpose_preferences.map(lp => BORROWING_PURPOSE_MAP[lp.purpose] || lp.purpose))];
  const levelPrefData = Object.values(levelPrefMap);

  return (
    <div>
      <div className="page-header">
        <h2>库存统计分析</h2>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>数据概览</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: 16, background: '#f0f0ff', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{data.total_inventory}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>总库存</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f0fff0', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>{data.available_inventory}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>可借用</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f0f8ff', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--info)' }}>{data.borrowed_inventory}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>已借出</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#fff8f0', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>{data.maintenance_inventory}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>维护中</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f5f0ff', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6' }}>{data.total_borrowings}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>总借用数</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#fff0f0', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>{data.overdue_rate}%</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>逾期率</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#fff0f8', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#ec4899' }}>{data.pending_alerts}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>待处理提醒</div>
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 16px', color: 'var(--text)' }}>库存流转分析</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>品牌库存周转率</h3>
          {brandTurnoverData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandTurnoverData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="brand" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="周转率" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>暂无数据</p></div>
          )}
        </div>

        <div className="stat-card">
          <h3>热门尺码借用次数</h3>
          {sizeBorrowData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeBorrowData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="size" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="借用次数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>暂无数据</p></div>
          )}
        </div>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 16px', color: 'var(--text)' }}>归还分析</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>异常归还原因分布</h3>
          {abnormalReturnPieData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={abnormalReturnPieData} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} dataKey="value">
                    {abnormalReturnPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>暂无数据</p></div>
          )}
        </div>

        <div className="stat-card">
          <h3>逾期归还率</h3>
          <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: data.overdue_rate > 10 ? '#ef4444' : '#10b981' }}>
                {data.overdue_rate}%
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>
                {data.overdue_rate > 10 ? '逾期率偏高，需加强管理' : '逾期率控制良好'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 16px', color: 'var(--text)' }}>学员借用偏好</h3>
      <div className="stats-grid">
        <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
          <h3>不同级别学员的借用用途偏好</h3>
          {levelPrefData.length > 0 ? (
            <div className="chart-container" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelPrefData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  {levelPrefPurposes.map((purpose, i) => (
                    <Bar key={purpose} dataKey={purpose} fill={COLORS[i % COLORS.length]} stackId="a" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>暂无数据</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
