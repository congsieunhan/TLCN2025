import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, IMG_BASE_URL } from '../config';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminProducts({ embed=false }){
  const navigate = useNavigate();
  const admin = useMemo(() => { try { return JSON.parse(localStorage.getItem('admin')) || null; } catch { return null; } }, []);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ten_sp: '', hang_sx: '', gia: 0, so_luong_ton: 0, thong_so: '' });
  const [msg, setMsg] = useState('');
  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [edit, setEdit] = useState({ ten_sp: '', hang_sx: '', gia: 0, so_luong_ton: 0, tinh_trang: '', thong_so: '' });
  const [editImages, setEditImages] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [warranty, setWarranty] = useState({ doi_moi_ngay: 30, bao_hanh_thang: 12, mo_ta: '' });

  useEffect(() => {
    if (!admin) { if (!embed) navigate('/admin/login'); return; }
    if ((admin.vai_tro || '').trim() !== 'admin') { if (!embed) navigate('/admin/orders'); return; }
    load();
  }, [admin, navigate, embed]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 2000);
    return () => clearTimeout(t);
  }, [msg]);

  const load = () => {
    if (!admin) return;
    setLoading(true); setErr('');
    fetch(`${API_BASE_URL}/admin/products/?ten_dang_nhap_admin=${encodeURIComponent(admin.ten_dang_nhap)}&q=${encodeURIComponent(q)}`)
      .then(r=>r.json()).then(d=> setItems(Array.isArray(d)? d : [])).catch(()=> setErr('Không tải được danh sách'))
      .finally(()=> setLoading(false));
  };

  const onChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const create = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ten_dang_nhap_admin: admin.ten_dang_nhap, ten_sp: form.ten_sp, hang_sx: form.hang_sx, gia: Number(form.gia), so_luong_ton: Number(form.so_luong_ton), thong_so: form.thong_so })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Không thể tạo'); return; }
      setCreateOpen(false); setForm({ ten_sp: '', hang_sx: '', gia: 0, so_luong_ton: 0, thong_so: '' });
      load();
      setMsg('Đã tạo sản phẩm');
    } catch (e) { alert('Không thể kết nối'); }
  };

  const remove = async (ma_sp) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${ma_sp}/`, { method: 'DELETE', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ ten_dang_nhap_admin: admin.ten_dang_nhap })});
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Xóa thất bại'); return; }
      load();
      setMsg('Đã xóa sản phẩm');
    } catch (e) { alert('Không thể kết nối'); }
  };

  const openEdit = async (ma_sp) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${ma_sp}/?ten_dang_nhap_admin=${encodeURIComponent(admin.ten_dang_nhap)}`);
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Không tải được sản phẩm'); return; }
      setEditId(ma_sp);
      setEdit({
        ten_sp: data.ten_sp || '',
        hang_sx: data.hang_sx || '',
        gia: Number(data.gia || 0),
        so_luong_ton: Number(data.so_luong_ton || 0),
        thong_so: data.thong_so || '',
      });
      setEditImages(Array.isArray(data.hinh_anh_list)? data.hinh_anh_list : []);
      setFile(null);
      // Load warranty
      try {
        const rw = await fetch(`${API_BASE_URL}/admin/products/${ma_sp}/warranty/?ten_dang_nhap_admin=${encodeURIComponent(admin.ten_dang_nhap)}`);
        const wd = await rw.json();
        if (rw.ok) setWarranty({
          doi_moi_ngay: Number(wd.doi_moi_ngay || 30),
          bao_hanh_thang: Number(wd.bao_hanh_thang || 12),
          mo_ta: wd.mo_ta || ''
        });
      } catch {}
      setEditOpen(true);
    } catch (e) {
      alert('Không thể kết nối');
    }
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${editId}/`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ten_dang_nhap_admin: admin.ten_dang_nhap, ten_sp: edit.ten_sp, hang_sx: edit.hang_sx, gia: Number(edit.gia), so_luong_ton: Number(edit.so_luong_ton), thong_so: edit.thong_so })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Lưu thất bại'); return; }
      // refresh list
      load();
      setEditOpen(false);
      setMsg('Đã lưu sản phẩm');
    } catch (e) {
      alert('Không thể kết nối');
    }
  };

  const uploadImage = async () => {
    if (!editId) return;
    if (!file) { alert('Chọn ảnh để tải lên'); return; }
    try {
      const fd = new FormData();
      fd.append('ten_dang_nhap_admin', admin.ten_dang_nhap);
      fd.append('file', file);
      setUploading(true);
      const res = await fetch(`${API_BASE_URL}/admin/products/${editId}/images/`, { method: 'POST', body: fd });
      const data = await res.json();
      setUploading(false);
      if (!res.ok) { alert(data.error || 'Tải ảnh thất bại'); return; }
      // update images
      setEditImages(prev => [ ...(prev || []), data ]);
      setFile(null);
      // also refresh list silently
      load();
      setMsg('Đã tải ảnh lên');
    } catch (e) {
      setUploading(false);
      alert('Không thể kết nối');
    }
  };

  const deleteImage = async (imgId) => {
    if (!editId) return;
    if (!window.confirm('Xóa ảnh này?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${editId}/images/${imgId}/`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ten_dang_nhap_admin: admin.ten_dang_nhap })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { alert(data.error || 'Xóa ảnh thất bại'); return; }
      setEditImages(prev => (prev || []).filter(im => im.id !== imgId));
      load();
      setMsg('Đã xóa ảnh');
    } catch (e) {
      alert('Không thể kết nối');
    }
  };

  const saveWarranty = async () => {
    if (!editId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${editId}/warranty/`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ten_dang_nhap_admin: admin.ten_dang_nhap, ...warranty })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Lưu bảo hành thất bại'); return; }
      setMsg('Đã lưu chính sách bảo hành');
    } catch (e) { alert('Không thể kết nối'); }
  };

  const Content = (
        <div className={`${embed? 'col-12':'col-12 col-md-9'}`}>
          <div className='card p-3'>
            {msg && (<div className='alert alert-success py-2 mb-2'>{msg}</div>)}
            <div className='d-flex justify-content-between align-items-center mb-2'>
              <h4 className='mb-0'>Quản lý sản phẩm</h4>
              <button className='btn btn-dark btn-sm' onClick={()=> setCreateOpen(true)} data-bs-toggle='modal' data-bs-target='#createProd'>+ Thêm sản phẩm</button>
            </div>
            <div className='d-flex gap-2 mb-3'>
              <input className='form-control' placeholder='Tìm theo tên / hãng' value={q} onChange={e=> setQ(e.target.value)} />
              <button className='btn btn-outline-dark' onClick={load}>Tìm</button>
            </div>
            {loading ? (<div>Đang tải...</div>) : err ? (<div className='alert alert-danger'>{err}</div>) : (
              <div className='table-responsive'>
                <table className='table table-sm align-middle'>
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tên</th>
                      <th>Hãng</th>
                      <th>Giá</th>
                      <th>Tồn</th>
                      <th>Tình trạng</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(it => (
                      <tr key={it.ma_sp}>
                        <td>{it.ma_sp}</td>
                        <td>{it.ten_sp}</td>
                        <td>{it.hang_sx}</td>
                        <td>{Number(it.gia).toLocaleString()}₫</td>
                        <td>{it.so_luong_ton}</td>
                        <td>{Number(it.so_luong_ton) > 0 ? 'Còn hàng' : 'Hết hàng'}</td>
                        <td>
                          <div className='d-flex gap-2'>
                            <button className='btn btn-outline-dark btn-sm' onClick={()=> openEdit(it.ma_sp)}>Sửa</button>
                            <button className='btn btn-outline-danger btn-sm' onClick={()=> remove(it.ma_sp)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length === 0 && <div className='text-muted p-2'>Không có sản phẩm</div>}
              </div>
            )}
          </div>
        </div>
  );

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
                <button className='list-group-item list-group-item-action active'>Quản lý sản phẩm</button>
                <button className='list-group-item list-group-item-action' onClick={()=> navigate('/admin/orders')}>Quản lý đơn hàng</button>
              </div>
            </div>
          </div>
        )}
        {Content}
      </div>

      {/* Modal tạo sản phẩm */}
      <div className='modal fade' id='createProd' tabIndex='-1'>
        <div className='modal-dialog'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title'>Thêm sản phẩm</h5>
              <button className='btn-close' data-bs-dismiss='modal'></button>
            </div>
            <div className='modal-body'>
              <div className='mb-2'>
                <label className='form-label'>Tên</label>
                <input className='form-control' name='ten_sp' value={form.ten_sp} onChange={onChange} />
              </div>
              <div className='mb-2'>
                <label className='form-label'>Hãng</label>
                <input className='form-control' name='hang_sx' value={form.hang_sx} onChange={onChange} />
              </div>
              <div className='mb-2'>
                <label className='form-label'>Giá</label>
                <input type='number' className='form-control' name='gia' value={form.gia} onChange={onChange} />
              </div>
              <div className='mb-2'>
                <label className='form-label'>Số lượng tồn</label>
                <input type='number' className='form-control' name='so_luong_ton' value={form.so_luong_ton} onChange={onChange} />
              </div>
              <div className='mb-2'>
                <label className='form-label'>Tình trạng (tự động)</label>
                <input className='form-control' value={Number(form.so_luong_ton) > 0 ? 'Còn hàng' : 'Hết hàng'} readOnly />
              </div>
              <div className='mb-2'>
                <label className='form-label'>Thông số</label>
                <textarea className='form-control' rows='4' name='thong_so' value={form.thong_so} onChange={onChange}></textarea>
              </div>
            </div>
            <div className='modal-footer'>
              <button className='btn btn-secondary' data-bs-dismiss='modal' onClick={()=> setCreateOpen(false)}>Đóng</button>
              <button className='btn btn-dark' data-bs-dismiss='modal' onClick={create}>Tạo</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal sửa sản phẩm (custom overlay) */}
      {editOpen && (
        <div className='modal fade show' style={{display:'block', background:'rgba(0,0,0,0.4)'}}>
          <div className='modal-dialog modal-lg'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Sửa sản phẩm #{editId}</h5>
                <button className='btn-close' onClick={()=> setEditOpen(false)}></button>
              </div>
              <div className='modal-body'>
                <div className='row g-3'>
                  <div className='col-md-7'>
                    <div className='mb-2'>
                      <label className='form-label'>Tên</label>
                      <input className='form-control' value={edit.ten_sp} onChange={e=> setEdit({...edit, ten_sp: e.target.value})} />
                    </div>
                    <div className='mb-2'>
                      <label className='form-label'>Hãng</label>
                      <input className='form-control' value={edit.hang_sx} onChange={e=> setEdit({...edit, hang_sx: e.target.value})} />
                    </div>
                    <div className='mb-2'>
                      <label className='form-label'>Giá</label>
                      <input type='number' className='form-control' value={edit.gia} onChange={e=> setEdit({...edit, gia: e.target.value})} />
                    </div>
                    <div className='mb-2'>
                      <label className='form-label'>Số lượng tồn</label>
                      <input type='number' className='form-control' value={edit.so_luong_ton} onChange={e=> setEdit({...edit, so_luong_ton: e.target.value})} />
                    </div>
                    <div className='mb-2'>
                      <label className='form-label'>Tình trạng (tự động)</label>
                      <input className='form-control' value={Number(edit.so_luong_ton) > 0 ? 'Còn hàng' : 'Hết hàng'} readOnly />
                    </div>
                    <div className='mb-2'>
                      <label className='form-label'>Thông số</label>
                      <textarea className='form-control' rows='5' value={edit.thong_so} onChange={e=> setEdit({...edit, thong_so: e.target.value})}></textarea>
                    </div>
                  </div>
                  <div className='col-md-5'>
                    <div className='fw-semibold mb-2'>Quản lý ảnh</div>
                    <div className='d-flex gap-2 mb-2'>
                      <input type='file' className='form-control' onChange={e=> setFile(e.target.files?.[0] || null)} />
                      <button className='btn btn-dark' onClick={uploadImage} disabled={uploading}>{uploading? 'Đang tải...':'Tải lên'}</button>
                    </div>
                    <div className='d-flex flex-wrap gap-2'>
                      {(editImages || []).map(im => (
                        <div key={im.id} className='position-relative'>
                          <img src={`${IMG_BASE_URL}${im.hinh_anh}`} alt='' style={{width:72,height:72,objectFit:'cover',border:'1px solid #ddd',borderRadius:4}} />
                          <button className='btn btn-sm btn-danger position-absolute' style={{top:0,right:0}} onClick={()=> deleteImage(im.id)}>×</button>
                        </div>
                      ))}
                      {(!editImages || editImages.length === 0) && (<div className='text-muted small'>Chưa có ảnh</div>)}
                    </div>
                    <hr />
                    <div className='fw-semibold mb-2'>Chính sách bảo hành</div>
                    <div className='mb-2'>
                      <label className='form-label'>Đổi mới (ngày)</label>
                      <input type='number' className='form-control' value={warranty.doi_moi_ngay} onChange={e=> setWarranty({...warranty, doi_moi_ngay: Number(e.target.value)})} />
                    </div>
                    <div className='mb-2'>
                      <label className='form-label'>Bảo hành (tháng)</label>
                      <input type='number' className='form-control' value={warranty.bao_hanh_thang} onChange={e=> setWarranty({...warranty, bao_hanh_thang: Number(e.target.value)})} />
                    </div>
                    <div className='mb-2'>
                      <label className='form-label'>Mô tả chính sách</label>
                      <textarea className='form-control' rows='3' value={warranty.mo_ta} onChange={e=> setWarranty({...warranty, mo_ta: e.target.value})}></textarea>
                    </div>
                    <div className='mt-2'>
                      <button className='btn btn-outline-dark btn-sm' onClick={saveWarranty}>Lưu bảo hành</button>
                    </div>
                  </div>
                </div>
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
