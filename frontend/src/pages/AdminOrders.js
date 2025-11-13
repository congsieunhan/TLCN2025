import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { key: 'cho_xu_ly', label: 'Chờ xử lý' },
  { key: 'da_xac_nhan', label: 'Đã xác nhận' },
  { key: 'dang_giao', label: 'Đang giao' },
  { key: 'hoan_thanh', label: 'Hoàn thành' },
  { key: 'huy', label: 'Đã hủy' },
];

export default function AdminOrders({ embed=false }){
  const navigate = useNavigate();
  const admin = useMemo(() => { try { return JSON.parse(localStorage.getItem('admin')) || null; } catch { return null; } }, []);
  const isAdmin = (admin?.vai_tro || '').trim() === 'admin';
  const [tab, setTab] = useState('cho_xu_ly');
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [expanded, setExpanded] = useState(null);
  // ship form
  const [shipData, setShipData] = useState({ ma_dh: '', nha_vc: '', ma_van_don: '', ngay_du_kien: '' });

  useEffect(() => {
    if (!admin) { if (!embed) navigate('/admin/login'); return; }
  }, [admin, navigate, embed]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 2000);
    return () => clearTimeout(t);
  }, [msg]);

  const load = () => {
    if (!admin) return;
    setLoading(true); setErr('');
    const url = `${API_BASE_URL}/admin/staff/orders/?ten_dang_nhap_admin=${encodeURIComponent(admin.ten_dang_nhap)}&status=${tab}&q=${encodeURIComponent(q)}`;
    fetch(url).then(r => r.json()).then(d => {
      setItems(Array.isArray(d) ? d : []);
    }).catch(() => setErr('Không tải được danh sách đơn')).finally(()=> setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const doAction = async (action, payload) => {
    if (!admin) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/manage/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ten_dang_nhap_admin: admin.ten_dang_nhap, action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Thao tác thất bại'); return; }
      load();
      const nameMap = { confirm: 'Đã xác nhận đơn', ship: 'Đã bàn giao vận chuyển', deliver: 'Đã đánh dấu giao thành công', cancel: 'Đã hủy đơn' };
      setMsg(nameMap[action] || 'Đã cập nhật đơn');
    } catch (e) { alert('Lỗi kết nối'); }
  };

  const confirmOrder = (ma_dh) => doAction('confirm', { ma_dh });
  const deliverOrder = (ma_dh) => doAction('deliver', { ma_dh });
  const cancelOrder = (ma_dh) => {
    const ly_do = prompt('Lý do hủy? (tuỳ chọn)') || '';
    doAction('cancel', { ma_dh, ly_do });
  };
  const openShip = (it) => { setShipData({ ma_dh: it.ma_dh, nha_vc: it?.van_chuyen?.nha_vc || '', ma_van_don: it?.van_chuyen?.ma_van_don || '', ngay_du_kien: '' }); };
  const submitShip = () => {
    if (!shipData.ma_dh) return;
    doAction('ship', shipData);
    setShipData({ ma_dh: '', nha_vc: '', ma_van_don: '', ngay_du_kien: '' });
  };

  const renderActions = (it) => {
    if (tab === 'cho_xu_ly') return (<button className='btn btn-outline-dark btn-sm' onClick={()=>confirmOrder(it.ma_dh)}>Xác nhận</button>);
    if (tab === 'da_xac_nhan') return (
      <div className='d-flex gap-2'>
        <button className='btn btn-dark btn-sm' onClick={()=>openShip(it)} data-bs-toggle='modal' data-bs-target='#shipModal'>Bàn giao VC</button>
        <button className='btn btn-outline-danger btn-sm' onClick={()=>cancelOrder(it.ma_dh)}>Hủy</button>
      </div>
    );
    if (tab === 'dang_giao') return (
      <div className='d-flex gap-2'>
        <button className='btn btn-success btn-sm' onClick={()=>deliverOrder(it.ma_dh)}>Giao xong</button>
        <button className='btn btn-outline-danger btn-sm' onClick={()=>cancelOrder(it.ma_dh)}>Hủy</button>
      </div>
    );
    return null;
  };

  const parseTimeline = (vc) => {
    const notes = (vc?.ghi_chu || '').split('\n').filter(Boolean);
    return notes.map((line, idx) => ({ id: idx, text: line }));
  };

  return (
    <div className={`${embed? '':'container py-3'}`}>
      <div className='row g-3'>
        {!embed && (
          <div className='col-12 col-md-3'>
            <div className='card p-2'>
              <div className='list-group'>
                {isAdmin ? (
                  <>
                    <button className='list-group-item list-group-item-action' onClick={()=> navigate('/admin')}>Tổng quan</button>
                    <button className='list-group-item list-group-item-action' onClick={()=> navigate('/admin/products')}>Quản lý sản phẩm</button>
                    <button className='list-group-item list-group-item-action' onClick={()=> navigate('/admin/staffs')}>Quản lý nhân viên</button>
                    <button className='list-group-item list-group-item-action active'>Quản lý đơn hàng</button>
                  </>
                ) : (
                  <button className='list-group-item list-group-item-action active'>Quản lý đơn hàng</button>
                )}
              </div>
            </div>
          </div>
        )}
        <div className={`${embed? 'col-12':'col-12 col-md-9'}`}>
          <div className='card p-3'>
            {msg && (<div className='alert alert-success py-2 mb-2'>{msg}</div>)}
            <div className='d-flex justify-content-between align-items-center mb-2'>
              <h4 className='mb-0'>Quản lý đơn hàng</h4>
              <div className='d-flex gap-2'>
                <input placeholder='Tìm mã đơn / tên KH' className='form-control form-control-sm' style={{minWidth: 260}} value={q} onChange={e=>setQ(e.target.value)} />
                <button className='btn btn-sm btn-outline-dark' onClick={load}>Tìm</button>
              </div>
            </div>
            <div className='mb-3'>
              {TABS.map(t => (
                <button key={t.key} className={`btn btn-sm me-2 ${tab===t.key? 'btn-dark':'btn-outline-dark'}`} onClick={()=> setTab(t.key)}>{t.label}</button>
              ))}
            </div>
            {err && <div className='alert alert-danger'>{err}</div>}
            {loading ? (<div>Đang tải...</div>) : (
              <div className='table-responsive'>
                <table className='table table-sm align-middle'>
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Ngày đặt</th>
                      <th>Tổng tiền</th>
                      <th>Vận chuyển</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(it => (
                      <React.Fragment key={it.ma_dh}>
                        <tr onClick={()=> setExpanded(expanded===it.ma_dh? null : it.ma_dh)} style={{cursor:'pointer'}}>
                          <td>{it.ma_dh}</td>
                          <td>{it.khach_hang}</td>
                          <td>{new Date(it.ngay_dat).toLocaleString()}</td>
                          <td>{Number(it.tong_tien).toLocaleString()}₫</td>
                          <td>
                            {it.van_chuyen ? (
                              <div className='small'>
                                <div>{it.van_chuyen.trang_thai}</div>
                                <div className='text-muted'>{it.van_chuyen.nha_vc} {it.van_chuyen.ma_van_don? `• ${it.van_chuyen.ma_van_don}`:''}</div>
                              </div>
                            ) : <span className='text-muted'>Chưa có</span>}
                          </td>
                          <td>{renderActions(it)}</td>
                        </tr>
                        {expanded === it.ma_dh && (
                          <tr>
                            <td colSpan={6}>
                              <div className='row'>
                                <div className='col-md-4'>
                                  <div className='card card-body'>
                                    <div className='fw-semibold mb-2'>Thông tin vận chuyển</div>
                                    {it.van_chuyen ? (
                                      <ul className='mb-0 small'>
                                        <li>Trạng thái: {it.van_chuyen.trang_thai}</li>
                                        <li>Đơn vị VC: {it.van_chuyen.nha_vc || '—'}</li>
                                        <li>Mã vận đơn: {it.van_chuyen.ma_van_don || '—'}</li>
                                        <li>Giao dự kiến: {it.van_chuyen.ngay_du_kien || '—'}</li>
                                      </ul>
                                    ) : (
                                      <div className='text-muted small'>Chưa có thông tin</div>
                                    )}
                                  </div>
                                </div>
                                <div className='col-md-8'>
                                  <div className='card card-body'>
                                    <div className='fw-semibold mb-2'>Lịch sử xử lý</div>
                                    <ul className='timeline'>
                                      <li className='small'>{new Date(it.ngay_dat).toLocaleString()}: Tạo đơn</li>
                                      {parseTimeline(it.van_chuyen).map(e => (
                                        <li key={e.id} className='small'>{e.text}</li>
                                      ))}
                                      {it.van_chuyen && it.van_chuyen.ngay_giao_thanh_cong && (
                                        <li className='small'>{new Date(it.van_chuyen.ngay_giao_thanh_cong).toLocaleString()}: Hoàn thành</li>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {items.length === 0 && <div className='text-muted p-3'>Không có đơn phù hợp</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal ship */}
      <div className='modal fade' id='shipModal' tabIndex='-1'>
        <div className='modal-dialog'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title'>Bàn giao vận chuyển</h5>
              <button type='button' className='btn-close' data-bs-dismiss='modal' aria-label='Close'></button>
            </div>
            <div className='modal-body'>
              <div className='mb-2'>
                <label className='form-label'>Mã đơn</label>
                <input className='form-control' value={shipData.ma_dh} readOnly />
              </div>
              <div className='mb-2'>
                <label className='form-label'>Đơn vị vận chuyển</label>
                <input className='form-control' value={shipData.nha_vc} onChange={e=> setShipData({...shipData, nha_vc: e.target.value})} placeholder='GHN / GHTK / VNPost ...' />
              </div>
              <div className='mb-2'>
                <label className='form-label'>Mã vận đơn</label>
                <input className='form-control' value={shipData.ma_van_don} onChange={e=> setShipData({...shipData, ma_van_don: e.target.value})} />
              </div>
              <div className='mb-2'>
                <label className='form-label'>Ngày giao dự kiến</label>
                <input type='date' className='form-control' value={shipData.ngay_du_kien} onChange={e=> setShipData({...shipData, ngay_du_kien: e.target.value})} />
              </div>
            </div>
            <div className='modal-footer'>
              <button className='btn btn-secondary' data-bs-dismiss='modal'>Đóng</button>
              <button className='btn btn-dark' data-bs-dismiss='modal' onClick={submitShip}>Xác nhận bàn giao</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
