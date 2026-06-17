import React, { useState, useEffect } from 'react';
import {
  getShoeInventory, createShoeInventory, updateShoeInventory, deleteShoeInventory,
  getLowStockShoes, setShoeStatus
} from '../api';
import {
  SHOE_TYPE_MAP, SHOE_STATUS_MAP, SHOE_HARDNESS_MAP, BOX_HEIGHT_MAP
} from '../constants';

export default function ShoeInventory() {
  const [shoes, setShoes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [statusItem, setStatusItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [filters, setFilters] = useState({ brand: '', shoe_type: '', status: '', size: '', classroom: '' });
  const [form, setForm] = useState({
    shoe_type: 'pointe', brand: '', last_type: '', size: '', width: '',
    hardness: 'medium', box_height: 'medium', shank_type: '', status: 'available',
    classroom: '', cabinet: '', purchase_date: '', entry_date: new Date().toISOString().slice(0, 10),
    max_borrow_count: 10, safety_stock: 1, purchase_price: '', notes: ''
  });

  const fetchData = async (p = 1, filterParams = {}) => {
    const params = { page: p, ...filterParams };
    const res = await getShoeInventory(params);
    const results = res.results || res;
    setShoes(Array.isArray(results) ? results : []);
    setTotalPages(Math.ceil((res.count || results.length) / 20));
    setPage(p);
  };

  const fetchLowStock = async () => {
    try {
      const data = await getLowStockShoes();
      setLowStockItems(Array.isArray(data) ? data : []);
    } catch {
      setLowStockItems([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLowStock();
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchData(1, newFilters);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = { ...form };
    if (!submitData.purchase_date) delete submitData.purchase_date;
    if (!submitData.purchase_price) delete submitData.purchase_price;
    if (editItem) {
      await updateShoeInventory(editItem.id, submitData);
    } else {
      await createShoeInventory(submitData);
    }
    setShowModal(false);
    setEditItem(null);
    resetForm();
    fetchData(page, filters);
    fetchLowStock();
  };

  const resetForm = () => {
    setForm({
      shoe_type: 'pointe', brand: '', last_type: '', size: '', width: '',
      hardness: 'medium', box_height: 'medium', shank_type: '', status: 'available',
      classroom: '', cabinet: '', purchase_date: '', entry_date: new Date().toISOString().slice(0, 10),
      max_borrow_count: 10, safety_stock: 1, purchase_price: '', notes: ''
    });
  };

  const handleEdit = (shoe) => {
    setEditItem(shoe);
    setForm({
      shoe_type: shoe.shoe_type,
      brand: shoe.brand,
      last_type: shoe.last_type,
      size: shoe.size,
      width: shoe.width || '',
      hardness: shoe.hardness,
      box_height: shoe.box_height,
      shank_type: shoe.shank_type || '',
      status: shoe.status,
      classroom: shoe.classroom || '',
      cabinet: shoe.cabinet || '',
      purchase_date: shoe.purchase_date || '',
      entry_date: shoe.entry_date ? new Date(shoe.entry_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      max_borrow_count: shoe.max_borrow_count,
      safety_stock: shoe.safety_stock,
      purchase_price: shoe.purchase_price || '',
      notes: shoe.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定删除该鞋款？')) {
      await deleteShoeInventory(id);
      fetchData(page, filters);
      fetchLowStock();
    }
  };

  const openStatusModal = (shoe) => {
    setStatusItem(shoe);
    setNewStatus(shoe.status);
    setShowStatusModal(true);
  };

  const handleStatusChange = async () => {
    if (!statusItem || !newStatus) return;
    await setShoeStatus(statusItem.id, newStatus);
    setShowStatusModal(false);
    setStatusItem(null);
    fetchData(page, filters);
    fetchLowStock();
  };

  const statusBadge = (s) => {
    const map = {
      available: 'badge-success',
      borrowed: 'badge-danger',
      maintenance: 'badge-warning',
      reserved: 'badge-info',
      retired: 'badge-primary',
      lost: 'badge-danger'
    };
    return map[s] || 'badge-info';
  };

  const shoeTypeBadge = (t) => {
    const map = {
      pointe: 'badge-primary',
      slipper: 'badge-info',
      sample: 'badge-warning'
    };
    return map[t] || 'badge-info';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-CN');
  };

  return (
    <div>
      <div className="page-header">
        <h2>鞋款库存</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {lowStockItems.length > 0 && (
            <span className="badge badge-danger" style={{ fontSize: 14, padding: '6px 14px' }}>
              {lowStockItems.length} 款库存不足
            </span>
          )}
          <button className="btn btn-primary" onClick={() => { setEditItem(null); resetForm(); setShowModal(true); }}>
            + 新增鞋款
          </button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', background: '#fff5f5' }}>
          <h3 style={{ fontSize: 16, marginBottom: 12, color: 'var(--danger)' }}>库存不足预警</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {lowStockItems.map((item, idx) => (
              <span key={idx} className="badge badge-danger" style={{ fontSize: 12, padding: '6px 12px' }}>
                {item.brand} {item.last_type} {item.size}（{item.shoe_type_display}）
                库存: {item.current_count}/{item.safety_stock}，缺{item.deficit}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="search-bar">
        <input placeholder="搜索品牌" value={filters.brand} onChange={e => handleFilterChange('brand', e.target.value)} />
        <input placeholder="搜索尺码" value={filters.size} onChange={e => handleFilterChange('size', e.target.value)} />
        <input placeholder="搜索教室" value={filters.classroom} onChange={e => handleFilterChange('classroom', e.target.value)} />
        <select value={filters.shoe_type} onChange={e => handleFilterChange('shoe_type', e.target.value)}>
          <option value="">全部类型</option>
          {Object.entries(SHOE_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
          <option value="">全部状态</option>
          {Object.entries(SHOE_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {shoes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 40, marginBottom: 12 }}>👟</p>
            <p>暂无鞋款库存</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>品牌</th>
                <th>楦型</th>
                <th>尺码</th>
                <th>类型</th>
                <th>硬度</th>
                <th>鞋盒</th>
                <th>状态</th>
                <th>位置</th>
                <th>借用次数</th>
                <th>入库日期</th>
                <th>当前使用</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {shoes.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.brand}</strong></td>
                  <td>{s.last_type}</td>
                  <td>{s.size}{s.width ? ` / ${s.width}` : ''}</td>
                  <td><span className={`badge ${shoeTypeBadge(s.shoe_type)}`}>{SHOE_TYPE_MAP[s.shoe_type]}</span></td>
                  <td>{SHOE_HARDNESS_MAP[s.hardness]}</td>
                  <td>{BOX_HEIGHT_MAP[s.box_height]}</td>
                  <td>
                    <span className={`badge ${statusBadge(s.status)}`}>{SHOE_STATUS_MAP[s.status]}</span>
                    {s.is_below_safety_stock && (
                      <span className="badge badge-danger" style={{ marginLeft: 4, fontSize: 10 }}>库存低</span>
                    )}
                    {s.remaining_borrow_count <= 2 && s.status !== 'retired' && (
                      <span className="badge badge-warning" style={{ marginLeft: 4, fontSize: 10 }}>次数少</span>
                    )}
                  </td>
                  <td>{s.classroom || '-'} {s.cabinet ? `(${s.cabinet})` : ''}</td>
                  <td>{s.current_borrow_count}/{s.max_borrow_count}</td>
                  <td>{formatDate(s.entry_date)}</td>
                  <td>
                    {s.current_borrowing ? (
                      <span style={{ fontSize: 12 }}>
                        {s.current_borrowing.student_name}
                        <br />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          预计: {formatDate(s.current_borrowing.expected_end_time)}
                        </span>
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-outline btn-sm" onClick={() => openStatusModal(s)}>状态</button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleEdit(s)}>编辑</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => fetchData(page - 1, filters)}>上一页</button>
        <span>第 {page} / {totalPages} 页</span>
        <button disabled={page >= totalPages} onClick={() => fetchData(page + 1, filters)}>下一页</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h3>{editItem ? '编辑鞋款' : '新增鞋款'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>鞋类型</label>
                  <select value={form.shoe_type} onChange={e => setForm({ ...form, shoe_type: e.target.value })}>
                    {Object.entries(SHOE_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>品牌 *</label>
                  <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>楦型 *</label>
                  <input value={form.last_type} onChange={e => setForm({ ...form, last_type: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>尺码 *</label>
                  <input value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} required placeholder="如: 37.5" />
                </div>
                <div className="form-group">
                  <label>鞋宽</label>
                  <input value={form.width} onChange={e => setForm({ ...form, width: e.target.value })} placeholder="如: C / D" />
                </div>
                <div className="form-group">
                  <label>硬度</label>
                  <select value={form.hardness} onChange={e => setForm({ ...form, hardness: e.target.value })}>
                    {Object.entries(SHOE_HARDNESS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>鞋盒高度</label>
                  <select value={form.box_height} onChange={e => setForm({ ...form, box_height: e.target.value })}>
                    {Object.entries(BOX_HEIGHT_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>鞋底类型</label>
                  <input value={form.shank_type} onChange={e => setForm({ ...form, shank_type: e.target.value })} placeholder="如: 硬底 / 软底" />
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {Object.entries(SHOE_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>所在教室</label>
                  <input value={form.classroom} onChange={e => setForm({ ...form, classroom: e.target.value })} placeholder="如: A教室" />
                </div>
                <div className="form-group">
                  <label>柜位</label>
                  <input value={form.cabinet} onChange={e => setForm({ ...form, cabinet: e.target.value })} placeholder="如: 1-2-3" />
                </div>
                <div className="form-group">
                  <label>购入日期</label>
                  <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>入库日期</label>
                  <input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>最大可借用次数</label>
                  <input type="number" value={form.max_borrow_count} onChange={e => setForm({ ...form, max_borrow_count: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label>安全库存数量</label>
                  <input type="number" value={form.safety_stock} onChange={e => setForm({ ...form, safety_stock: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label>购入价格</label>
                  <input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>备注</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
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

      {showStatusModal && statusItem && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3>更新状态</h3>
            <p style={{ marginBottom: 16 }}>
              鞋款：<strong>{statusItem.brand} {statusItem.last_type} {statusItem.size}</strong>
            </p>
            <div className="form-group">
              <label>选择新状态</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {Object.entries(SHOE_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowStatusModal(false)}>取消</button>
              <button type="button" className="btn btn-primary" onClick={handleStatusChange}>确认更新</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
