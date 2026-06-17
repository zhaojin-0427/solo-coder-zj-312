import React, { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent, getFootProfile, saveFootProfile } from '../api';
import { LEVEL_MAP, ARCH_MAP, INSTEP_MAP } from '../constants';

export default function StudentProfiles() {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileStudentId, setProfileStudentId] = useState(null);
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
    </div>
  );
}
