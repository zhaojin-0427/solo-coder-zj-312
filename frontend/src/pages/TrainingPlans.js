import React, { useState, useEffect } from 'react';
import {
  getTrainingPlans, createTrainingPlan, updateTrainingPlan, deleteTrainingPlan,
  getStudents, getShoeFittings, pausePlan, resumePlan, completePlan, assessPlanRisk, getInjuryInterventions
} from '../api';
import {
  PLAN_STATUS_MAP, PLAN_RISK_LEVEL_MAP, PLAN_ADJUSTMENT_MAP,
  TARGET_LEVEL_MAP, LEVEL_MAP, INTERVENTION_STATUS_MAP, INTERVENTION_PAIN_LOCATION_MAP, INTERVENTION_TRIGGER_MAP
} from '../constants';

const defaultForm = {
  student: '',
  foot_profile: '',
  shoe_fitting: '',
  plan_name: '',
  start_date: '',
  end_date: '',
  target_level: 'beginner',
  weekly_max_duration: 120,
  key_exercises: '',
  forbidden_exercises: '',
  strength_training: '',
  evaluation_criteria: '',
  responsible_teacher: '',
  notes: ''
};

export default function TrainingPlans() {
  const [plans, setPlans] = useState([]);
  const [students, setStudents] = useState([]);
  const [fittings, setFittings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [planInterventions, setPlanInterventions] = useState([]);
  const [interventionPlanName, setInterventionPlanName] = useState('');

  const fetchStudents = async () => {
    const res = await getStudents({ page_size: 100 });
    const results = res.results || res;
    setStudents(Array.isArray(results) ? results : []);
  };

  const fetchFittings = async (studentId) => {
    if (!studentId) {
      setFittings([]);
      return;
    }
    const res = await getShoeFittings({ student: studentId, page_size: 100 });
    const results = res.results || res;
    setFittings(Array.isArray(results) ? results : []);
  };

  const fetchData = async (p = 1, studentId = '', status = '', risk = '', teacher = '') => {
    const params = { page: p };
    if (studentId) params.student = studentId;
    if (status) params.status = status;
    if (risk) params.risk_level = risk;
    if (teacher) params.teacher = teacher;
    const res = await getTrainingPlans(params);
    const results = res.results || res;
    setPlans(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  useEffect(() => {
    fetchStudents();
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      student: Number(form.student),
      foot_profile: form.foot_profile ? Number(form.foot_profile) : null,
      shoe_fitting: form.shoe_fitting ? Number(form.shoe_fitting) : null,
      weekly_max_duration: Number(form.weekly_max_duration),
    };
    try {
      if (editItem) {
        await updateTrainingPlan(editItem.id, data);
      } else {
        await createTrainingPlan(data);
      }
      setShowModal(false);
      setEditItem(null);
      setForm(defaultForm);
      fetchData(page, filterStudent, filterStatus, filterRisk, filterTeacher);
    } catch (err) {
      alert(err.response?.data?.detail || '保存失败');
    }
  };

  const handleEdit = (p) => {
    setEditItem(p);
    setForm({
      student: String(p.student),
      foot_profile: p.foot_profile ? String(p.foot_profile) : '',
      shoe_fitting: p.shoe_fitting ? String(p.shoe_fitting) : '',
      plan_name: p.plan_name,
      start_date: p.start_date,
      end_date: p.end_date,
      target_level: p.target_level,
      weekly_max_duration: p.weekly_max_duration,
      key_exercises: p.key_exercises || '',
      forbidden_exercises: p.forbidden_exercises || '',
      strength_training: p.strength_training || '',
      evaluation_criteria: p.evaluation_criteria || '',
      responsible_teacher: p.responsible_teacher || '',
      notes: p.notes || ''
    });
    fetchFittings(p.student);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定删除该训练计划？')) {
      await deleteTrainingPlan(id);
      fetchData(page, filterStudent, filterStatus, filterRisk, filterTeacher);
    }
  };

  const handlePause = async (id) => {
    if (!window.confirm('确定暂停该计划？')) return;
    await pausePlan(id);
    fetchData(page, filterStudent, filterStatus, filterRisk, filterTeacher);
  };

  const handleResume = async (id) => {
    if (!window.confirm('确定恢复该计划？')) return;
    await resumePlan(id);
    fetchData(page, filterStudent, filterStatus, filterRisk, filterTeacher);
  };

  const handleComplete = async (id) => {
    if (!window.confirm('确定完成该计划？')) return;
    await completePlan(id);
    fetchData(page, filterStudent, filterStatus, filterRisk, filterTeacher);
  };

  const handleAssessRisk = async (id) => {
    await assessPlanRisk(id);
    fetchData(page, filterStudent, filterStatus, filterRisk, filterTeacher);
  };

  const handleViewPlanInterventions = async (plan) => {
    setInterventionPlanName(plan.plan_name);
    try {
      const res = await getInjuryInterventions({ student: plan.student?.id || plan.student, page_size: 100 });
      const results = res.results || res;
      setPlanInterventions(Array.isArray(results) ? results : []);
    } catch {
      setPlanInterventions([]);
    }
    setShowInterventionModal(true);
  };

  const handleStudentChange = (studentId) => {
    setForm({ ...form, student: studentId, shoe_fitting: '', foot_profile: '' });
    fetchFittings(studentId);
  };

  const statusBadge = (s) => {
    const map = { active: 'badge-success', completed: 'badge-info', paused: 'badge-warning', cancelled: 'badge-secondary' };
    return map[s] || 'badge-info';
  };

  const riskBadge = (r) => {
    const map = { normal: 'badge-success', low: 'badge-warning', medium: 'badge-info', high: 'badge-danger' };
    return map[r] || 'badge-secondary';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN');
  };

  return (
    <div>
      <div className="page-header">
        <h2>训练计划</h2>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(defaultForm); setShowModal(true); }}>
          + 新增训练计划
        </button>
      </div>

      <div className="search-bar">
        <select value={filterStudent} onChange={e => { setFilterStudent(e.target.value); fetchData(1, e.target.value, filterStatus, filterRisk, filterTeacher); }}>
          <option value="">全部学员</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); fetchData(1, filterStudent, e.target.value, filterRisk, filterTeacher); }}>
          <option value="">全部状态</option>
          {Object.entries(PLAN_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterRisk} onChange={e => { setFilterRisk(e.target.value); fetchData(1, filterStudent, filterStatus, e.target.value, filterTeacher); }}>
          <option value="">全部风险等级</option>
          {Object.entries(PLAN_RISK_LEVEL_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input
          placeholder="搜索负责教师"
          value={filterTeacher}
          onChange={e => { setFilterTeacher(e.target.value); fetchData(1, filterStudent, filterStatus, filterRisk, e.target.value); }}
        />
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>计划名称</th>
              <th>学员</th>
              <th>级别目标</th>
              <th>计划周期</th>
              <th>周时长上限</th>
              <th>负责教师</th>
              <th>状态</th>
              <th>风险等级</th>
              <th>进度</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id}>
                <td><strong>{p.plan_name}</strong></td>
                <td>{p.student_name || p.student?.name || '-'}</td>
                <td>{TARGET_LEVEL_MAP[p.target_level] || '-'}</td>
                <td>
                  <div>{formatDate(p.start_date)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>至 {formatDate(p.end_date)}</div>
                </td>
                <td>{p.weekly_max_duration} 分钟</td>
                <td>{p.responsible_teacher || '-'}</td>
                <td><span className={`badge ${statusBadge(p.status)}`}>{PLAN_STATUS_MAP[p.status]}</span></td>
                <td><span className={`badge ${riskBadge(p.risk_level)}`}>{PLAN_RISK_LEVEL_MAP[p.risk_level]}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.progress_percent || 0}%`, background: 'var(--primary)' }} />
                    </div>
                    <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{p.progress_percent || 0}%</span>
                  </div>
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(p)}>编辑</button>
                    <button className="btn btn-info btn-sm" onClick={() => handleAssessRisk(p.id)}>评估</button>
                    <button className="btn btn-warning btn-sm" onClick={() => handleViewPlanInterventions(p)}>干预</button>
                    {p.status === 'active' && (
                      <button className="btn btn-warning btn-sm" onClick={() => handlePause(p.id)}>暂停</button>
                    )}
                    {p.status === 'paused' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleResume(p.id)}>恢复</button>
                    )}
                    {p.status === 'active' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleComplete(p.id)}>完成</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => fetchData(page - 1, filterStudent, filterStatus, filterRisk, filterTeacher)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1, filterStudent, filterStatus, filterRisk, filterTeacher)}>下一页</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h3>{editItem ? '编辑训练计划' : '新增训练计划'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>学员</label>
                  <select value={form.student} onChange={e => handleStudentChange(e.target.value)} required>
                    <option value="">请选择学员</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({LEVEL_MAP[s.level]})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>计划名称</label>
                  <input value={form.plan_name} onChange={e => setForm({ ...form, plan_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>开始日期</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>结束日期</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>训练级别目标</label>
                  <select value={form.target_level} onChange={e => setForm({ ...form, target_level: e.target.value })}>
                    {Object.entries(TARGET_LEVEL_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>每周上鞋时长上限(分钟)</label>
                  <input type="number" min="1" value={form.weekly_max_duration} onChange={e => setForm({ ...form, weekly_max_duration: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>关联试鞋记录</label>
                  <select value={form.shoe_fitting} onChange={e => setForm({ ...form, shoe_fitting: e.target.value })}>
                    <option value="">无</option>
                    {fittings.map(f => <option key={f.id} value={f.id}>{f.brand} {f.last_type} - {f.size}码</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>负责教师</label>
                  <input value={form.responsible_teacher} onChange={e => setForm({ ...form, responsible_teacher: e.target.value })} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>重点练习动作</label>
                  <textarea value={form.key_exercises} onChange={e => setForm({ ...form, key_exercises: e.target.value })} rows={2} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>禁忌动作</label>
                  <textarea value={form.forbidden_exercises} onChange={e => setForm({ ...form, forbidden_exercises: e.target.value })} rows={2} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>辅助力量训练</label>
                  <textarea value={form.strength_training} onChange={e => setForm({ ...form, strength_training: e.target.value })} rows={2} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>阶段评估标准</label>
                  <textarea value={form.evaluation_criteria} onChange={e => setForm({ ...form, evaluation_criteria: e.target.value })} rows={2} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>备注</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
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

      {showInterventionModal && (
        <div className="modal-overlay" onClick={() => setShowInterventionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <h3>{interventionPlanName} - 伤病干预记录</h3>
            {planInterventions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>暂无干预记录</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>疼痛部位</th>
                    <th>疼痛等级</th>
                    <th>触发来源</th>
                    <th>干预措施</th>
                    <th>状态</th>
                    <th>复查日期</th>
                    <th>是否逾期</th>
                  </tr>
                </thead>
                <tbody>
                  {planInterventions.map(iv => (
                    <tr key={iv.id}>
                      <td>{INTERVENTION_PAIN_LOCATION_MAP[iv.pain_location] || iv.pain_location || '-'}</td>
                      <td>{iv.pain_level ?? '-'}</td>
                      <td>{INTERVENTION_TRIGGER_MAP[iv.trigger_source] || iv.trigger_source || '-'}</td>
                      <td>{iv.intervention_measures || '-'}</td>
                      <td>
                        <span className={`badge ${iv.status === 'active' ? 'badge-danger' : iv.status === 'paused' ? 'badge-warning' : 'badge-success'}`}>
                          {INTERVENTION_STATUS_MAP[iv.status] || iv.status}
                        </span>
                      </td>
                      <td>{formatDate(iv.next_review_date)}</td>
                      <td>{iv.is_review_overdue ? <span className="badge badge-danger" style={{ fontSize: 11 }}>逾期</span> : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowInterventionModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
