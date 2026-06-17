import React, { useState, useEffect } from 'react';
import { getRehabilitationReviews, createRehabilitationReview, getInjuryInterventions } from '../api';
import { PAIN_CHANGE_MAP, STABILITY_RECOVERY_MAP, INTERVENTION_PAIN_LOCATION_MAP, INTERVENTION_STATUS_MAP } from '../constants';

export default function RehabilitationReviews() {
  const [reviews, setReviews] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterIntervention, setFilterIntervention] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [form, setForm] = useState({
    intervention: '',
    review_date: '',
    pain_level: 5,
    pain_change: 'stable',
    stability_recovery: 'fair',
    allow_resume_pointe: false,
    need_refit: false,
    need_insole_adjust: false,
    review_notes: '',
    reviewer: '',
  });

  const fetchData = async (p = 1, interventionId = '', studentId = '') => {
    const params = { page: p };
    if (interventionId) params.intervention = interventionId;
    if (studentId) params.student = studentId;
    const res = await getRehabilitationReviews(params);
    const results = res.results || res;
    setReviews(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  const fetchInterventions = async () => {
    try {
      const res = await getInjuryInterventions({ page_size: 100 });
      const results = res.results || res;
      const list = Array.isArray(results) ? results : [];
      setInterventions(list.filter(i => i.status === 'active' || i.status === 'paused'));
    } catch {
      setInterventions([]);
    }
  };

  useEffect(() => {
    fetchInterventions();
    fetchData();
  }, []);

  const handleFilter = () => {
    fetchData(1, filterIntervention, filterStudent);
  };

  const handleReset = () => {
    setFilterIntervention('');
    setFilterStudent('');
    fetchData(1, '', '');
  };

  const openCreateModal = () => {
    fetchInterventions();
    setForm({
      intervention: '',
      review_date: '',
      pain_level: 5,
      pain_change: 'stable',
      stability_recovery: 'fair',
      allow_resume_pointe: false,
      need_refit: false,
      need_insole_adjust: false,
      review_notes: '',
      reviewer: '',
    });
    setSelectedIntervention(null);
    setShowCreateModal(true);
  };

  const handleInterventionSelect = (id) => {
    setForm({ ...form, intervention: id });
    const found = interventions.find(i => i.id === Number(id));
    setSelectedIntervention(found || null);
  };

  const submitCreate = async () => {
    if (!form.intervention || !form.review_date || !form.reviewer) return;
    const data = {
      ...form,
      intervention: Number(form.intervention),
      pain_level: Number(form.pain_level),
    };
    if (!data.review_notes) delete data.review_notes;
    await createRehabilitationReview(data);
    setShowCreateModal(false);
    fetchData(page, filterIntervention, filterStudent);
  };

  const painChangeBadge = (v) => {
    const map = { improved: 'badge-success', stable: 'badge-warning', worsened: 'badge-danger' };
    return map[v] || 'badge-info';
  };

  const stabilityBadge = (v) => {
    const map = { excellent: 'badge-success', good: 'badge-info', fair: 'badge-warning', poor: 'badge-danger' };
    return map[v] || 'badge-info';
  };

  const boolBadge = (v) => {
    return v ? 'badge badge-success' : 'badge badge-secondary';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN');
  };

  return (
    <div>
      <div className="page-header">
        <h2>康复复查</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>+ 新增复查</button>
      </div>

      <div className="search-bar">
        <input
          placeholder="干预单ID"
          value={filterIntervention}
          onChange={e => setFilterIntervention(e.target.value)}
          style={{ width: 120 }}
        />
        <input
          placeholder="学员ID"
          value={filterStudent}
          onChange={e => setFilterStudent(e.target.value)}
          style={{ width: 120 }}
        />
        <button className="btn btn-primary" onClick={handleFilter}>筛选</button>
        <button className="btn btn-outline" onClick={handleReset}>重置</button>
      </div>

      {reviews.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
            <p>暂无康复复查记录</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>学员</th>
                <th>干预单(疼痛部位)</th>
                <th>复查日期</th>
                <th>当前疼痛等级</th>
                <th>疼痛变化</th>
                <th>稳定度恢复</th>
                <th>允许恢复上鞋</th>
                <th>需要重新试鞋</th>
                <th>需要调整鞋垫</th>
                <th>复查人</th>
                <th>复查备注</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td>{r.student_name || '-'}</td>
                  <td>
                    <span>#{r.intervention}</span>
                    {r.intervention_info?.pain_location && (
                      <span className="badge badge-info" style={{ marginLeft: 4 }}>
                        {INTERVENTION_PAIN_LOCATION_MAP[r.intervention_info.pain_location] || r.intervention_info.pain_location}
                      </span>
                    )}
                  </td>
                  <td>{formatDate(r.review_date)}</td>
                  <td>
                    <strong style={{ color: r.pain_level >= 7 ? '#dc3545' : r.pain_level >= 4 ? '#ffc107' : '#28a745' }}>
                      {r.pain_level}
                    </strong>
                  </td>
                  <td>
                    <span className={`badge ${painChangeBadge(r.pain_change)}`}>
                      {PAIN_CHANGE_MAP[r.pain_change] || r.pain_change}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${stabilityBadge(r.stability_recovery)}`}>
                      {STABILITY_RECOVERY_MAP[r.stability_recovery] || r.stability_recovery}
                    </span>
                  </td>
                  <td>
                    <span className={boolBadge(r.allow_resume_pointe)}>
                      {r.allow_resume_pointe ? '是' : '否'}
                    </span>
                  </td>
                  <td>
                    <span className={boolBadge(r.need_refit)}>
                      {r.need_refit ? '是' : '否'}
                    </span>
                  </td>
                  <td>
                    <span className={boolBadge(r.need_insole_adjust)}>
                      {r.need_insole_adjust ? '是' : '否'}
                    </span>
                  </td>
                  <td>{r.reviewer || '-'}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.review_notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => fetchData(page - 1, filterIntervention, filterStudent)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1, filterIntervention, filterStudent)}>下一页</button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h3>新增康复复查</h3>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>干预单 *</label>
                <select value={form.intervention} onChange={e => handleInterventionSelect(e.target.value)}>
                  <option value="">请选择干预单</option>
                  {interventions.map(i => (
                    <option key={i.id} value={i.id}>
                      #{i.id} {i.student_name || ''} - {INTERVENTION_PAIN_LOCATION_MAP[i.pain_location] || i.pain_location} ({INTERVENTION_STATUS_MAP[i.status] || i.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedIntervention && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ background: '#f0f4ff', padding: 12, borderRadius: 8, fontSize: 14 }}>
                    <div style={{ marginBottom: 4 }}><strong>学员：</strong>{selectedIntervention.student_name || '-'}</div>
                    <div style={{ marginBottom: 4 }}><strong>疼痛部位：</strong>{INTERVENTION_PAIN_LOCATION_MAP[selectedIntervention.pain_location] || selectedIntervention.pain_location}</div>
                    <div><strong>当前疼痛等级：</strong>{selectedIntervention.pain_level ?? '-'}</div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>复查日期 *</label>
                <input type="date" value={form.review_date} onChange={e => setForm({ ...form, review_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>当前疼痛等级 (0-10)</label>
                <input type="number" min="0" max="10" value={form.pain_level} onChange={e => setForm({ ...form, pain_level: e.target.value })} />
              </div>
              <div className="form-group">
                <label>疼痛变化</label>
                <select value={form.pain_change} onChange={e => setForm({ ...form, pain_change: e.target.value })}>
                  {Object.entries(PAIN_CHANGE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>稳定度恢复</label>
                <select value={form.stability_recovery} onChange={e => setForm({ ...form, stability_recovery: e.target.value })}>
                  {Object.entries(STABILITY_RECOVERY_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.allow_resume_pointe} onChange={e => setForm({ ...form, allow_resume_pointe: e.target.checked })} />
                  允许恢复上鞋
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', cursor: 'pointer', marginTop: 8 }}>
                  <input type="checkbox" checked={form.need_refit} onChange={e => setForm({ ...form, need_refit: e.target.checked })} />
                  需要重新试鞋
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', cursor: 'pointer', marginTop: 8 }}>
                  <input type="checkbox" checked={form.need_insole_adjust} onChange={e => setForm({ ...form, need_insole_adjust: e.target.checked })} />
                  需要调整鞋垫
                </label>
              </div>
              <div className="form-group">
                <label>复查人 *</label>
                <input value={form.reviewer} onChange={e => setForm({ ...form, reviewer: e.target.value })} placeholder="请输入复查人姓名" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>复查备注</label>
                <textarea rows={3} value={form.review_notes} onChange={e => setForm({ ...form, review_notes: e.target.value })} placeholder="复查情况详细备注" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitCreate} disabled={!form.intervention || !form.review_date || !form.reviewer}>创建复查</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
