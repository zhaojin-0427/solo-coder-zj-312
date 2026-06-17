import React, { useState, useEffect } from 'react';
import { getStatistics } from '../api';
import { HARDNESS_MAP, LEVEL_MAP, PAIN_LOCATION_MAP, ALERT_STATUS_MAP, ALERT_TYPE_MAP } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export default function Statistics() {
  const [data, setData] = useState({
    brand_fit_rate: [],
    avg_lifespan: [],
    pain_hotspots: [],
    level_preferences: [],
    alert_status_distribution: [],
    alert_type_distribution: [],
    followup_overdue_count: 0,
    followup_pending_count: 0,
    avg_handle_hours: 0,
    followup_rate: 0,
  });

  useEffect(() => {
    getStatistics().then(setData).catch(console.error);
  }, []);

  const fitRateData = data.brand_fit_rate.map(b => ({
    brand: b.brand,
    '适配成功率(%)': b.rate,
    '总试鞋数': b.total,
  }));

  const lifespanData = data.avg_lifespan.map(l => ({
    brand: l.brand,
    '平均使用寿命(小时)': l.avg_hours,
  }));

  const painData = data.pain_hotspots.map(p => ({
    name: p.label,
    count: p.count,
    avgPain: p.avg_pain_level,
  }));

  const levelPrefMap = {};
  data.level_preferences.forEach(lp => {
    const key = lp.level_label;
    if (!levelPrefMap[key]) levelPrefMap[key] = { name: key };
    levelPrefMap[key][`${lp.brand}(${HARDNESS_MAP[lp.hardness]})`] = lp.count;
  });

  const levelPrefBrands = [...new Set(data.level_preferences.map(lp => `${lp.brand}(${HARDNESS_MAP[lp.hardness]})`))];
  const levelPrefData = Object.values(levelPrefMap);

  const pieData = data.pain_hotspots.map(p => ({
    name: p.label,
    value: p.count,
  }));

  const alertStatusData = (data.alert_status_distribution || []).map(s => ({
    name: s.label,
    count: s.count,
  }));

  const alertTypeData = (data.alert_type_distribution || []).map(t => ({
    name: t.label,
    count: t.count,
  }));

  const alertStatusPie = (data.alert_status_distribution || []).map(s => ({
    name: s.label,
    value: s.count,
  }));

  return (
    <div>
      <div className="page-header">
        <h2>统计分析</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>各品牌适配成功率</h3>
          {fitRateData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fitRateData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="brand" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="适配成功率(%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>暂无数据</p></div>
          )}
        </div>

        <div className="stat-card">
          <h3>品牌平均使用寿命</h3>
          {lifespanData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lifespanData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="brand" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="平均使用寿命(小时)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>暂无数据</p></div>
          )}
        </div>

        <div className="stat-card">
          <h3>伤痛高发部位分布</h3>
          {pieData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} dataKey="value">
                    {pieData.map((_, index) => (
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
          <h3>伤痛部位详情</h3>
          {painData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={painData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" fontSize={11} />
                  <PolarRadiusAxis fontSize={10} />
                  <Radar name="发生次数" dataKey="count" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                  <Radar name="平均疼痛等级" dataKey="avgPain" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>暂无数据</p></div>
          )}
        </div>

        <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
          <h3>不同级别学员鞋型偏好</h3>
          {levelPrefData.length > 0 ? (
            <div className="chart-container" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelPrefData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  {levelPrefBrands.slice(0, 6).map((brand, i) => (
                    <Bar key={brand} dataKey={brand} fill={COLORS[i % COLORS.length]} stackId="a" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>暂无数据</p></div>
          )}
        </div>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 16px', color: 'var(--text)' }}>预警处置与回访统计</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>预警状态分布</h3>
          {alertStatusPie.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={alertStatusPie} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} dataKey="value">
                    {alertStatusPie.map((_, index) => (
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
          <h3>预警类型分布</h3>
          {alertTypeData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertTypeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="预警数量" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>暂无数据</p></div>
          )}
        </div>

        <div className="stat-card">
          <h3>各状态预警数量</h3>
          {alertStatusData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertStatusData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="数量" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p>暂无数据</p></div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>数据概览</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: 16, background: '#f0f0ff', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{data.brand_fit_rate.length}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>涉及品牌数</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f0fff0', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>
                {data.brand_fit_rate.length > 0 ? Math.round(data.brand_fit_rate.reduce((a, b) => a + b.rate, 0) / data.brand_fit_rate.length) : 0}%
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>平均适配成功率</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#fff8f0', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>{data.pain_hotspots.length}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>伤痛部位类型</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f0f8ff', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--info)' }}>{data.avg_lifespan.length > 0 ? Math.round(data.avg_lifespan.reduce((a, b) => a + b.avg_hours, 0) / data.avg_lifespan.length) : 0}h</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>平均使用寿命</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#fff0f0', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>{data.followup_overdue_count}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>回访逾期数</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f5f0ff', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{data.followup_pending_count}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>待回访数</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#f0fff8', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>{data.avg_handle_hours}h</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>平均处置时长</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: '#fff8f0', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>{data.followup_rate}%</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>回访完成率</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
