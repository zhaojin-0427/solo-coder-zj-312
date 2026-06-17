import React, { useState, useEffect } from 'react';
import {
  getInjuryInterventions, createInjuryIntervention, updateInjuryIntervention, deleteInjuryIntervention,
  pauseIntervention, resumeIntervention, closeIntervention, getInterventionReviews,
  getStudents, getWearAlerts, getTrainingPlans
} from '../api';
import {
  INTERVENTION_TRIGGER_MAP, INTERVENTION_PAIN_LOCATION_MAP, INTERVENTION_STATUS_MAP, LEVEL_MAP
} from '../constants';

const defaultForm = {
  student: '',
  trigger_source: '',
  pain_location: '',
  pain_level: 0,
  suspected_cause: '',
  intervention_measures: '',
  suspend_days: 0,
  rehab_training: '',
  responsible_teacher: '',
  next_review_date: '',
  related_wear_alert: '',
  related_training_plan: '',
  notes: ''
};

export default function InjuryInterventions() {
  const [interventions, setInterventions] = useState([]);
  const [students, setStudents] = useState([]);
  const [wearAlerts, setWearAlerts] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPainLocation, setFilterPainLocation] = useState('');
  const [filterTrigger, setFilterTrigger] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewIntervention, setReviewIntervention] = useState(null);

  const fetchStudents = async () => {
    const res = await getStudents({ page_size: 100 });
    const results = res.results || res;
    setStudents(Array.isArray(results) ? results : []);
  };

  const fetchWearAlerts = async () => {
    const res = await getWearAlerts({ page_size: 100 });
    const results = res.results || res;
    setWearAlerts(Array.isArray(results) ? results : []);
  };

  const fetchTrainingPlans = async () => {
    const res = await getTrainingPlans({ page_size: 100 });
    const results = res.results || res;
    setTrainingPlans(Array.isArray(results) ? results : []);
  };

  const fetchData = async (p = 1, status = '', painLocation = '', trigger = '', teacher = '') => {
    const params = { page: p };
    if (status) params.status = status;
    if (painLocation) params.pain_location = painLocation;
    if (trigger) params.trigger_source = trigger;
    if (teacher) params.teacher = teacher;
    const res = await getInjuryInterventions(params);
    const results = res.results || res;
    setInterventions(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  useEffect(() => {
    fetchStudents();
    fetchWearAlerts();
    fetchTrainingPlans();
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      student: Number(form.student),
      pain_level: Number(form.pain_level),
      suspend_days: Number(form.suspend_days),
      related_wear_alert: form.related_wear_alert ? Number(form.related_wear_alert) : null,
      related_training_plan: form.related_training_plan ? Number(form.related_training_plan) : null,
    };
    try {
      if (editItem) {
        await updateInjuryIntervention(editItem.id, data);
      } else {
        await createInjuryIntervention(data);
      }
      setShowModal(false);
      setEditItem(null);
      setForm(defaultForm);
      fetchData(page, filterStatus, filterPainLocation, filterTrigger, filterTeacher);
    } catch (err) {
      alert(err.response?.data?.detail || '保存失败');
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      student: String(item.student),
      trigger_source: item.trigger_source || '',
      pain_location: item.pain_location || '',
      pain_level: item.pain_level || 0,
      suspected_cause: item.suspected_cause || '',
      intervention_measures: item.intervention_measures || '',
      suspend_days: item.suspend_days || 0,
      rehab_training: item.rehab_training || '',
      responsible_teacher: item.responsible_teacher || '',
      next_review_date: item.next_review_date || '',
      related_wear_alert: item.related_wear_alert ? String(item.related_wear_alert) : '',
      related_training_plan: item.related_training_plan ? String(item.related_training_plan) : '',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定删除该干预记录？')) {
      await deleteInjuryIntervention(id);
      fetchData(page, filterStatus, filterPainLocation, filterTrigger, filterTeacher);
    }
  };

  const handlePause = async (id) => {
    if (!window.confirm('确定暂停该干预？')) return;
    await pauseIntervention(id);
    fetchData(page, filterStatus, filterPainLocation, filterTrigger, filterTeacher);
  };

  const handleResume = async (id) => {
    if (!window.confirm('确定恢复该干预？')) return;
    await resumeIntervention(id);
    fetchData(page, filterStatus, filterPainLocation, filterTrigger, filterTeacher);
  };

  const handleClose = async (id) => {
    if (!window.confirm('确定关闭该干预？')) return;
    await closeIntervention(id);
    fetchData(page, filterStatus, filterPainLocation, filterTrigger, filterTeacher);
  };

  const handleViewReviews = async (item) => {
    setReviewIntervention(item);
    try {
      const res = await getInterventionReviews(item.id);
      setReviews(Array.isArray(res) ? res : res.results || []);
    } catch {
      setReviews([]);
    }
    setShowReviewsModal(true);
  };

  const statusBadge = (s) => {
    const map = { active: 'badge-danger', paused: 'badge-warning', closed: 'badge-success' };
    return map[s] || 'badge-info';
  };

  const painLevelBadge = (level) => {
    if (level >= 7) return 'badge-danger';
    if (level >= 4) return 'badge-warning';
    return 'badge-info';
  };

  const rowClass = (s) => {
    const map = { active: 'alert-pending', paused: 'alert-acknowledged', closed: 'alert-resolved' };
    return map[s] || '';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN');
  };

  return (
    <div>
      <div className="page-header">
        <h2>伤痛干预</h2>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(defaultForm); setShowModal(true); }}>
          + 新增干预
        </button>
      </div>

      <div className="search-bar">
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); fetchData(1, e.target.value, filterPainLocation, filterTrigger, filterTeacher); }}>
          <option value="">全部状态</option>
          {Object.entries(INTERVENTION_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterPainLocation} onChange={e => { setFilterPainLocation(e.target.value); fetchData(1, filterStatus, e.target.value, filterTrigger, filterTeacher); }}>
          <option value="">全部疼痛部位</option>
          {Object.entries(INTERVENTION_PAIN_LOCATION_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterTrigger} onChange={e => { setFilterTrigger(e.target.value); fetchData(1, filterStatus, filterPainLocation, e.target.value, filterTeacher); }}>
          <option value="">全部触发来源</option>
          {Object.entries(INTERVENTION_TRIGGER_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input
          placeholder="搜索负责教师"
          value={filterTeacher}
          onChange={e => { setFilterTeacher(e.target.value); fetchData(1, filterStatus, filterPainLocation, filterTrigger, e.target.value); }}
        />
      </div>

      {interventions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 40, marginBottom: 12 }}>✅</p>
            <p>暂无干预记录</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>学员</th>
                <th>触发来源</th>
                <th>疼痛部位</th>
                <th>疼痛等级</th>
                <th>疑似原因</th>
                <th>干预措施</th>
                <th>暂停天数</th>
                <th>康复训练</th>
                <th>负责教师</th>
                <th>复查日期</th>
                <th>状态</th>
                <th>复查次数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map(item => (
                <tr key={item.id} className={rowClass(item.status)}>
                  <td>{item.student_name || item.student}</td>
                  <td><span className="badge badge-info">{INTERVENTION_TRIGGER_MAP[item.trigger_source] || item.trigger_source}</span></td>
                  <td>{INTERVENTION_PAIN_LOCATION_MAP[item.pain_location] || item.pain_location}</td>
                  <td><span className={`badge ${painLevelBadge(item.pain_level)}`}>{item.pain_level}</span></td>
                  <td style={{ maxWidth: 160 }}>{item.suspected_cause || '-'}</td>
                  <td style={{ maxWidth: 160 }}>{item.intervention_measures || '-'}</td>
                  <td>{item.suspend_days}</td>
                  <td style={{ maxWidth: 120 }}>{item.rehab_training || '-'}</td>
                  <td>{item.responsible_teacher || '-'}</td>
                  <td>
                    {formatDate(item.next_review_date)}
                    {item.is_review_overdue && (
                      <span className="badge badge-danger" style={{ marginLeft: 4, fontSize: 10 }}>逾期</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${statusBadge(item.status)}`}>
                      {INTERVENTION_STATUS_MAP[item.status]}
                    </span>
                  </td>
                  <td>{item.review_count ?? 0}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-outline btn-sm" onClick={() => handleEdit(item)}>编辑</button>
                      {item.status === 'active' && (
                        <button className="btn btn-warning btn-sm" onClick={() => handlePause(item.id)}>暂停</button>
                      )}
                      {item.status === 'paused' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleResume(item.id)}>恢复</button>
                      )}
                      {item.status !== 'closed' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleClose(item.id)}>关闭</button>
                      )}
                      <button className="btn btn-info btn-sm" onClick={() => handleViewReviews(item)}>复查</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => fetchData(page - 1, filterStatus, filterPainLocation, filterTrigger, filterTeacher)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1, filterStatus, filterPainLocation, filterTrigger, filterTeacher)}>下一页</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h3>{editItem ? '编辑干预' : '新增干预'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>学员</label>
                  <select value={form.student} onChange={e => setForm({ ...form, student: e.target.value })} required>
                    <option value="">请选择学员</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({LEVEL_MAP[s.level]})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>触发来源</label>
                  <select value={form.trigger_source} onChange={e => setForm({ ...form, trigger_source: e.target.value })} required>
                    <option value="">请选择</option>
                    {Object.entries(INTERVENTION_TRIGGER_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>疼痛部位</label>
                  <select value={form.pain_location} onChange={e => setForm({ ...form, pain_location: e.target.value })} required>
                    <option value="">请选择</option>
                    {Object.entries(INTERVENTION_PAIN_LOCATION_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>疼痛等级 (0-10)</label>
                  <input type="number" min="0" max="10" value={form.pain_level} onChange={e => setForm({ ...form, pain_level: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>疑似原因</label>
                  <input value={form.suspected_cause} onChange={e => setForm({ ...form, suspected_cause: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>暂停天数</label>
                  <input type="number" min="0" value={form.suspend_days} onChange={e => setForm({ ...form, suspend_days: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>负责教师</label>
                  <input value={form.responsible_teacher} onChange={e => setForm({ ...form, responsible_teacher: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>复查日期</label>
                  <input type="date" value={form.next_review_date} onChange={e => setForm({ ...form, next_review_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>关联磨损预警</label>
                  <select value={form.related_wear_alert} onChange={e => setForm({ ...form, related_wear_alert: e.target.value })}>
                    <option value="">无</option>
                    {wearAlerts.map(a => <option key={a.id} value={a.id}>预警#{a.id} - {a.student_name || a.student}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>关联训练计划</label>
                  <select value={form.related_training_plan} onChange={e => setForm({ ...form, related_training_plan: e.target.value })}>
                    <option value="">无</option>
                    {trainingPlans.map(p => <option key={p.id} value={p.id}>{p.plan_name} - {p.student_name || p.student}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>干预措施</label>
                  <textarea rows={3} value={form.intervention_measures} onChange={e => setForm({ ...form, intervention_measures: e.target.value })} placeholder="请输入干预措施" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>康复训练</label>
                  <textarea rows={2} value={form.rehab_training} onChange={e => setForm({ ...form, rehab_training: e.target.value })} placeholder="请输入康复训练方案" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>备注</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="备注信息" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReviewsModal && (
        <div className="modal-overlay" onClick={() => setShowReviewsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <h3>复查记录 - {reviewIntervention?.student_name || reviewIntervention?.student}</h3>
            {reviews.length === 0 ? (
              <div className="empty-state">
                <p>暂无复查记录</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>复查日期</th>
                    <th>疼痛等级</th>
                    <th>疼痛变化</th>
                    <th>稳定性</th>
                    <th>复查结论</th>
                    <th>下次复查</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id}>
                      <td>{formatDate(r.review_date)}</td>
                      <td><span className={`badge ${painLevelBadge(r.pain_level)}`}>{r.pain_level}</span></td>
                      <td>{r.pain_change_display || r.pain_change || '-'}</td>
                      <td>{r.stability_display || r.stability || '-'}</td>
                      <td style={{ maxWidth: 160 }}>{r.conclusion || '-'}</td>
                      <td>{formatDate(r.next_review_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowReviewsModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
