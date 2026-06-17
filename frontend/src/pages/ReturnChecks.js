import React, { useState, useEffect } from 'react';
import { getReturnChecks, createReturnCheck, getShoeBorrowings } from '../api';
import { RETURN_CONDITION_MAP, ABNORMAL_TYPE_MAP, BORROWING_PURPOSE_MAP } from '../constants';

export default function ReturnChecks() {
  const [checks, setChecks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStudent, setFilterStudent] = useState('');
  const [filterShoe, setFilterShoe] = useState('');
  const [filterAbnormal, setFilterAbnormal] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [borrowings, setBorrowings] = useState([]);
  const [form, setForm] = useState({
    borrowing: '',
    overall_condition: 'good',
    abnormal_type: 'none',
    abnormal_description: '',
    cleaning_needed: false,
    repair_needed: false,
    retire_shoe: false,
    checked_by: '',
    notes: '',
  });

  const fetchData = async (p = 1, student = '', shoe = '', abnormal = '') => {
    const params = { page: p };
    if (student) params.student = student;
    if (shoe) params.shoe = shoe;
    if (abnormal) params.abnormal = abnormal;
    const res = await getReturnChecks(params);
    const results = res.results || res;
    setChecks(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  const fetchBorrowings = async () => {
    try {
      const res1 = await getShoeBorrowings({ status: 'borrowed', page_size: 100 });
      const res2 = await getShoeBorrowings({ status: 'overdue', page_size: 100 });
      const results1 = res1.results || res1;
      const results2 = res2.results || res2;
      const all = [...(Array.isArray(results1) ? results1 : []), ...(Array.isArray(results2) ? results2 : [])];
      setBorrowings(all.filter(b => !b.has_return_check));
    } catch {
      setBorrowings([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    fetchData(1, filterStudent, filterShoe, filterAbnormal);
  };

  const openCreateModal = () => {
    fetchBorrowings();
    setForm({
      borrowing: '',
      overall_condition: 'good',
      abnormal_type: 'none',
      abnormal_description: '',
      cleaning_needed: false,
      repair_needed: false,
      retire_shoe: false,
      checked_by: '',
      notes: '',
    });
    setShowCreateModal(true);
  };

  const handleView = (c) => {
    setViewItem(c);
    setShowViewModal(true);
  };

  const submitCreate = async () => {
    if (!form.borrowing || !form.checked_by) return;
    const submitData = {
      ...form,
      borrowing: Number(form.borrowing),
    };
    if (!submitData.abnormal_description) delete submitData.abnormal_description;
    await createReturnCheck(submitData);
    setShowCreateModal(false);
    fetchData(page, filterStudent, filterShoe, filterAbnormal);
  };

  const conditionBadge = (c) => {
    const map = { excellent: 'badge-success', good: 'badge-info', fair: 'badge-warning', poor: 'badge-danger' };
    return map[c] || 'badge-info';
  };

  const abnormalBadge = (t) => {
    return t === 'none' ? 'badge-success' : 'badge-danger';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN');
  };

  const formatDateTime = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('zh-CN');
  };

  return (
    <div>
      <div className="page-header">
        <h2>归还检查管理</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>+ 创建检查记录</button>
      </div>

      <div className="search-bar">
        <input
          placeholder="学员ID"
          value={filterStudent}
          onChange={e => setFilterStudent(e.target.value)}
          style={{ width: 120 }}
        />
        <input
          placeholder="鞋款ID"
          value={filterShoe}
          onChange={e => setFilterShoe(e.target.value)}
          style={{ width: 120 }}
        />
        <select value={filterAbnormal} onChange={e => setFilterAbnormal(e.target.value)}>
          <option value="">是否异常</option>
          <option value="true">有异常</option>
          <option value="false">无异常</option>
        </select>
        <button className="btn btn-primary" onClick={handleFilter}>筛选</button>
        <button className="btn btn-outline" onClick={() => { setFilterStudent(''); setFilterShoe(''); setFilterAbnormal(''); fetchData(1, '', '', ''); }}>重置</button>
      </div>

      {checks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
            <p>暂无归还检查记录</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>学员</th>
                <th>鞋款</th>
                <th>借用用途</th>
                <th>归还日期</th>
                <th>整体状况</th>
                <th>异常类型</th>
                <th>检查人</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {checks.map(c => (
                <tr key={c.id}>
                  <td>{c.student_name || '-'}</td>
                  <td>{c.shoe_brand} {c.shoe_size}</td>
                  <td>{c.borrowing_info?.purpose_display || '-'}</td>
                  <td>{formatDate(c.return_date)}</td>
                  <td>
                    <span className={`badge ${conditionBadge(c.overall_condition)}`}>
                      {RETURN_CONDITION_MAP[c.overall_condition]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${abnormalBadge(c.abnormal_type)}`}>
                      {ABNORMAL_TYPE_MAP[c.abnormal_type]}
                    </span>
                    {c.cleaning_needed && <span className="badge badge-info" style={{ marginLeft: 4 }}>待清洁</span>}
                    {c.repair_needed && <span className="badge badge-warning" style={{ marginLeft: 4 }}>待维修</span>}
                    {c.retire_shoe && <span className="badge badge-danger" style={{ marginLeft: 4 }}>待退役</span>}
                  </td>
                  <td>{c.checked_by || '-'}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-info btn-sm" onClick={() => handleView(c)}>查看</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => fetchData(page - 1, filterStudent, filterShoe, filterAbnormal)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1, filterStudent, filterShoe, filterAbnormal)}>下一页</button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <h3>创建归还检查记录</h3>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>借用单 *</label>
                <select value={form.borrowing} onChange={e => setForm({ ...form, borrowing: e.target.value })}>
                  <option value="">请选择借用单</option>
                  {borrowings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.student_name} - {b.shoe_brand} {b.shoe_size} ({BORROWING_PURPOSE_MAP[b.purpose] || b.purpose})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>整体状况 *</label>
                <select value={form.overall_condition} onChange={e => setForm({ ...form, overall_condition: e.target.value })}>
                  {Object.entries(RETURN_CONDITION_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>异常类型 *</label>
                <select value={form.abnormal_type} onChange={e => setForm({ ...form, abnormal_type: e.target.value })}>
                  {Object.entries(ABNORMAL_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>异常说明</label>
                <textarea rows={2} value={form.abnormal_description} onChange={e => setForm({ ...form, abnormal_description: e.target.value })} placeholder="异常情况详细说明" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.cleaning_needed} onChange={e => setForm({ ...form, cleaning_needed: e.target.checked })} />
                  需要清洁
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', cursor: 'pointer', marginTop: 8 }}>
                  <input type="checkbox" checked={form.repair_needed} onChange={e => setForm({ ...form, repair_needed: e.target.checked })} />
                  需要维修
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'normal', cursor: 'pointer', marginTop: 8 }}>
                  <input type="checkbox" checked={form.retire_shoe} onChange={e => setForm({ ...form, retire_shoe: e.target.checked })} />
                  退役处理
                </label>
              </div>
              <div className="form-group">
                <label>检查人 *</label>
                <input value={form.checked_by} onChange={e => setForm({ ...form, checked_by: e.target.value })} placeholder="请输入检查人姓名" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>备注</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="其他备注信息" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitCreate} disabled={!form.borrowing || !form.checked_by}>创建记录</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewItem && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3>归还检查详情</h3>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>学员</label>
                <div>{viewItem.student_name || '-'}</div>
              </div>
              <div className="form-group">
                <label>鞋款</label>
                <div>{viewItem.shoe_brand} {viewItem.shoe_size}</div>
              </div>
              <div className="form-group">
                <label>借用用途</label>
                <div>{viewItem.borrowing_info?.purpose_display || '-'}</div>
              </div>
              <div className="form-group">
                <label>归还日期</label>
                <div>{formatDateTime(viewItem.return_date)}</div>
              </div>
              <div className="form-group">
                <label>整体状况</label>
                <div>
                  <span className={`badge ${conditionBadge(viewItem.overall_condition)}`}>
                    {RETURN_CONDITION_MAP[viewItem.overall_condition]}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label>异常类型</label>
                <div>
                  <span className={`badge ${abnormalBadge(viewItem.abnormal_type)}`}>
                    {ABNORMAL_TYPE_MAP[viewItem.abnormal_type]}
                  </span>
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>异常说明</label>
                <div>{viewItem.abnormal_description || '-'}</div>
              </div>
              <div className="form-group">
                <label>处理标记</label>
                <div>
                  {viewItem.cleaning_needed && <span className="badge badge-info" style={{ marginRight: 4 }}>待清洁</span>}
                  {viewItem.repair_needed && <span className="badge badge-warning" style={{ marginRight: 4 }}>待维修</span>}
                  {viewItem.retire_shoe && <span className="badge badge-danger">待退役</span>}
                  {!viewItem.cleaning_needed && !viewItem.repair_needed && !viewItem.retire_shoe && '-'}
                </div>
              </div>
              <div className="form-group">
                <label>检查人</label>
                <div>{viewItem.checked_by || '-'}</div>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>备注</label>
                <div>{viewItem.notes || '-'}</div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowViewModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
