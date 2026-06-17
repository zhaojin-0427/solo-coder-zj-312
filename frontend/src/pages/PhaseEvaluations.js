import React, { useState, useEffect } from 'react';
import {
  getPhaseEvaluations, createPhaseEvaluation, updatePhaseEvaluation,
  deletePhaseEvaluation, getTrainingPlans, getStudents
} from '../api';
import {
  ACHIEVEMENT_MAP, PROGRESS_SUGGESTION_MAP, PLAN_STATUS_MAP, LEVEL_MAP
} from '../constants';

const defaultForm = {
  training_plan: '',
  evaluation_date: '',
  phase_name: '',
  target_achievement: 'good',
  stability_evaluation: 'good',
  strength_evaluation: 'good',
  pain_status: 'good',
  overall_result: 'good',
  progress_suggestion: 'continue',
  improvement_points: '',
  next_phase_goals: '',
  evaluator: '',
  notes: ''
};

export default function PhaseEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);

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
    const res = await getPhaseEvaluations(params);
    const results = res.results || res;
    setEvaluations(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  useEffect(() => {
    fetchPlans();
    fetchStudents();
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      training_plan: Number(form.training_plan),
    };
    if (editItem) {
      await updatePhaseEvaluation(editItem.id, data);
    } else {
      await createPhaseEvaluation(data);
    }
    setShowModal(false);
    setEditItem(null);
    setForm(defaultForm);
    fetchData(page, filterPlan, filterStudent);
  };

  const handleEdit = (e) => {
    setEditItem(e);
    setForm({
      training_plan: String(e.training_plan),
      evaluation_date: e.evaluation_date,
      phase_name: e.phase_name,
      target_achievement: e.target_achievement,
      stability_evaluation: e.stability_evaluation,
      strength_evaluation: e.strength_evaluation,
      pain_status: e.pain_status,
      overall_result: e.overall_result,
      progress_suggestion: e.progress_suggestion,
      improvement_points: e.improvement_points || '',
      next_phase_goals: e.next_phase_goals || '',
      evaluator: e.evaluator || '',
      notes: e.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定删除该阶段评估？')) {
      await deletePhaseEvaluation(id);
      fetchData(page, filterPlan, filterStudent);
    }
  };

  const getPlanName = (planId) => {
    const plan = plans.find(p => p.id === Number(planId));
    return plan ? plan.plan_name : `计划#${planId}`;
  };

  const getStudentName = (evaluation) => {
    if (evaluation.student_name) return evaluation.student_name;
    if (evaluation.training_plan?.student?.name) return evaluation.training_plan.student.name;
    const plan = plans.find(p => p.id === Number(evaluation.training_plan));
    return plan ? plan.student_name : '-';
  };

  const resultBadge = (r) => {
    const map = { excellent: 'badge-success', good: 'badge-info', fair: 'badge-warning', poor: 'badge-danger' };
    return map[r] || 'badge-info';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN');
  };

  const activePlans = plans.filter(p => p.status === 'active' || p.status === 'completed');

  return (
    <div>
      <div className="page-header">
        <h2>阶段评估</h2>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(defaultForm); setShowModal(true); }}>
          + 新增阶段评估
        </button>
      </div>

      <div className="search-bar">
        <select value={filterStudent} onChange={e => { setFilterStudent(e.target.value); fetchData(1, filterPlan, e.target.value); }}>
          <option value="">全部学员</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); fetchData(1, e.target.value, filterStudent); }}>
          <option value="">全部训练计划</option>
          {plans.map(p => <option key={p.id} value={p.id}>{p.plan_name || `计划#${p.id}`}</option>)}
        </select>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>评估阶段</th>
              <th>训练计划</th>
              <th>学员</th>
              <th>评估日期</th>
              <th>目标达成</th>
              <th>稳定度</th>
              <th>总体结果</th>
              <th>发展建议</th>
              <th>评估人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map(e => (
              <tr key={e.id}>
                <td><strong>{e.phase_name}</strong></td>
                <td>{e.plan_name || getPlanName(e.training_plan)}</td>
                <td>{getStudentName(e)}</td>
                <td>{formatDate(e.evaluation_date)}</td>
                <td><span className={`badge ${resultBadge(e.target_achievement)}`}>{ACHIEVEMENT_MAP[e.target_achievement]}</span></td>
                <td><span className={`badge ${resultBadge(e.stability_evaluation)}`}>{ACHIEVEMENT_MAP[e.stability_evaluation]}</span></td>
                <td><span className={`badge ${resultBadge(e.overall_result)}`}>{ACHIEVEMENT_MAP[e.overall_result]}</span></td>
                <td>{PROGRESS_SUGGESTION_MAP[e.progress_suggestion] || '-'}</td>
                <td>{e.evaluator || '-'}</td>
                <td>
                  <div className="actions-cell">
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(e)}>编辑</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h3>{editItem ? '编辑阶段评估' : '新增阶段评估'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>训练计划</label>
                  <select value={form.training_plan} onChange={e => setForm({ ...form, training_plan: e.target.value })} required>
                    <option value="">请选择训练计划</option>
                    {activePlans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.plan_name} - {p.student_name || p.student?.name || ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>评估日期</label>
                  <input type="date" value={form.evaluation_date} onChange={e => setForm({ ...form, evaluation_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>评估阶段</label>
                  <input value={form.phase_name} onChange={e => setForm({ ...form, phase_name: e.target.value })} placeholder="如：第一阶段评估" required />
                </div>
                <div className="form-group">
                  <label>评估人</label>
                  <input value={form.evaluator} onChange={e => setForm({ ...form, evaluator: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>目标达成情况</label>
                  <select value={form.target_achievement} onChange={e => setForm({ ...form, target_achievement: e.target.value })}>
                    {Object.entries(ACHIEVEMENT_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>稳定度评估</label>
                  <select value={form.stability_evaluation} onChange={e => setForm({ ...form, stability_evaluation: e.target.value })}>
                    {Object.entries(ACHIEVEMENT_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>力量评估</label>
                  <select value={form.strength_evaluation} onChange={e => setForm({ ...form, strength_evaluation: e.target.value })}>
                    {Object.entries(ACHIEVEMENT_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>疼痛状况</label>
                  <select value={form.pain_status} onChange={e => setForm({ ...form, pain_status: e.target.value })}>
                    {Object.entries(ACHIEVEMENT_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>总体评估结果</label>
                  <select value={form.overall_result} onChange={e => setForm({ ...form, overall_result: e.target.value })}>
                    {Object.entries(ACHIEVEMENT_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>发展建议</label>
                  <select value={form.progress_suggestion} onChange={e => setForm({ ...form, progress_suggestion: e.target.value })}>
                    {Object.entries(PROGRESS_SUGGESTION_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>改进要点</label>
                  <textarea value={form.improvement_points} onChange={e => setForm({ ...form, improvement_points: e.target.value })} rows={2} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>下一阶段目标</label>
                  <textarea value={form.next_phase_goals} onChange={e => setForm({ ...form, next_phase_goals: e.target.value })} rows={2} />
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
    </div>
  );
}
