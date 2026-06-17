import React, { useState, useEffect } from 'react';
import {
  getInterventionReminders, acknowledgeInterventionReminder, resolveInterventionReminder,
  dismissInterventionReminder, generateInterventionReminders, getStudents
} from '../api';
import { REMINDER_TYPE_MAP, REMINDER_STATUS_MAP, INTERVENTION_PAIN_LOCATION_MAP } from '../constants';

export default function InterventionReminders() {
  const [reminders, setReminders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [acknowledgedTotal, setAcknowledgedTotal] = useState(0);
  const [filters, setFilters] = useState({ reminder_type: '', status: '', student_id: '' });
  const [students, setStudents] = useState([]);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [acknowledgeForm, setAcknowledgeForm] = useState({ handled_by: '', handling_notes: '' });
  const [resolveForm, setResolveForm] = useState({ handled_by: '', handling_notes: '' });

  const fetchPendingTotal = async () => {
    try {
      const res = await getInterventionReminders({ status: 'pending', page_size: 1 });
      setPendingTotal(res.count || 0);
    } catch {
      setPendingTotal(0);
    }
  };

  const fetchAcknowledgedTotal = async () => {
    try {
      const res = await getInterventionReminders({ status: 'acknowledged', page_size: 1 });
      setAcknowledgedTotal(res.count || 0);
    } catch {
      setAcknowledgedTotal(0);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await getStudents({ page_size: 100 });
      const results = res.results || res;
      setStudents(Array.isArray(results) ? results : []);
    } catch {
      setStudents([]);
    }
  };

  const fetchData = async (p = 1, filterParams = {}) => {
    const params = { page: p, ...filterParams };
    const res = await getInterventionReminders(params);
    const results = res.results || res;
    setReminders(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  useEffect(() => {
    fetchData();
    fetchPendingTotal();
    fetchAcknowledgedTotal();
    fetchStudents();
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchData(1, newFilters);
  };

  const handleDismiss = async (id) => {
    if (!window.confirm('确定忽略该提醒？')) return;
    await dismissInterventionReminder(id);
    fetchData(page, filters);
    fetchPendingTotal();
    fetchAcknowledgedTotal();
  };

  const openAcknowledgeModal = (reminder) => {
    setCurrentReminder(reminder);
    setAcknowledgeForm({ handled_by: '', handling_notes: '' });
    setShowAcknowledgeModal(true);
  };

  const submitAcknowledge = async () => {
    if (!acknowledgeForm.handled_by) return;
    await acknowledgeInterventionReminder(currentReminder.id, acknowledgeForm);
    setShowAcknowledgeModal(false);
    setCurrentReminder(null);
    fetchData(page, filters);
    fetchPendingTotal();
    fetchAcknowledgedTotal();
  };

  const openResolveModal = (reminder) => {
    setCurrentReminder(reminder);
    setResolveForm({ handled_by: '', handling_notes: '' });
    setShowResolveModal(true);
  };

  const submitResolve = async () => {
    if (!resolveForm.handled_by) return;
    await resolveInterventionReminder(currentReminder.id, resolveForm);
    setShowResolveModal(false);
    setCurrentReminder(null);
    fetchData(page, filters);
    fetchAcknowledgedTotal();
  };

  const handleGenerateReminders = async () => {
    if (!window.confirm('确定手动生成干预提醒？')) return;
    await generateInterventionReminders();
    fetchData(1, filters);
    fetchPendingTotal();
    fetchAcknowledgedTotal();
  };

  const reminderTypeBadge = (t) => {
    const map = {
      continuous_pain: 'badge-danger',
      review_overdue: 'badge-warning',
      pain_recurrence: 'badge-danger',
      high_pain_level: 'badge-danger',
    };
    return map[t] || 'badge-info';
  };

  const statusBadge = (s) => {
    const map = {
      pending: 'badge-danger',
      acknowledged: 'badge-warning',
      resolved: 'badge-success',
      dismissed: 'badge-info',
    };
    return map[s] || 'badge-info';
  };

  const rowClass = (s) => {
    const map = {
      pending: 'alert-pending',
      acknowledged: 'alert-acknowledged',
      resolved: 'alert-resolved',
      dismissed: 'alert-dismissed',
    };
    return map[s] || '';
  };

  return (
    <div>
      <div className="page-header">
        <h2>干预提醒</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {pendingTotal > 0 && (
            <span className="badge badge-danger" style={{ fontSize: 14, padding: '6px 14px' }}>
              {pendingTotal} 条待处理
            </span>
          )}
          {acknowledgedTotal > 0 && (
            <span className="badge badge-warning" style={{ fontSize: 14, padding: '6px 14px' }}>
              {acknowledgedTotal} 条已确认
            </span>
          )}
          <button className="btn btn-primary" onClick={handleGenerateReminders}>
            手动生成提醒
          </button>
        </div>
      </div>

      <div className="search-bar">
        <select value={filters.reminder_type} onChange={e => handleFilterChange('reminder_type', e.target.value)}>
          <option value="">全部类型</option>
          {Object.entries(REMINDER_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
          <option value="">全部状态</option>
          {Object.entries(REMINDER_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.student_id} onChange={e => handleFilterChange('student_id', e.target.value)}>
          <option value="">全部学员</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {reminders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔔</p>
            <p>暂无干预提醒</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>学员</th>
                <th>提醒类型</th>
                <th>提醒内容</th>
                <th>关联干预单(疼痛部位)</th>
                <th>状态</th>
                <th>处理人</th>
                <th>处理备注</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map(r => (
                <tr key={r.id} className={rowClass(r.status)}>
                  <td>{r.student_name || r.student}</td>
                  <td>
                    <span className={`badge ${reminderTypeBadge(r.reminder_type)}`}>
                      {REMINDER_TYPE_MAP[r.reminder_type]}
                    </span>
                  </td>
                  <td style={{ maxWidth: 200 }}>{r.content || r.message || '-'}</td>
                  <td>
                    {r.intervention ? (
                      `${INTERVENTION_PAIN_LOCATION_MAP[r.intervention.pain_location] || r.intervention.pain_location || '-'}`
                    ) : '-'}
                  </td>
                  <td>
                    <span className={`badge ${statusBadge(r.status)}`}>
                      {REMINDER_STATUS_MAP[r.status]}
                    </span>
                  </td>
                  <td>{r.handled_by || '-'}</td>
                  <td style={{ maxWidth: 160 }}>{r.handling_notes || '-'}</td>
                  <td>{new Date(r.created_at).toLocaleString('zh-CN')}</td>
                  <td>
                    <div className="actions-cell">
                      {r.status === 'pending' && (
                        <button className="btn btn-warning btn-sm" onClick={() => openAcknowledgeModal(r)}>确认</button>
                      )}
                      {(r.status === 'pending' || r.status === 'acknowledged') && (
                        <button className="btn btn-success btn-sm" onClick={() => openResolveModal(r)}>解决</button>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={() => handleDismiss(r.id)}>忽略</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => fetchData(page - 1, filters)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1, filters)}>下一页</button>
      </div>

      {showAcknowledgeModal && currentReminder && (
        <div className="modal-overlay" onClick={() => setShowAcknowledgeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>确认提醒</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>处理人 *</label>
                <input value={acknowledgeForm.handled_by} onChange={e => setAcknowledgeForm({ ...acknowledgeForm, handled_by: e.target.value })} placeholder="请输入处理人姓名" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>处理备注</label>
                <textarea rows={3} value={acknowledgeForm.handling_notes} onChange={e => setAcknowledgeForm({ ...acknowledgeForm, handling_notes: e.target.value })} placeholder="请输入处理备注" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowAcknowledgeModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitAcknowledge} disabled={!acknowledgeForm.handled_by}>确认</button>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && currentReminder && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>解决提醒</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>处理人 *</label>
                <input value={resolveForm.handled_by} onChange={e => setResolveForm({ ...resolveForm, handled_by: e.target.value })} placeholder="请输入处理人姓名" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>处理备注</label>
                <textarea rows={3} value={resolveForm.handling_notes} onChange={e => setResolveForm({ ...resolveForm, handling_notes: e.target.value })} placeholder="请输入处理备注" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowResolveModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitResolve} disabled={!resolveForm.handled_by}>解决</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
