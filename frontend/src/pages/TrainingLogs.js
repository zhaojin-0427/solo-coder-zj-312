import React, { useState, useEffect } from 'react';
import { getTrainingLogs, createTrainingLog, updateTrainingLog, deleteTrainingLog, getStudents, getShoeFittings } from '../api';
import { STABILITY_MAP, SOFTENING_MAP, PAIN_LOCATION_MAP } from '../constants';

const defaultForm = {
  student: '', shoe_fitting: '', date: '', duration_minutes: '',
  stability: 'good', pain_location: 'none', pain_level: 0, sole_softening: 'none', notes: ''
};

export default function TrainingLogs() {
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [fittings, setFittings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStudent, setFilterStudent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const fetchStudents = async () => {
    const res = await getStudents({ page_size: 100 });
    const results = res.results || res;
    setStudents(Array.isArray(results) ? results : []);
  };

  const fetchFittings = async () => {
    const res = await getShoeFittings({ page_size: 100 });
    const results = res.results || res;
    setFittings(Array.isArray(results) ? results : []);
  };

  const fetchData = async (p = 1, studentId = '') => {
    const params = { page: p };
    if (studentId) params.student = studentId;
    const res = await getTrainingLogs(params);
    const results = res.results || res;
    setLogs(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  useEffect(() => { fetchStudents(); fetchFittings(); fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      student: Number(form.student),
      shoe_fitting: form.shoe_fitting ? Number(form.shoe_fitting) : null,
      duration_minutes: Number(form.duration_minutes),
      pain_level: Number(form.pain_level),
    };
    if (editItem) {
      await updateTrainingLog(editItem.id, data);
    } else {
      await createTrainingLog(data);
    }
    setShowModal(false);
    setEditItem(null);
    setForm(defaultForm);
    fetchData(page, filterStudent);
  };

  const handleEdit = (l) => {
    setEditItem(l);
    setForm({
      student: String(l.student), shoe_fitting: l.shoe_fitting ? String(l.shoe_fitting) : '',
      date: l.date, duration_minutes: String(l.duration_minutes),
      stability: l.stability, pain_location: l.pain_location,
      pain_level: l.pain_level, sole_softening: l.sole_softening, notes: l.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定删除该训练记录？')) {
      await deleteTrainingLog(id);
      fetchData(page, filterStudent);
    }
  };

  const stabilityBadge = (s) => {
    const map = { excellent: 'badge-success', good: 'badge-info', fair: 'badge-warning', poor: 'badge-danger' };
    return map[s] || 'badge-info';
  };

  const softeningBadge = (s) => {
    const map = { none: 'badge-success', slight: 'badge-info', moderate: 'badge-warning', severe: 'badge-danger' };
    return map[s] || 'badge-info';
  };

  return (
    <div>
      <div className="page-header">
        <h2>训练日志</h2>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(defaultForm); setShowModal(true); }}>
          + 新增训练记录
        </button>
      </div>

      <div className="search-bar">
        <select value={filterStudent} onChange={e => { setFilterStudent(e.target.value); fetchData(1, e.target.value); }}>
          <option value="">全部学员</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>学员</th>
              <th>训练日期</th>
              <th>上鞋时长</th>
              <th>足尖稳定度</th>
              <th>疼痛部位</th>
              <th>疼痛等级</th>
              <th>鞋底软化</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td>{l.student_name || l.student}</td>
                <td>{l.date}</td>
                <td>{l.duration_minutes} 分钟</td>
                <td><span className={`badge ${stabilityBadge(l.stability)}`}>{STABILITY_MAP[l.stability]}</span></td>
                <td>{PAIN_LOCATION_MAP[l.pain_location]}</td>
                <td>
                  <span style={{ color: l.pain_level >= 7 ? 'var(--danger)' : l.pain_level >= 4 ? 'var(--warning)' : 'inherit', fontWeight: 600 }}>
                    {l.pain_level}/10
                  </span>
                </td>
                <td><span className={`badge ${softeningBadge(l.sole_softening)}`}>{SOFTENING_MAP[l.sole_softening]}</span></td>
                <td>
                  <div className="actions-cell">
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(l)}>编辑</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => fetchData(page - 1, filterStudent)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1, filterStudent)}>下一页</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editItem ? '编辑训练记录' : '新增训练记录'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>学员</label>
                  <select value={form.student} onChange={e => setForm({ ...form, student: e.target.value })} required>
                    <option value="">请选择学员</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>关联鞋子 (可选)</label>
                  <select value={form.shoe_fitting} onChange={e => setForm({ ...form, shoe_fitting: e.target.value })}>
                    <option value="">不关联</option>
                    {fittings.map(f => <option key={f.id} value={f.id}>{f.brand} {f.last_type} ({f.size})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>训练日期</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>上鞋时长 (分钟)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>足尖稳定度</label>
                  <select value={form.stability} onChange={e => setForm({ ...form, stability: e.target.value })}>
                    {Object.entries(STABILITY_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
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
                <div className="form-group">
                  <label>鞋底软化程度</label>
                  <select value={form.sole_softening} onChange={e => setForm({ ...form, sole_softening: e.target.value })}>
                    {Object.entries(SOFTENING_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
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
