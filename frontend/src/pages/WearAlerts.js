import React, { useState, useEffect } from 'react';
import { getWearAlerts, resolveAlert, acknowledgeAlert, handleAlert, followupAlert } from '../api';
import { ALERT_TYPE_MAP, ALERT_STATUS_MAP } from '../constants';

export default function WearAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [pendingTotal, setPendingTotal] = useState(0);
  const [followupTotal, setFollowupTotal] = useState(0);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [handleForm, setHandleForm] = useState({ handler: '', handling_plan: '', handling_notes: '', suggested_followup_date: '' });
  const [followupForm, setFollowupForm] = useState({ actual_followup_date: '', handling_notes: '' });

  const fetchPendingTotal = async () => {
    try {
      const res = await getWearAlerts({ status: 'pending', page_size: 1 });
      setPendingTotal(res.count || 0);
    } catch {
      setPendingTotal(0);
    }
  };

  const fetchFollowupTotal = async () => {
    try {
      const res = await getWearAlerts({ status: 'followup', page_size: 1 });
      setFollowupTotal(res.count || 0);
    } catch {
      setFollowupTotal(0);
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
    fetchFollowupTotal();
  }, []);

  const handleResolve = async (id) => {
    await resolveAlert(id);
    fetchData(page, filterStatus);
    fetchPendingTotal();
    fetchFollowupTotal();
  };

  const handleAcknowledge = async (id) => {
    await acknowledgeAlert(id);
    fetchData(page, filterStatus);
    fetchPendingTotal();
  };

  const openHandleModal = (alert) => {
    setCurrentAlert(alert);
    setHandleForm({
      handler: alert.handler || '',
      handling_plan: alert.handling_plan || '',
      handling_notes: alert.handling_notes || '',
      suggested_followup_date: alert.suggested_followup_date || '',
    });
    setShowHandleModal(true);
  };

  const submitHandle = async () => {
    if (!handleForm.handler.trim()) return;
    await handleAlert(currentAlert.id, handleForm);
    setShowHandleModal(false);
    setCurrentAlert(null);
    fetchData(page, filterStatus);
    fetchPendingTotal();
    fetchFollowupTotal();
  };

  const openFollowupModal = (alert) => {
    setCurrentAlert(alert);
    setFollowupForm({
      actual_followup_date: new Date().toISOString().slice(0, 10),
      handling_notes: alert.handling_notes || '',
    });
    setShowFollowupModal(true);
  };

  const submitFollowup = async () => {
    if (!followupForm.actual_followup_date) return;
    await followupAlert(currentAlert.id, followupForm);
    setShowFollowupModal(false);
    setCurrentAlert(null);
    fetchData(page, filterStatus);
    fetchFollowupTotal();
  };

  const statusBadge = (s) => {
    const map = { pending: 'badge-danger', acknowledged: 'badge-warning', handled: 'badge-info', followup: 'badge-primary', resolved: 'badge-success' };
    return map[s] || 'badge-info';
  };

  const alertTypeBadge = (t) => {
    const map = { replace: 'badge-danger', insole: 'badge-warning', hardness: 'badge-info', check: 'badge-primary' };
    return map[t] || 'badge-info';
  };

  const rowClass = (s) => {
    const map = { pending: 'alert-pending', acknowledged: 'alert-acknowledged', handled: 'alert-handled', followup: 'alert-followup', resolved: 'alert-resolved' };
    return map[s] || '';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN');
  };

  return (
    <div>
      <div className="page-header">
        <h2>磨损预警</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {pendingTotal > 0 && (
            <span className="badge badge-danger" style={{ fontSize: 14, padding: '6px 14px' }}>
              {pendingTotal} 条待处理
            </span>
          )}
          {followupTotal > 0 && (
            <span className="badge badge-primary" style={{ fontSize: 14, padding: '6px 14px' }}>
              {followupTotal} 条待回访
            </span>
          )}
        </div>
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
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>学员</th>
                <th>预警类型</th>
                <th>预警原因</th>
                <th>状态</th>
                <th>处置人</th>
                <th>处置方案</th>
                <th>建议回访</th>
                <th>实际回访</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id} className={rowClass(a.status)}>
                  <td>{a.student_name || a.student}</td>
                  <td><span className={`badge ${alertTypeBadge(a.alert_type)}`}>{ALERT_TYPE_MAP[a.alert_type]}</span></td>
                  <td style={{ maxWidth: 200 }}>{a.reason}</td>
                  <td>
                    <span className={`badge ${statusBadge(a.status)}`}>
                      {ALERT_STATUS_MAP[a.status]}
                    </span>
                    {a.is_followup_overdue && (
                      <span className="badge badge-danger" style={{ marginLeft: 4, fontSize: 10 }}>逾期</span>
                    )}
                  </td>
                  <td>{a.handler || '-'}</td>
                  <td style={{ maxWidth: 160 }}>{a.handling_plan || '-'}</td>
                  <td>{formatDate(a.suggested_followup_date)}</td>
                  <td>{formatDate(a.actual_followup_date)}</td>
                  <td>{new Date(a.created_at).toLocaleString('zh-CN')}</td>
                  <td>
                    <div className="actions-cell">
                      {a.status === 'pending' && (
                        <button className="btn btn-warning btn-sm" onClick={() => handleAcknowledge(a.id)}>确认</button>
                      )}
                      {(a.status === 'pending' || a.status === 'acknowledged') && (
                        <button className="btn btn-info btn-sm" onClick={() => openHandleModal(a)}>处置</button>
                      )}
                      {a.status === 'followup' && (
                        <button className="btn btn-primary btn-sm" onClick={() => openFollowupModal(a)}>回访</button>
                      )}
                      {a.status === 'handled' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleResolve(a.id)}>关闭</button>
                      )}
                      {(a.status === 'followup' || a.status === 'handled') && (
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

      {showHandleModal && (
        <div className="modal-overlay" onClick={() => setShowHandleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3>预警处置</h3>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>处置人 *</label>
                <input value={handleForm.handler} onChange={e => setHandleForm({ ...handleForm, handler: e.target.value })} placeholder="请输入处置人姓名" />
              </div>
              <div className="form-group">
                <label>建议回访日期</label>
                <input type="date" value={handleForm.suggested_followup_date} onChange={e => setHandleForm({ ...handleForm, suggested_followup_date: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>处置方案</label>
                <textarea rows={3} value={handleForm.handling_plan} onChange={e => setHandleForm({ ...handleForm, handling_plan: e.target.value })} placeholder="请输入处置方案" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>备注</label>
                <textarea rows={2} value={handleForm.handling_notes} onChange={e => setHandleForm({ ...handleForm, handling_notes: e.target.value })} placeholder="备注信息" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowHandleModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitHandle} disabled={!handleForm.handler.trim()}>提交处置</button>
            </div>
          </div>
        </div>
      )}

      {showFollowupModal && (
        <div className="modal-overlay" onClick={() => setShowFollowupModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>回访记录</h3>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>实际回访日期 *</label>
                <input type="date" value={followupForm.actual_followup_date} onChange={e => setFollowupForm({ ...followupForm, actual_followup_date: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>回访备注</label>
                <textarea rows={3} value={followupForm.handling_notes} onChange={e => setFollowupForm({ ...followupForm, handling_notes: e.target.value })} placeholder="回访情况记录" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowFollowupModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitFollowup} disabled={!followupForm.actual_followup_date}>确认回访</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
