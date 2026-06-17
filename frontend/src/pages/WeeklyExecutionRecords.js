import React, { useState, useEffect } from 'react';
import { getWeeklyRecords, createWeeklyRecord, updateWeeklyRecord, submitWeeklyRecord, getTrainingPlans, getStudents } from '../api';
import { EXERCISE_COMPLETION_MAP, PAIN_LOCATION_MAP, LEVEL_MAP } from '../constants';

const defaultForm = {
  training_plan: '', week_number: 1, week_start_date: '', week_end_date: '',
  actual_duration: 0, exercise_completion: 'good', stability_score: '',
  pain_location: 'none', pain_level: 0, teacher_comments: '',
  needs_adjustment: false, adjustment_reason: ''
};

const defaultSubmitForm = {
  actual_duration: 0, exercise_completion: 'good', stability_score: '',
  pain_location: 'none', pain_level: 0, teacher_comments: '',
  needs_adjustment: false, adjustment_reason: '', submitted_by: ''
};

export default function WeeklyExecutionRecords() {
  const [records, setRecords] = useState([]);
  const [plans, setPlans] = useState([]);
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [submitItem, setSubmitItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [submitForm, setSubmitForm] = useState(defaultSubmitForm);

  const fetchPlans = async () => {
    const res = await getTrainingPlans({ page_size: 100 });
    const results = res.results || res;
    setPlans(Array.isArray(results) ? results : []);
  };

  const fetchStudents = async () => {
    const res = await getStudents({ page_size: 100 });
    const results = res.results || res;
    setStudents(Array.isArray(results) ? results : []);
  };

  const fetchData = async (p = 1, planId = '', studentId = '') => {
    const params = { page: p };
    if (planId) params.training_plan = planId;
    if (studentId) params.student = studentId;
    const res = await getWeeklyRecords(params);
    const results = res.results || res;
    setRecords(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  useEffect(() => { fetchPlans(); fetchStudents(); fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      training_plan: Number(form.training_plan),
      week_number: Number(form.week_number),
      actual_duration: Number(form.actual_duration),
      stability_score: Number(form.stability_score),
      pain_level: Number(form.pain_level),
    };
    if (editItem) {
      await updateWeeklyRecord(editItem.id, data);
    } else {
      await createWeeklyRecord(data);
    }
    setShowModal(false);
    setEditItem(null);
    setForm(defaultForm);
    fetchData(page, filterPlan, filterStudent);
  };

  const handleEdit = (r) => {
    setEditItem(r);
    setForm({
      training_plan: String(r.training_plan), week_number: r.week_number,
      week_start_date: r.week_start_date || '', week_end_date: r.week_end_date || '',
      actual_duration: r.actual_duration, exercise_completion: r.exercise_completion,
      stability_score: String(r.stability_score), pain_location: r.pain_location,
      pain_level: r.pain_level, teacher_comments: r.teacher_comments || '',
      needs_adjustment: r.needs_adjustment, adjustment_reason: r.adjustment_reason || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定删除该周执行记录？')) {
      await updateWeeklyRecord(id, { is_deleted: true });
      fetchData(page, filterPlan, filterStudent);
    }
  };

  const openSubmitModal = (r) => {
    setSubmitItem(r);
    setSubmitForm({
      actual_duration: r.actual_duration, exercise_completion: r.exercise_completion,
      stability_score: String(r.stability_score), pain_location: r.pain_location,
      pain_level: r.pain_level, teacher_comments: r.teacher_comments || '',
      needs_adjustment: r.needs_adjustment, adjustment_reason: r.adjustment_reason || '',
      submitted_by: ''
    });
    setShowSubmitModal(true);
  };

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...submitForm,
      actual_duration: Number(submitForm.actual_duration),
      stability_score: Number(submitForm.stability_score),
      pain_level: Number(submitForm.pain_level),
    };
    await submitWeeklyRecord(submitItem.id, data);
    setShowSubmitModal(false);
    setSubmitItem(null);
    setSubmitForm(defaultSubmitForm);
    fetchData(page, filterPlan, filterStudent);
  };

  const getPlanName = (planId) => {
    const plan = plans.find(p => p.id === Number(planId));
    return plan ? plan.name || `计划#${plan.id}` : planId;
  };

  const getPlanMaxDuration = (planId) => {
    const plan = plans.find(p => p.id === Number(planId));
    return plan ? plan.weekly_max_duration : null;
  };

  const completionBadge = (c) => {
    const map = { excellent: 'badge-success', good: 'badge-info', fair: 'badge-warning', poor: 'badge-danger' };
    return map[c] || 'badge-info';
  };

  const activePlans = plans.filter(p => p.status === 'active');

  return (
    <div>
      <div className="page-header">
        <h2>周执行记录</h2>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(defaultForm); setShowModal(true); }}>
          + 新增周执行记录
        </button>
      </div>

      <div className="search-bar">
        <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); fetchData(1, e.target.value, filterStudent); }}>
          <option value="">全部训练计划</option>
          {plans.map(p => <option key={p.id} value={p.id}>{p.name || `计划#${p.id}`}</option>)}
        </select>
        <select value={filterStudent} onChange={e => { setFilterStudent(e.target.value); fetchData(1, filterPlan, e.target.value); }}>
          <option value="">全部学员</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>训练计划</th>
              <th>周次</th>
              <th>周日期</th>
              <th>实际时长(分钟)</th>
              <th>动作完成度</th>
              <th>稳定度评分</th>
              <th>疼痛部位</th>
              <th>疼痛等级</th>
              <th>是否提交</th>
              <th>需调整</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => {
              const maxDur = getPlanMaxDuration(r.training_plan);
              const overDuration = maxDur && r.actual_duration > maxDur;
              return (
                <tr key={r.id}>
                  <td>{getPlanName(r.training_plan)}</td>
                  <td>第{r.week_number}周</td>
                  <td>{r.week_start_date || '-'} ~ {r.week_end_date || '-'}</td>
                  <td>
                    <span style={{ color: overDuration ? 'var(--danger)' : 'inherit', fontWeight: overDuration ? 600 : 'normal' }}>
                      {r.actual_duration}
                    </span>
                    {overDuration && <span style={{ color: 'var(--danger)', fontSize: 12, marginLeft: 4 }}>超时</span>}
                  </td>
                  <td><span className={`badge ${completionBadge(r.exercise_completion)}`}>{EXERCISE_COMPLETION_MAP[r.exercise_completion]}</span></td>
                  <td>{r.stability_score}</td>
                  <td>{PAIN_LOCATION_MAP[r.pain_location]}</td>
                  <td>
                    <span style={{ color: r.pain_level >= 7 ? 'var(--danger)' : r.pain_level >= 5 ? 'var(--warning)' : 'inherit', fontWeight: r.pain_level >= 5 ? 600 : 'normal' }}>
                      {r.pain_level}/10
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${r.is_submitted ? 'badge-success' : 'badge-warning'}`}>
                      {r.is_submitted ? '已提交' : '草稿'}
                    </span>
                  </td>
                  <td>
                    {r.needs_adjustment && <span className="badge badge-danger">需调整</span>}
                  </td>
                  <td>
                    <div className="actions-cell">
                      {!r.is_submitted && (
                        <>
                          <button className="btn btn-info btn-sm" onClick={() => openSubmitModal(r)}>提交</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleEdit(r)}>编辑</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>删除</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => fetchData(page - 1, filterPlan, filterStudent)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1, filterPlan, filterStudent)}>下一页</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editItem ? '编辑周执行记录' : '新增周执行记录'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>训练计划</label>
                  <select value={form.training_plan} onChange={e => setForm({ ...form, training_plan: e.target.value })} required>
                    <option value="">请选择训练计划</option>
                    {activePlans.map(p => <option key={p.id} value={p.id}>{p.name || `计划#${p.id}`}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>周次</label>
                  <input type="number" min="1" value={form.week_number} onChange={e => setForm({ ...form, week_number: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>周开始日期</label>
                  <input type="date" value={form.week_start_date} onChange={e => setForm({ ...form, week_start_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>周结束日期</label>
                  <input type="date" value={form.week_end_date} onChange={e => setForm({ ...form, week_end_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>实际时长 (分钟)</label>
                  <input type="number" min="0" value={form.actual_duration} onChange={e => setForm({ ...form, actual_duration: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>动作完成度</label>
                  <select value={form.exercise_completion} onChange={e => setForm({ ...form, exercise_completion: e.target.value })}>
                    {Object.entries(EXERCISE_COMPLETION_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>稳定度评分 (0-100)</label>
                  <input type="number" min="0" max="100" value={form.stability_score} onChange={e => setForm({ ...form, stability_score: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>疼痛部位</label>
                  <select value={form.pain_location} onChange={e => setForm({ ...form, pain_location: e.target.value })}>
                    {Object.entries(PAIN_LOCATION_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>疼痛等级 (0-10)</label>
                  <input type="number" min="0" max="10" value={form.pain_level} onChange={e => setForm({ ...form, pain_level: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>教师评语</label>
                  <textarea value={form.teacher_comments} onChange={e => setForm({ ...form, teacher_comments: e.target.value })} rows={2} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.needs_adjustment} onChange={e => setForm({ ...form, needs_adjustment: e.target.checked })} />
                    需要调整
                  </label>
                </div>
                {form.needs_adjustment && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>调整原因</label>
                    <textarea value={form.adjustment_reason} onChange={e => setForm({ ...form, adjustment_reason: e.target.value })} rows={2} />
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubmitModal && submitItem && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>提交周执行记录</h3>
            <form onSubmit={handleSubSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>实际时长 (分钟)</label>
                  <input type="number" min="0" value={submitForm.actual_duration} onChange={e => setSubmitForm({ ...submitForm, actual_duration: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>动作完成度</label>
                  <select value={submitForm.exercise_completion} onChange={e => setSubmitForm({ ...submitForm, exercise_completion: e.target.value })}>
                    {Object.entries(EXERCISE_COMPLETION_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>稳定度评分 (0-100)</label>
                  <input type="number" min="0" max="100" value={submitForm.stability_score} onChange={e => setSubmitForm({ ...submitForm, stability_score: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>疼痛部位</label>
                  <select value={submitForm.pain_location} onChange={e => setSubmitForm({ ...submitForm, pain_location: e.target.value })}>
                    {Object.entries(PAIN_LOCATION_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>疼痛等级 (0-10)</label>
                  <input type="number" min="0" max="10" value={submitForm.pain_level} onChange={e => setSubmitForm({ ...submitForm, pain_level: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>教师评语</label>
                  <textarea value={submitForm.teacher_comments} onChange={e => setSubmitForm({ ...submitForm, teacher_comments: e.target.value })} rows={2} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', cursor: 'pointer' }}>
                    <input type="checkbox" checked={submitForm.needs_adjustment} onChange={e => setSubmitForm({ ...submitForm, needs_adjustment: e.target.checked })} />
                    需要调整
                  </label>
                </div>
                {submitForm.needs_adjustment && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>调整原因</label>
                    <textarea value={submitForm.adjustment_reason} onChange={e => setSubmitForm({ ...submitForm, adjustment_reason: e.target.value })} rows={2} />
                  </div>
                )}
                <div className="form-group">
                  <label>提交人</label>
                  <input value={submitForm.submitted_by} onChange={e => setSubmitForm({ ...submitForm, submitted_by: e.target.value })} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowSubmitModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
