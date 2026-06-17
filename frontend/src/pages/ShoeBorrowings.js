import React, { useState, useEffect } from 'react';
import {
  getShoeBorrowings, createShoeBorrowing, updateShoeBorrowing, deleteShoeBorrowing,
  checkBorrowingConflict, borrowShoe, cancelBorrowing, getAvailableShoes, getStudents
} from '../api';
import { BORROWING_PURPOSE_MAP, BORROWING_STATUS_MAP, LEVEL_MAP } from '../constants';

const defaultForm = {
  student: '', shoe: '', purpose: 'training',
  expected_start_time: '', expected_end_time: '', reservation_notes: ''
};

export default function ShoeBorrowings() {
  const [borrowings, setBorrowings] = useState([]);
  const [students, setStudents] = useState([]);
  const [shoes, setShoes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterShoe, setFilterShoe] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [conflictInfo, setConflictInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const fetchStudents = async () => {
    const res = await getStudents({ page_size: 100 });
    const results = res.results || res;
    setStudents(Array.isArray(results) ? results : []);
  };

  const fetchAvailableShoes = async () => {
    const res = await getAvailableShoes({ page_size: 100 });
    const results = res.results || res;
    setShoes(Array.isArray(results) ? results : []);
  };

  const fetchData = async (p = 1) => {
    const params = { page: p };
    if (filterStudent) params.student = filterStudent;
    if (filterShoe) params.shoe = filterShoe;
    if (filterStatus) params.status = filterStatus;
    if (filterPurpose) params.purpose = filterPurpose;
    if (filterDateStart) params.date_from = filterDateStart;
    if (filterDateEnd) params.date_to = filterDateEnd;
    const res = await getShoeBorrowings(params);
    const results = res.results || res;
    setBorrowings(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  useEffect(() => {
    fetchStudents();
    fetchAvailableShoes();
    fetchData();
  }, []);

  const handleFilterChange = () => {
    fetchData(1);
  };

  const checkConflict = async () => {
    if (!form.shoe || !form.expected_start_time || !form.expected_end_time) return false;
    setIsChecking(true);
    try {
      const res = await checkBorrowingConflict({
        shoe: form.shoe,
        start_time: form.expected_start_time,
        end_time: form.expected_end_time,
        exclude_id: editItem?.id || null
      });
      if (res.has_conflict) {
        setConflictInfo(res);
        setShowConflictModal(true);
        setIsChecking(false);
        return true;
      }
    } catch (e) {
      console.error('Conflict check error:', e);
    }
    setIsChecking(false);
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasConflict = await checkConflict();
    if (hasConflict) return;

    const data = {
      ...form,
      student: Number(form.student),
      shoe: Number(form.shoe)
    };
    if (editItem) {
      await updateShoeBorrowing(editItem.id, data);
    } else {
      await createShoeBorrowing(data);
    }
    setShowModal(false);
    setEditItem(null);
    setForm(defaultForm);
    fetchData(page);
  };

  const handleEdit = (b) => {
    setEditItem(b);
    setForm({
      student: String(b.student),
      shoe: String(b.shoe),
      purpose: b.purpose,
      expected_start_time: b.expected_start_time ? b.expected_start_time.slice(0, 16) : '',
      expected_end_time: b.expected_end_time ? b.expected_end_time.slice(0, 16) : '',
      reservation_notes: b.reservation_notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定删除该借用记录？')) {
      await deleteShoeBorrowing(id);
      fetchData(page);
    }
  };

  const handleBorrow = async (id) => {
    if (window.confirm('确认执行借出操作？')) {
      const notes = prompt('请输入借出备注（可选）：') || '';
      await borrowShoe(id, notes);
      fetchData(page);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('确定取消该预约？')) {
      await cancelBorrowing(id);
      fetchData(page);
    }
  };

  const handleView = (b) => {
    setViewItem(b);
    setShowViewModal(true);
  };

  const statusBadge = (s) => {
    const map = {
      reserved: 'badge-info',
      borrowed: 'badge-danger',
      returned: 'badge-success',
      overdue: 'badge-danger',
      cancelled: 'badge-primary'
    };
    return map[s] || 'badge-info';
  };

  const formatDateTime = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('zh-CN');
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN');
  };

  return (
    <div>
      <div className="page-header">
        <h2>借用排班管理</h2>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(defaultForm); setShowModal(true); }}>
          + 创建借用单
        </button>
      </div>

      <div className="search-bar">
        <select value={filterStudent} onChange={e => { setFilterStudent(e.target.value); handleFilterChange(); }}>
          <option value="">全部学员</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterShoe} onChange={e => { setFilterShoe(e.target.value); handleFilterChange(); }}>
          <option value="">全部鞋款</option>
          {shoes.map(s => <option key={s.id} value={s.id}>{s.brand} {s.size} {s.shoe_type}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); handleFilterChange(); }}>
          <option value="">全部状态</option>
          {Object.entries(BORROWING_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterPurpose} onChange={e => { setFilterPurpose(e.target.value); handleFilterChange(); }}>
          <option value="">全部用途</option>
          {Object.entries(BORROWING_PURPOSE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input
          type="date"
          value={filterDateStart}
          onChange={e => { setFilterDateStart(e.target.value); handleFilterChange(); }}
          placeholder="开始日期"
        />
        <input
          type="date"
          value={filterDateEnd}
          onChange={e => { setFilterDateEnd(e.target.value); handleFilterChange(); }}
          placeholder="结束日期"
        />
      </div>

      {borrowings.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
            <p>暂无借用记录</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>学员</th>
                <th>鞋款</th>
                <th>用途</th>
                <th>状态</th>
                <th>预计时间</th>
                <th>实际时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {borrowings.map(b => (
                <tr key={b.id}>
                  <td>{b.student_name || b.student}</td>
                <td>{b.shoe_brand} {b.shoe_last_type} {b.shoe_size}</td>
                  <td>{BORROWING_PURPOSE_MAP[b.purpose]}</td>
                  <td>
                    <span className={`badge ${statusBadge(b.status)}`}>
                      {BORROWING_STATUS_MAP[b.status]}
                    </span>
                  </td>
                  <td>
                    <div>{formatDateTime(b.expected_start_time)}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>至 {formatDateTime(b.expected_end_time)}</div>
                  </td>
                  <td>
                    {b.actual_start_time ? (
                      <div>
                        <div>借出: {formatDateTime(b.actual_start_time)}</div>
                        {b.actual_end_time && (
                          <div style={{ fontSize: 12, color: '#999' }}>归还: {formatDateTime(b.actual_end_time)}</div>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="actions-cell">
                      {b.status === 'reserved' && (
                        <>
                          <button className="btn btn-danger btn-sm" onClick={() => handleBorrow(b.id)}>借出</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleCancel(b.id)}>取消</button>
                        </>
                      )}
                      {b.status === 'overdue' && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleCancel(b.id)}>取消</button>
                      )}
                      {b.status === 'returned' && (
                        <button className="btn btn-info btn-sm" onClick={() => handleView(b)}>查看</button>
                      )}
                      {(b.status === 'reserved' || b.status === 'borrowed') && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleEdit(b)}>编辑</button>
                      )}
                      {b.status === 'cancelled' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>删除</button>
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
        <button disabled={page <= 1} onClick={() => fetchData(page - 1)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1)}>下一页</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <h3>{editItem ? '编辑借用单' : '创建借用单'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>学员 *</label>
                  <select value={form.student} onChange={e => setForm({ ...form, student: e.target.value })} required>
                    <option value="">请选择学员</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({LEVEL_MAP[s.level] || '-'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>鞋款 *</label>
                  <select value={form.shoe} onChange={e => setForm({ ...form, shoe: e.target.value })} required>
                    <option value="">请选择鞋款</option>
                    {shoes.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.brand} {s.size} {s.shoe_type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>用途 *</label>
                  <select value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} required>
                    {Object.entries(BORROWING_PURPOSE_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>预计开始时间 *</label>
                  <input
                    type="datetime-local"
                    value={form.expected_start_time}
                    onChange={e => setForm({ ...form, expected_start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '2 / -1' }}>
                  <label>预计结束时间 *</label>
                  <input
                    type="datetime-local"
                    value={form.expected_end_time}
                    onChange={e => setForm({ ...form, expected_end_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>预约备注</label>
                  <textarea
                    value={form.reservation_notes}
                    onChange={e => setForm({ ...form, reservation_notes: e.target.value })}
                    rows={2}
                    placeholder="备注信息"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={isChecking}>
                  {isChecking ? '检查冲突中...' : (editItem ? '保存修改' : '创建预约')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewItem && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3>借用单详情</h3>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>学员</label>
                <div>{viewItem.student_name || viewItem.student}</div>
              </div>
              <div className="form-group">
                <label>鞋款</label>
                <div>{viewItem.shoe_brand} {viewItem.shoe_last_type} {viewItem.shoe_size}</div>
              </div>
              <div className="form-group">
                <label>用途</label>
                <div>{BORROWING_PURPOSE_MAP[viewItem.purpose]}</div>
              </div>
              <div className="form-group">
                <label>状态</label>
                <div>
                  <span className={`badge ${statusBadge(viewItem.status)}`}>
                    {BORROWING_STATUS_MAP[viewItem.status]}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label>预计开始时间</label>
                <div>{formatDateTime(viewItem.expected_start_time)}</div>
              </div>
              <div className="form-group">
                <label>预计结束时间</label>
                <div>{formatDateTime(viewItem.expected_end_time)}</div>
              </div>
              <div className="form-group">
                <label>实际借出时间</label>
                <div>{formatDateTime(viewItem.actual_start_time)}</div>
              </div>
              <div className="form-group">
                <label>实际归还时间</label>
                <div>{formatDateTime(viewItem.actual_end_time)}</div>
              </div>
              <div className="form-group">
                <label>借出备注</label>
                <div>{viewItem.borrow_notes || '-'}</div>
              </div>
              <div className="form-group">
                <label>归还备注</label>
                <div>{viewItem.return_notes || '-'}</div>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>备注</label>
                <div>{viewItem.notes || '-'}</div>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>创建时间</label>
                <div>{formatDateTime(viewItem.created_at)}</div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowViewModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showConflictModal && conflictInfo && (
        <div className="modal-overlay" onClick={() => setShowConflictModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3>⚠️ 时间冲突</h3>
            <p style={{ color: '#d32f2f', marginBottom: 16 }}>
              该鞋款在所选时间段内已被预约：
            </p>
            {conflictInfo.conflicts && conflictInfo.conflicts.map((c, idx) => (
              <div key={idx} className="card" style={{ marginBottom: 12, padding: 12 }}>
                <div><strong>学员：</strong>{c.student_name || c.student}</div>
                <div><strong>用途：</strong>{BORROWING_PURPOSE_MAP[c.purpose]}</div>
                <div><strong>时间：</strong>{formatDateTime(c.expected_start_time)} 至 {formatDateTime(c.expected_end_time)}</div>
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowConflictModal(false)}>我知道了</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
