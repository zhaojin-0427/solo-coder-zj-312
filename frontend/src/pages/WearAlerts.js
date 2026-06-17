import React, { useState, useEffect } from 'react';
import { getWearAlerts, resolveAlert, acknowledgeAlert } from '../api';
import { ALERT_TYPE_MAP, ALERT_STATUS_MAP } from '../constants';

export default function WearAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [pendingTotal, setPendingTotal] = useState(0);

  const fetchPendingTotal = async () => {
    try {
      const res = await getWearAlerts({ status: 'pending', page_size: 1 });
      setPendingTotal(res.count || 0);
    } catch {
      setPendingTotal(0);
    }
  };

  const fetchData = async (p = 1, status = '') => {
    const params = { page: p };
    if (status) params.status = status;
    const res = await getWearAlerts(params);
    const results = res.results || res;
    setAlerts(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  useEffect(() => {
    fetchData();
    fetchPendingTotal();
  }, []);

  const handleResolve = async (id) => {
    await resolveAlert(id);
    fetchData(page, filterStatus);
    fetchPendingTotal();
  };

  const handleAcknowledge = async (id) => {
    await acknowledgeAlert(id);
    fetchData(page, filterStatus);
    fetchPendingTotal();
  };

  const statusBadge = (s) => {
    const map = { pending: 'badge-danger', acknowledged: 'badge-warning', resolved: 'badge-success' };
    return map[s] || 'badge-info';
  };

  const alertTypeBadge = (t) => {
    const map = { replace: 'badge-danger', insole: 'badge-warning', hardness: 'badge-info', check: 'badge-primary' };
    return map[t] || 'badge-info';
  };

  const rowClass = (s) => {
    const map = { pending: 'alert-pending', acknowledged: 'alert-acknowledged', resolved: 'alert-resolved' };
    return map[s] || '';
  };

  return (
    <div>
      <div className="page-header">
        <h2>磨损预警</h2>
        {pendingTotal > 0 && (
          <span className="badge badge-danger" style={{ fontSize: 14, padding: '6px 14px' }}>
            {pendingTotal} 条待处理
          </span>
        )}
      </div>

      <div className="search-bar">
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); fetchData(1, e.target.value); }}>
          <option value="">全部状态</option>
          {Object.entries(ALERT_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {alerts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
            <p>暂无预警信息</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>学员</th>
                <th>预警类型</th>
                <th>预警原因</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id} className={rowClass(a.status)}>
                  <td>{a.student_name || a.student}</td>
                  <td><span className={`badge ${alertTypeBadge(a.alert_type)}`}>{ALERT_TYPE_MAP[a.alert_type]}</span></td>
                  <td style={{ maxWidth: 300 }}>{a.reason}</td>
                  <td><span className={`badge ${statusBadge(a.status)}`}>{ALERT_STATUS_MAP[a.status]}</span></td>
                  <td>{new Date(a.created_at).toLocaleString('zh-CN')}</td>
                  <td>
                    <div className="actions-cell">
                      {a.status === 'pending' && (
                        <button className="btn btn-warning btn-sm" onClick={() => handleAcknowledge(a.id)}>确认</button>
                      )}
                      {a.status !== 'resolved' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleResolve(a.id)}>解决</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => fetchData(page - 1, filterStatus)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1, filterStatus)}>下一页</button>
      </div>
    </div>
  );
}
