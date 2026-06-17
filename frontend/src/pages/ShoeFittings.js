import React, { useState, useEffect } from 'react';
import { getShoeFittings, createShoeFitting, updateShoeFitting, deleteShoeFitting, getStudents } from '../api';
import { HARDNESS_MAP, BOX_HEIGHT_MAP, RIBBON_MAP, FIT_RESULT_MAP, LEVEL_MAP } from '../constants';

const defaultForm = {
  student: '', brand: '', last_type: '', hardness: 'medium',
  box_height: 'medium', ribbon_style: 'cross', size: '', fit_result: 'good', fitting_date: '', notes: ''
};

export default function ShoeFittings() {
  const [fittings, setFittings] = useState([]);
  const [students, setStudents] = useState([]);
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

  const fetchData = async (p = 1, studentId = '') => {
    const params = { page: p };
    if (studentId) params.student = studentId;
    const res = await getShoeFittings(params);
    const results = res.results || res;
    setFittings(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  useEffect(() => { fetchStudents(); fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, student: Number(form.student) };
    if (editItem) {
      await updateShoeFitting(editItem.id, data);
    } else {
      await createShoeFitting(data);
    }
    setShowModal(false);
    setEditItem(null);
    setForm(defaultForm);
    fetchData(page, filterStudent);
  };

  const handleEdit = (f) => {
    setEditItem(f);
    setForm({
      student: String(f.student), brand: f.brand, last_type: f.last_type,
      hardness: f.hardness, box_height: f.box_height, ribbon_style: f.ribbon_style,
      size: f.size, fit_result: f.fit_result, fitting_date: f.fitting_date, notes: f.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定删除该试鞋记录？')) {
      await deleteShoeFitting(id);
      fetchData(page, filterStudent);
    }
  };

  const fitBadge = (result) => {
    const map = { excellent: 'badge-success', good: 'badge-info', fair: 'badge-warning', poor: 'badge-danger' };
    return map[result] || 'badge-info';
  };

  return (
    <div>
      <div className="page-header">
        <h2>试鞋记录</h2>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(defaultForm); setShowModal(true); }}>
          + 新增试鞋记录
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
              <th>品牌</th>
              <th>楦型</th>
              <th>硬度</th>
              <th>鞋盒高度</th>
              <th>缎带方式</th>
              <th>鞋码</th>
              <th>适配结果</th>
              <th>试鞋日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {fittings.map(f => (
              <tr key={f.id}>
                <td>{f.student_name || f.student}</td>
                <td><strong>{f.brand}</strong></td>
                <td>{f.last_type}</td>
                <td>{HARDNESS_MAP[f.hardness]}</td>
                <td>{BOX_HEIGHT_MAP[f.box_height]}</td>
                <td>{RIBBON_MAP[f.ribbon_style]}</td>
                <td>{f.size}</td>
                <td><span className={`badge ${fitBadge(f.fit_result)}`}>{FIT_RESULT_MAP[f.fit_result]}</span></td>
                <td>{f.fitting_date}</td>
                <td>
                  <div className="actions-cell">
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(f)}>编辑</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id)}>删除</button>
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
            <h3>{editItem ? '编辑试鞋记录' : '新增试鞋记录'}</h3>
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
                  <label>品牌</label>
                  <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} required placeholder="如 Grishko, Freed" />
                </div>
                <div className="form-group">
                  <label>楦型</label>
                  <input value={form.last_type} onChange={e => setForm({ ...form, last_type: e.target.value })} required placeholder="如 U-cut, V-cut" />
                </div>
                <div className="form-group">
                  <label>硬度</label>
                  <select value={form.hardness} onChange={e => setForm({ ...form, hardness: e.target.value })}>
                    {Object.entries(HARDNESS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>鞋盒高度</label>
                  <select value={form.box_height} onChange={e => setForm({ ...form, box_height: e.target.value })}>
                    {Object.entries(BOX_HEIGHT_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>缎带固定方式</label>
                  <select value={form.ribbon_style} onChange={e => setForm({ ...form, ribbon_style: e.target.value })}>
                    {Object.entries(RIBBON_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>鞋码</label>
                  <input value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>适配结果</label>
                  <select value={form.fit_result} onChange={e => setForm({ ...form, fit_result: e.target.value })}>
                    {Object.entries(FIT_RESULT_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>试鞋日期</label>
                  <input type="date" value={form.fitting_date} onChange={e => setForm({ ...form, fitting_date: e.target.value })} required />
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
