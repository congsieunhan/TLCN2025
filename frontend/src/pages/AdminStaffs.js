import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';

export default function AdminStaffs({ embed=false }){
  const navigate = useNavigate();
  const admin = useMemo(() => { try { return JSON.parse(localStorage.getItem('admin')) || null; } catch { return null; } }, []);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ho_ten:'', email:'', ten_dang_nhap:'', mat_khau:'' });
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [edit, setEdit] = useState({ ho_ten:'', email:'', ten_dang_nhap:'', mat_khau:'' });

  useEffect(() => { if (!admin) { if (!embed) navigate('/admin/login'); return; } load(); }, [admin, embed]);
  useEffect(() => { if (!msg) return; const t = setTimeout(()=> setMsg(''), 2000); return ()=> clearTimeout(t); }, [msg]);

  const load = () => {
    setLoading(true); setErr('');
    fetch(`${API_BASE_URL}/admin/staffs/?ten_dang_nhap_admin=${encodeURIComponent(admin.ten_dang_nhap)}&q=${encodeURIComponent(q)}`)
      .then(r=>r.json()).then(d=> setItems(Array.isArray(d)? d : [])).catch(()=> setErr('Không tải được danh sách'))
      .finally(()=> setLoading(false));
  };

  const onChange = e => setForm(prev=> ({ ...prev, [e.target.name]: e.target.value }));
  const onEditChange = e => setEdit(prev=> ({ ...prev, [e.target.name]: e.target.value }));

  const create = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/staffs/`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ten_dang_nhap_admin: admin.ten_dang_nhap, ...form }) });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Không thể tạo'); return; }
      setCreateOpen(false); setForm({ ho_ten:'', email:'', ten_dang_nhap:'', mat_khau:'' }); load(); setMsg('Đã tạo nhân viên');
    } catch { alert('Không thể kết nối'); }
  };

  const openEdit = async (id) => {
    try { const r = await fetch(`${API_BASE_URL}/admin/staffs/${id}/?ten_dang_nhap_admin=${encodeURIComponent(admin.ten_dang_nhap)}`); const d = await r.json(); if (!r.ok) { alert(d.error || 'Không tải được'); return; } setEditId(id); setEdit({ ho_ten: d.ho_ten, email: d.email, ten_dang_nhap: d.ten_dang_nhap, mat_khau:'' }); setEditOpen(true); } catch { alert('Không thể kết nối'); }
  };

  const saveEdit = async () => {
    try { const r = await fetch(`${API_BASE_URL}/admin/staffs/${editId}/`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ten_dang_nhap_admin: admin.ten_dang_nhap, ...edit }) }); const d = await r.json(); if (!r.ok) { alert(d.error || 'Lưu thất bại'); return; } setEditOpen(false); load(); setMsg('Đã lưu nhân viên'); } catch { alert('Không thể kết nối'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa nhân viên này?')) return;
    try { const r = await fetch(`${API_BASE_URL}/admin/staffs/${id}/`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ten_dang_nhap_admin: admin.ten_dang_nhap }) }); const d = await r.json().catch(()=>({})); if (!r.ok) { alert(d.error || 'Xóa thất bại'); return; } load(); setMsg('Đã xóa nhân viên'); } catch { alert('Không thể kết nối'); }
  };

  return (
    <div className={`${embed? '':'container py-3'}`}>
      {msg && (
        <div style={{position:'fixed', top:16, right:16, zIndex:2000}}>
          <div className='alert alert-success shadow-sm py-2 px-3 mb-0'>{msg}</div>
        </div>
      )}
      <div className='row g-3'>
        {!embed && (
          <div className='col-12 col-md-3'>
            <div className='card p-2'>
              <div className='list-group'>
                <button className='list-group-item list-group-item-action' onClick={()=> navigate('/admin')}>Tổng quan</button>
                <button className='list-group-item list-group-item-action' onClick={()=> navigate('/admin/products')}>Quản lý sản phẩm</button>
                <button className='list-group-item list-group-item-action' onClick={()=> navigate('/admin/orders')}>Quản lý đơn hàng</button>
                <button className='list-group-item list-group-item-action active'>Quản lý nhân viên</button>
              </div>
            </div>
          </div>
        )}
        <div className={`${embed? 'col-12':'col-12 col-md-9'}`}>
          <div className='card p-3'>
            <div className='d-flex justify-content-between align-items-center mb-2'>
              <h4 className='mb-0'>Quản lý nhân viên</h4>
              <button className='btn btn-dark btn-sm' data-bs-toggle='modal' data-bs-target='#createStaff' onClick={()=> setCreateOpen(true)}>+ Thêm nhân viên</button>
            </div>
            <div className='d-flex gap-2 mb-3'>
              <input className='form-control' placeholder='Tìm theo tên/email/username' value={q} onChange={e=> setQ(e.target.value)} />
              <button className='btn btn-outline-dark' onClick={load}>Tìm</button>
            </div>
            {loading ? (<div>Đang tải...</div>) : err ? (<div className='alert alert-danger'>{err}</div>) : (
              <div className='table-responsive'>
                <table className='table table-sm align-middle'>
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Username</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(it => (
                      <tr key={it.ma_qt}>
                        <td>{it.ma_qt}</td>
                        <td>{it.ho_ten}</td>
                        <td>{it.email}</td>
                        <td>{it.ten_dang_nhap}</td>
                        <td>
                          <div className='d-flex gap-2'>
                            <button className='btn btn-outline-dark btn-sm' onClick={()=> openEdit(it.ma_qt)}>Sửa</button>
                            <button className='btn btn-outline-danger btn-sm' onClick={()=> remove(it.ma_qt)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length === 0 && <div className='text-muted p-2'>Không có nhân viên</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal tạo nhân viên */}
      <div className='modal fade' id='createStaff' tabIndex='-1'>
        <div className='modal-dialog'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title'>Thêm nhân viên</h5>
              <button className='btn-close' data-bs-dismiss='modal'></button>
            </div>
            <div className='modal-body'>
              <div className='mb-2'><label className='form-label'>Họ tên</label><input name='ho_ten' className='form-control' value={form.ho_ten} onChange={onChange} /></div>
              <div className='mb-2'><label className='form-label'>Email</label><input name='email' className='form-control' value={form.email} onChange={onChange} /></div>
              <div className='mb-2'><label className='form-label'>Username</label><input name='ten_dang_nhap' className='form-control' value={form.ten_dang_nhap} onChange={onChange} /></div>
              <div className='mb-2'><label className='form-label'>Mật khẩu</label><input name='mat_khau' type='password' className='form-control' value={form.mat_khau} onChange={onChange} /></div>
            </div>
            <div className='modal-footer'>
              <button className='btn btn-secondary' data-bs-dismiss='modal' onClick={()=> setCreateOpen(false)}>Đóng</button>
              <button className='btn btn-dark' data-bs-dismiss='modal' onClick={create}>Tạo</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal sửa nhân viên */}
      {editOpen && (
        <div className='modal fade show' style={{display:'block', background:'rgba(0,0,0,0.4)'}}>
          <div className='modal-dialog'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Sửa nhân viên</h5>
                <button className='btn-close' onClick={()=> setEditOpen(false)}></button>
              </div>
              <div className='modal-body'>
                <div className='mb-2'><label className='form-label'>Họ tên</label><input className='form-control' name='ho_ten' value={edit.ho_ten} onChange={onEditChange} /></div>
                <div className='mb-2'><label className='form-label'>Email</label><input className='form-control' name='email' value={edit.email} onChange={onEditChange} /></div>
                <div className='mb-2'><label className='form-label'>Username</label><input className='form-control' name='ten_dang_nhap' value={edit.ten_dang_nhap} onChange={onEditChange} /></div>
                <div className='mb-2'><label className='form-label'>Mật khẩu (để trống nếu không đổi)</label><input className='form-control' type='password' name='mat_khau' value={edit.mat_khau} onChange={onEditChange} /></div>
              </div>
              <div className='modal-footer'>
                <button className='btn btn-secondary' onClick={()=> setEditOpen(false)}>Đóng</button>
                <button className='btn btn-dark' onClick={saveEdit}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

