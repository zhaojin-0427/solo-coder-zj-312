import React, { useState, useEffect } from 'react';
import {
  getInventoryAlerts, acknowledgeInventoryAlert, resolveInventoryAlert,
  dismissInventoryAlert, generateInventoryAlerts, getShoeInventory, getStudents
} from '../api';
import { INVENTORY_ALERT_TYPE_MAP, INVENTORY_ALERT_STATUS_MAP } from '../constants';

export default function InventoryAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [acknowledgedTotal, setAcknowledgedTotal] = useState(0);
  const [filters, setFilters] = useState({ alert_type: '', status: '', shoe_id: '', student_id: '' });
  const [shoes, setShoes] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [acknowledgeForm, setAcknowledgeForm] = useState({ handler: '', handling_notes: '' });
  const [resolveForm, setResolveForm] = useState({ handler: '', handling_notes: '' });

  const fetchPendingTotal = async () => {
    try {
      const res = await getInventoryAlerts({ status: 'pending', page_size: 1 });
      setPendingTotal(res.count || 0);
    } catch {
      setPendingTotal(0);
    }
  };

  const fetchAcknowledgedTotal = async () => {
    try {
      const res = await getInventoryAlerts({ status: 'acknowledged', page_size: 1 });
      setAcknowledgedTotal(res.count || 0);
    } catch {
      setAcknowledgedTotal(0);
    }
  };

  const fetchShoes = async () => {
    try {
      const res = await getShoeInventory({ page_size: 100 });
      const results = res.results || res;
      setShoes(Array.isArray(results) ? results : []);
    } catch {
      setShoes([]);
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
    const res = await getInventoryAlerts(params);
    const results = res.results || res;
    setAlerts(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  useEffect(() => {
    fetchData();
    fetchPendingTotal();
    fetchAcknowledgedTotal();
    fetchShoes();
    fetchStudents();
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchData(1, newFilters);
  };

  const handleDismiss = async (id) => {
    if (!window.confirm('确定忽略该提醒？')) return;
    await dismissInventoryAlert(id);
    fetchData(page, filters);
    fetchPendingTotal();
    fetchAcknowledgedTotal();
  };

  const openAcknowledgeModal = (alert) => {
    setCurrentAlert(alert);
    setAcknowledgeForm({ handler: '', handling_notes: '' });
    setShowAcknowledgeModal(true);
  };

  const submitAcknowledge = async () => {
    if (!acknowledgeForm.handler) return;
    await acknowledgeInventoryAlert(currentAlert.id, acknowledgeForm);
    setShowAcknowledgeModal(false);
    setCurrentAlert(null);
    fetchData(page, filters);
    fetchPendingTotal();
    fetchAcknowledgedTotal();
  };

  const openResolveModal = (alert) => {
    setCurrentAlert(alert);
    setResolveForm({ handler: '', handling_notes: '' });
    setShowResolveModal(true);
  };

  const submitResolve = async () => {
    if (!resolveForm.handler) return;
    await resolveInventoryAlert(currentAlert.id, resolveForm);
    setShowResolveModal(false);
    setCurrentAlert(null);
    fetchData(page, filters);
    fetchAcknowledgedTotal();
  };

  const handleGenerateAlerts = async () => {
    if (!window.confirm('确定手动生成库存提醒？')) return;
    await generateInventoryAlerts();
    fetchData(1, filters);
    fetchPendingTotal();
    fetchAcknowledgedTotal();
  };

  const alertTypeBadge = (t) => {
    const map = {
      overdue: 'badge-danger',
      abnormal_return: 'badge-warning',
      low_stock: 'badge-danger',
      high_borrow_count: 'badge-warning',
      maintenance_due: 'badge-info',
      lost: 'badge-danger'
    };
    return map[t] || 'badge-info';
  };

  const statusBadge = (s) => {
    const map = {
      pending: 'badge-danger',
      acknowledged: 'badge-warning',
      resolved: 'badge-success',
      dismissed: 'badge-primary'
    };
    return map[s] || 'badge-info';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN');
  };

  return (
    <div>
      <div className="page-header">
        <h2>库存提醒</h2>
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
          <button className="btn btn-primary" onClick={handleGenerateAlerts}>
            手动生成提醒
          </button>
        </div>
      </div>

      <div className="search-bar">
        <select value={filters.alert_type} onChange={e => handleFilterChange('alert_type', e.target.value)}>
          <option value="">全部类型</option>
          {Object.entries(INVENTORY_ALERT_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
          <option value="">全部状态</option>
          {Object.entries(INVENTORY_ALERT_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.shoe_id} onChange={e => handleFilterChange('shoe_id', e.target.value)}>
          <option value="">全部鞋款</option>
          {shoes.map(s => <option key={s.id} value={s.id}>{s.brand} {s.last_type} {s.size}</option>)}
        </select>
        <select value={filters.student_id} onChange={e => handleFilterChange('student_id', e.target.value)}>
          <option value="">全部学员</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {alerts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 40, marginBottom: 12 }}>📦</p>
            <p>暂无库存提醒</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>提醒类型</th>
                <th>关联鞋款</th>
                <th>关联学员</th>
                <th>提醒内容</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id}>
                  <td>
                    <span className={`badge ${alertTypeBadge(a.alert_type)}`}>
                      {INVENTORY_ALERT_TYPE_MAP[a.alert_type]}
                    </span>
                  </td>
                  <td>{a.shoe ? `${a.shoe.brand} ${a.shoe.last_type} ${a.shoe.size}` : '-'}</td>
                  <td>{a.student_name || a.student?.name || '-'}</td>
                  <td style={{ maxWidth: 300 }}>{a.message || a.content || '-'}</td>
                  <td>
                    <span className={`badge ${statusBadge(a.status)}`}>
                      {INVENTORY_ALERT_STATUS_MAP[a.status]}
                    </span>
                  </td>
                  <td>{new Date(a.created_at).toLocaleString('zh-CN')}</td>
                  <td>
                    <div className="actions-cell">
                      {a.status === 'pending' && (
                        <button className="btn btn-warning btn-sm" onClick={() => openAcknowledgeModal(a)}>确认</button>
                      )}
                      {a.status === 'acknowledged' && (
                        <button className="btn btn-success btn-sm" onClick={() => openResolveModal(a)}>解决</button>
                      )}
                      {(a.status === 'pending' || a.status === 'acknowledged') && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleDismiss(a.id)}>忽略</button>
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
        <button disabled={page <= 1} onClick={() => fetchData(page - 1, filters)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1, filters)}>下一页</button>
      </div>

      {showAcknowledgeModal && currentAlert && (
        <div className="modal-overlay" onClick={() => setShowAcknowledgeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>确认提醒</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>处理人 *</label>
                <input value={acknowledgeForm.handler} onChange={e => setAcknowledgeForm({ ...acknowledgeForm, handler: e.target.value })} placeholder="请输入处理人姓名" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>处理备注</label>
                <textarea rows={3} value={acknowledgeForm.handling_notes} onChange={e => setAcknowledgeForm({ ...acknowledgeForm, handling_notes: e.target.value })} placeholder="请输入处理备注" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowAcknowledgeModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitAcknowledge} disabled={!acknowledgeForm.handler}>确认</button>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && currentAlert && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>解决提醒</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>处理人 *</label>
                <input value={resolveForm.handler} onChange={e => setResolveForm({ ...resolveForm, handler: e.target.value })} placeholder="请输入处理人姓名" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>处理备注</label>
                <textarea rows={3} value={resolveForm.handling_notes} onChange={e => setResolveForm({ ...resolveForm, handling_notes: e.target.value })} placeholder="请输入处理备注" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowResolveModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitResolve} disabled={!resolveForm.handler}>解决</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
