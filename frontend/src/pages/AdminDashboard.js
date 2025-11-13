import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminStaffs from './AdminStaffs';

export default function AdminDashboard(){
  const navigate = useNavigate();
  const admin = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('admin')) || null; } catch { return null; }
  }, []);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [section, setSection] = useState('overview'); // overview | products | orders | staffs
  const isAdmin = (admin?.vai_tro || '').trim() === 'admin';

  useEffect(() => {
    if (!admin) { navigate('/admin/login'); return; }
    if (!isAdmin) { navigate('/admin/orders'); return; }
    fetch(`${API_BASE_URL}/admin/overview/?ten_dang_nhap_admin=${encodeURIComponent(admin.ten_dang_nhap)}`)
      .then(r => r.json())
      .then(d => { setStats(d); })
      .catch(() => setError('Không tải được số liệu'));
  }, [admin, isAdmin, navigate]);

  // Nếu là nhân viên, chuyển thẳng đến trang xử lý đơn
  useEffect(() => {
    if (!admin) return;
    const role = (admin.vai_tro || '').trim();
    if (role !== 'admin') {
      // Nhân viên vẫn có thể vào Dashboard nhưng ưu tiên điều hướng nhanh sang xử lý đơn
      // Comment dòng dưới nếu muốn cho phép nhân viên ở lại trang này
      // navigate('/admin/orders');
    }
  }, [admin, navigate]);

  const logout = () => { localStorage.removeItem('admin'); navigate('/admin/login'); };

  return (
    <div className='container py-4'>
      <div className='row g-3'>
        {/* Sidebar trái */}
        <div className='col-12 col-md-3'>
          <div className='card p-2'>
            <div className='d-flex align-items-center justify-content-between mb-2'>
              <div>
                <div className='small text-muted'>Tài khoản</div>
                <div className='fw-semibold'>{admin?.ho_ten} ({admin?.vai_tro})</div>
              </div>
              <button className='btn btn-outline-dark btn-sm' onClick={logout}>Đăng xuất</button>
            </div>
            <div className='list-group'>
              {isAdmin ? (
                <>
                  <button className={`list-group-item list-group-item-action ${section==='overview'?'active':''}`} onClick={()=> setSection('overview')}>Tổng quan</button>
                  <button className={`list-group-item list-group-item-action ${section==='products'?'active':''}`} onClick={()=> setSection('products')}>Quản lý sản phẩm</button>
                  <button className={`list-group-item list-group-item-action ${section==='orders'?'active':''}`} onClick={()=> setSection('orders')}>Quản lý đơn hàng</button>
                  <button className={`list-group-item list-group-item-action ${section==='staffs'?'active':''}`} onClick={()=> setSection('staffs')}>Quản lý nhân viên</button>
                  <button className='list-group-item list-group-item-action' disabled>Khách hàng (sắp có)</button>
                  <button className='list-group-item list-group-item-action' disabled>Báo cáo (sắp có)</button>
                </>
              ) : (
                <button className='list-group-item list-group-item-action active' onClick={()=> navigate('/admin/orders')}>Quản lý đơn hàng</button>
              )}
            </div>
          </div>
        </div>
        {/* Nội dung phải */}
        <div className='col-12 col-md-9'>
          {section === 'overview' && (
            <div className='card p-3'>
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <h4 className='mb-0'>Bảng điều khiển Quản trị</h4>
              </div>
              {error && <div className='alert alert-danger'>{error}</div>}
              {!stats ? (
                <div>Đang tải...</div>
              ) : (
                <div className='row g-3'>
                  <div className='col-sm-6 col-lg-3'>
                    <div className='card p-3'>
                      <div className='text-muted'>Sản phẩm</div>
                      <div className='fs-4 fw-bold'>{stats.counts?.san_pham || 0}</div>
                    </div>
                  </div>
                  <div className='col-sm-6 col-lg-3'>
                    <div className='card p-3'>
                      <div className='text-muted'>Đơn hàng</div>
                      <div className='fs-4 fw-bold'>{stats.counts?.don_hang || 0}</div>
                    </div>
                  </div>
                  <div className='col-sm-6 col-lg-3'>
                    <div className='card p-3'>
                      <div className='text-muted'>Khách hàng</div>
                      <div className='fs-4 fw-bold'>{stats.counts?.khach_hang || 0}</div>
                    </div>
                  </div>
                  <div className='col-sm-6 col-lg-3'>
                    <div className='card p-3'>
                      <div className='text-muted'>Tổng doanh thu</div>
                      <div className='fs-4 fw-bold'>{Number(stats.tong_doanh_thu || 0).toLocaleString()}₫</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {section === 'products' && (
            <AdminProducts embed />
          )}
          {section === 'orders' && (
            <AdminOrders embed />
          )}
          {section === 'staffs' && (
            <AdminStaffs embed />
          )}
          
        </div>
      </div>
    </div>
  );
}
