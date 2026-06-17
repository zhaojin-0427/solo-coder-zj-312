import React, { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent, getFootProfile, saveFootProfile, getStudentBorrowings, getTrainingPlans, getPhaseEvaluations, getInjuryInterventions } from '../api';
import { LEVEL_MAP, ARCH_MAP, INSTEP_MAP, BORROWING_PURPOSE_MAP, BORROWING_STATUS_MAP, PLAN_STATUS_MAP, PLAN_RISK_LEVEL_MAP, ACHIEVEMENT_MAP, PROGRESS_SUGGESTION_MAP, INTERVENTION_STATUS_MAP, INTERVENTION_PAIN_LOCATION_MAP } from '../constants';

export default function StudentProfiles() {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBorrowingModal, setShowBorrowingModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileStudentId, setProfileStudentId] = useState(null);
  const [borrowingHistory, setBorrowingHistory] = useState([]);
  const [borrowingStudent, setBorrowingStudent] = useState(null);
  const [planStudent, setPlanStudent] = useState(null);
  const [studentPlans, setStudentPlans] = useState([]);
  const [studentEvaluations, setStudentEvaluations] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [studentInterventions, setStudentInterventions] = useState([]);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [interventionStudent, setInterventionStudent] = useState(null);
  const [form, setForm] = useState({ name: '', level: 'beginner', age: '', phone: '' });
  const [profileForm, setProfileForm] = useState({
    foot_length: '', foot_width: '', arch_height: 'medium',
    instep_strength: 'medium', past_injuries: '', notes: ''
  });

  const fetchData = async (p = 1) => {
    const res = await getStudents({ page: p });
    const results = res.results || res;
    setStudents(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editItem) {
      await updateStudent(editItem.id, form);
    } else {
      await createStudent(form);
    }
    setShowModal(false);
    setEditItem(null);
    setForm({ name: '', level: 'beginner', age: '', phone: '' });
    fetchData(page);
  };

  const handleEdit = (s) => {
    setEditItem(s);
    setForm({ name: s.name, level: s.level, age: s.age, phone: s.phone || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定删除该学员？')) {
      await deleteStudent(id);
      fetchData(page);
    }
  };

  const handleViewProfile = async (studentId) => {
    setProfileStudentId(studentId);
    let formData = {
      foot_length: '', foot_width: '', arch_height: 'medium',
      instep_strength: 'medium', past_injuries: '', notes: ''
    };
    let profileData = null;
    try {
      const data = await getFootProfile(studentId);
      if (data) {
        profileData = data;
        formData = {
          foot_length: data.foot_length !== null && data.foot_length !== undefined ? String(data.foot_length) : '',
          foot_width: data.foot_width !== null && data.foot_width !== undefined ? String(data.foot_width) : '',
          arch_height: data.arch_height || 'medium',
          instep_strength: data.instep_strength || 'medium',
          past_injuries: data.past_injuries || '',
          notes: data.notes || '',
        };
      }
    } catch {
      profileData = null;
    }
    setProfileData(profileData);
    setProfileForm(formData);
    setTimeout(() => setShowProfileModal(true), 0);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    await saveFootProfile(profileStudentId, profileForm);
    setShowProfileModal(false);
    fetchData(page);
  };

  const handleViewBorrowingHistory = async (student) => {
    setBorrowingStudent(student);
    try {
      const res = await getStudentBorrowings(student.id);
      const results = res.results || res;
      setBorrowingHistory(Array.isArray(results) ? results : []);
    } catch {
      setBorrowingHistory([]);
    }
    setShowBorrowingModal(true);
  };

  const handleViewInterventions = async (student) => {
    setInterventionStudent(student);
    try {
      const res = await getInjuryInterventions({ student: student.id, page_size: 100 });
      const results = res.results || res;
      setStudentInterventions(Array.isArray(results) ? results : []);
    } catch {
      setStudentInterventions([]);
    }
    setShowInterventionModal(true);
  };

  const handleViewPlans = async (student) => {
    setPlanStudent(student);
    setActiveTab('current');
    try {
      const [plansRes, evalsRes] = await Promise.all([
        getTrainingPlans({ student: student.id, page_size: 100 }),
        getPhaseEvaluations({ student: student.id, page_size: 100 })
      ]);
      const plans = plansRes.results || plansRes || [];
      const evals = evalsRes.results || evalsRes || [];
      setStudentPlans(Array.isArray(plans) ? plans : []);
      setStudentEvaluations(Array.isArray(evals) ? evals : []);
    } catch {
      setStudentPlans([]);
      setStudentEvaluations([]);
    }
    setShowPlanModal(true);
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN');
  };

  const currentPlan = studentPlans.find(p => p.status === 'active');
  const historyPlans = studentPlans.filter(p => p.status !== 'active');
  const latestEvaluation = studentEvaluations.length > 0 ? studentEvaluations[0] : null;

  return (
    <div>
      <div className="page-header">
        <h2>学员足型档案</h2>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', level: 'beginner', age: '', phone: '' }); setShowModal(true); }}>
          + 新增学员
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>级别</th>
              <th>年龄</th>
              <th>联系电话</th>
              <th>足型档案</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td><span className="badge badge-primary">{LEVEL_MAP[s.level]}</span></td>
                <td>{s.age}</td>
                <td>{s.phone || '-'}</td>
                <td>
                  {s.foot_profile ? (
                    <span className="badge badge-success">已建档</span>
                  ) : (
                    <span className="badge badge-warning">未建档</span>
                  )}
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="btn btn-outline btn-sm" onClick={() => handleViewProfile(s.id)}>足型</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleViewPlans(s)}>计划</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleViewBorrowingHistory(s)}>借用</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleViewInterventions(s)}>干预</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(s)}>编辑</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => fetchData(page - 1)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1)}>下一页</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editItem ? '编辑学员' : '新增学员'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>姓名</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>级别</label>
                  <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                    {Object.entries(LEVEL_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>年龄</label>
                  <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>联系电话</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
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

      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>足型档案</h3>
            {profileData && (
              <div className="card" style={{ marginBottom: 16, background: '#f8f7ff' }}>
                <div className="profile-card">
                  <div className="profile-item">
                    <span className="label">脚长</span>
                    <span className="value">{profileData.foot_length} mm</span>
                  </div>
                  <div className="profile-item">
                    <span className="label">脚宽</span>
                    <span className="value">{profileData.foot_width} mm</span>
                  </div>
                  <div className="profile-item">
                    <span className="label">足弓高度</span>
                    <span className="value">{ARCH_MAP[profileData.arch_height]}</span>
                  </div>
                  <div className="profile-item">
                    <span className="label">脚背力量</span>
                    <span className="value">{INSTEP_MAP[profileData.instep_strength]}</span>
                  </div>
                  <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="label">既往伤痛</span>
                    <span className="value">{profileData.past_injuries || '无'}</span>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleProfileSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>脚长 (mm)</label>
                  <input type="number" step="0.1" value={profileForm.foot_length} onChange={e => setProfileForm({ ...profileForm, foot_length: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>脚宽 (mm)</label>
                  <input type="number" step="0.1" value={profileForm.foot_width} onChange={e => setProfileForm({ ...profileForm, foot_width: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>足弓高度</label>
                  <select value={profileForm.arch_height} onChange={e => setProfileForm({ ...profileForm, arch_height: e.target.value })}>
                    {Object.entries(ARCH_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>脚背力量</label>
                  <select value={profileForm.instep_strength} onChange={e => setProfileForm({ ...profileForm, instep_strength: e.target.value })}>
                    {Object.entries(INSTEP_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>既往伤痛</label>
                  <textarea value={profileForm.past_injuries} onChange={e => setProfileForm({ ...profileForm, past_injuries: e.target.value })} rows={2} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>备注</label>
                  <textarea value={profileForm.notes} onChange={e => setProfileForm({ ...profileForm, notes: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowProfileModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存足型档案</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBorrowingModal && (
        <div className="modal-overlay" onClick={() => setShowBorrowingModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <h3>{borrowingStudent?.name} - 借用历史</h3>
            {borrowingHistory.length > 0 ? (
              <div className="card" style={{ maxHeight: 400, overflowY: 'auto', padding: 0 }}>
                <table>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8f7ff' }}>
                    <tr>
                      <th>鞋款信息</th>
                      <th>用途</th>
                      <th>状态</th>
                      <th>预约时间</th>
                      <th>实际归还</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowingHistory.map(b => (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.shoe?.brand} {b.shoe?.size}码</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>楦型: {b.shoe?.last_type || '-'} / 硬度: {b.shoe?.hardness || '-'}</div>
                        </td>
                        <td>{BORROWING_PURPOSE_MAP[b.purpose] || b.purpose}</td>
                        <td>
                          <span className={`badge ${
                            b.status === 'returned' ? 'badge-success' :
                            b.status === 'borrowed' ? 'badge-info' :
                            b.status === 'overdue' ? 'badge-danger' :
                            b.status === 'reserved' ? 'badge-warning' :
                            'badge-secondary'
                          }`}>
                            {BORROWING_STATUS_MAP[b.status]}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 12 }}>{b.expected_start_time?.slice(0, 16)}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>至 {b.expected_end_time?.slice(0, 16)}</div>
                        </td>
                        <td style={{ fontSize: 12 }}>{b.actual_return_time?.slice(0, 16) || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><p>暂无借用记录</p></div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setShowBorrowingModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <h3>{planStudent?.name} - 训练计划</h3>

            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
                onClick={() => setActiveTab('current')}
              >
                当前计划
              </button>
              <button
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                历史计划
              </button>
              <button
                className={`tab-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
                onClick={() => setActiveTab('evaluation')}
              >
                阶段评估
              </button>
            </div>

            {activeTab === 'current' && (
              <div>
                {currentPlan ? (
                  <div className="card" style={{ background: '#f0fff4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0 }}>{currentPlan.plan_name}</h4>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span className={`badge ${currentPlan.status === 'active' ? 'badge-success' : 'badge-info'}`}>
                          {PLAN_STATUS_MAP[currentPlan.status]}
                        </span>
                        <span className={`badge ${
                          currentPlan.risk_level === 'high' ? 'badge-danger' :
                          currentPlan.risk_level === 'medium' ? 'badge-info' :
                          currentPlan.risk_level === 'low' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {PLAN_RISK_LEVEL_MAP[currentPlan.risk_level]}
                        </span>
                      </div>
                    </div>
                    <div className="profile-card">
                      <div className="profile-item">
                        <span className="label">计划周期</span>
                        <span className="value">{formatDate(currentPlan.start_date)} ~ {formatDate(currentPlan.end_date)}</span>
                      </div>
                      <div className="profile-item">
                        <span className="label">目标级别</span>
                        <span className="value">{LEVEL_MAP[currentPlan.target_level] || currentPlan.target_level}</span>
                      </div>
                      <div className="profile-item">
                        <span className="label">周时长上限</span>
                        <span className="value">{currentPlan.weekly_max_duration} 分钟</span>
                      </div>
                      <div className="profile-item">
                        <span className="label">负责教师</span>
                        <span className="value">{currentPlan.responsible_teacher || '-'}</span>
                      </div>
                      <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="label">进度</span>
                        <span className="value">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, maxWidth: 200, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                              <div style={{ height: '100%', width: `${currentPlan.progress_percent || 0}%`, background: 'var(--primary)' }} />
                            </div>
                            <span>{currentPlan.progress_percent || 0}%</span>
                          </div>
                        </span>
                      </div>
                      <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="label">重点练习动作</span>
                        <span className="value">{currentPlan.key_exercises || '-'}</span>
                      </div>
                      {currentPlan.forbidden_exercises && (
                        <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="label">禁忌动作</span>
                          <span className="value" style={{ color: 'var(--danger)' }}>{currentPlan.forbidden_exercises}</span>
                        </div>
                      )}
                      {currentPlan.strength_training && (
                        <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="label">辅助力量训练</span>
                          <span className="value">{currentPlan.strength_training}</span>
                        </div>
                      )}
                      <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="label">阶段评估标准</span>
                        <span className="value">{currentPlan.evaluation_criteria || '-'}</span>
                      </div>
                      {currentPlan.risk_reasons && (
                        <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="label">风险原因</span>
                          <span className="value" style={{ color: 'var(--danger)' }}>{currentPlan.risk_reasons}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state"><p>暂无进行中的训练计划</p></div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {historyPlans.length > 0 ? (
                  <div className="card" style={{ maxHeight: 400, overflowY: 'auto', padding: 0 }}>
                    <table>
                      <thead style={{ position: 'sticky', top: 0, background: '#f8f7ff' }}>
                        <tr>
                          <th>计划名称</th>
                          <th>目标级别</th>
                          <th>周期</th>
                          <th>状态</th>
                          <th>风险等级</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyPlans.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.plan_name}</strong></td>
                            <td>{LEVEL_MAP[p.target_level] || p.target_level}</td>
                            <td>
                              <div style={{ fontSize: 12 }}>{formatDate(p.start_date)}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>至 {formatDate(p.end_date)}</div>
                            </td>
                            <td>
                              <span className={`badge ${
                                p.status === 'completed' ? 'badge-info' :
                                p.status === 'paused' ? 'badge-warning' : 'badge-secondary'
                              }`}>
                                {PLAN_STATUS_MAP[p.status]}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                p.risk_level === 'high' ? 'badge-danger' :
                                p.risk_level === 'medium' ? 'badge-info' :
                                p.risk_level === 'low' ? 'badge-warning' : 'badge-success'
                              }`}>
                                {PLAN_RISK_LEVEL_MAP[p.risk_level]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state"><p>暂无历史计划</p></div>
                )}
              </div>
            )}

            {activeTab === 'evaluation' && (
              <div>
                {studentEvaluations.length > 0 ? (
                  <div className="card" style={{ maxHeight: 400, overflowY: 'auto', padding: 0 }}>
                    <table>
                      <thead style={{ position: 'sticky', top: 0, background: '#f8f7ff' }}>
                        <tr>
                          <th>评估阶段</th>
                          <th>评估日期</th>
                          <th>目标达成</th>
                          <th>稳定度</th>
                          <th>总体结果</th>
                          <th>发展建议</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentEvaluations.map(e => (
                          <tr key={e.id}>
                            <td><strong>{e.phase_name}</strong></td>
                            <td>{formatDate(e.evaluation_date)}</td>
                            <td>
                              <span className={`badge ${
                                e.target_achievement === 'excellent' ? 'badge-success' :
                                e.target_achievement === 'good' ? 'badge-info' :
                                e.target_achievement === 'fair' ? 'badge-warning' : 'badge-danger'
                              }`}>
                                {ACHIEVEMENT_MAP[e.target_achievement]}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                e.stability_evaluation === 'excellent' ? 'badge-success' :
                                e.stability_evaluation === 'good' ? 'badge-info' :
                                e.stability_evaluation === 'fair' ? 'badge-warning' : 'badge-danger'
                              }`}>
                                {ACHIEVEMENT_MAP[e.stability_evaluation]}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                e.overall_result === 'excellent' ? 'badge-success' :
                                e.overall_result === 'good' ? 'badge-info' :
                                e.overall_result === 'fair' ? 'badge-warning' : 'badge-danger'
                              }`}>
                                {ACHIEVEMENT_MAP[e.overall_result]}
                              </span>
                            </td>
                            <td>{PROGRESS_SUGGESTION_MAP[e.progress_suggestion] || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state"><p>暂无阶段评估记录</p></div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setShowPlanModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showInterventionModal && (
        <div className="modal-overlay" onClick={() => setShowInterventionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <h3>{interventionStudent?.name} - 伤痛干预记录</h3>
            {studentInterventions.length > 0 ? (
              <div className="card" style={{ maxHeight: 400, overflowY: 'auto', padding: 0 }}>
                <table>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8f7ff' }}>
                    <tr>
                      <th>疼痛部位</th>
                      <th>疼痛等级</th>
                      <th>触发来源</th>
                      <th>干预措施</th>
                      <th>负责教师</th>
                      <th>状态</th>
                      <th>复查日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentInterventions.map(iv => (
                      <tr key={iv.id}>
                        <td>{INTERVENTION_PAIN_LOCATION_MAP[iv.pain_location] || iv.pain_location}</td>
                        <td>{iv.pain_level || '-'}</td>
                        <td>{iv.trigger_source || '-'}</td>
                        <td>{iv.intervention_measures || '-'}</td>
                        <td>{iv.responsible_teacher || '-'}</td>
                        <td>
                          <span className={`badge ${
                            iv.status === 'active' ? 'badge-danger' :
                            iv.status === 'paused' ? 'badge-warning' :
                            iv.status === 'closed' ? 'badge-success' : 'badge-secondary'
                          }`}>
                            {INTERVENTION_STATUS_MAP[iv.status]}
                          </span>
                          {iv.is_review_overdue && (
                            <span className="badge badge-danger" style={{ marginLeft: 4, fontSize: 10 }}>逾期</span>
                          )}
                        </td>
                        <td>{formatDate(iv.next_review_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><p>暂无干预记录</p></div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setShowInterventionModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
