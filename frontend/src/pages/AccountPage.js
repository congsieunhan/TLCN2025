import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import "./AccountPage.css";

export default function AccountPage() {
  const location = useLocation();
  const initialTab = useMemo(() => {
    try {
      const qs = new URLSearchParams(location.search);
      const t = qs.get('tab');
      return (t === 'address' || t === 'bank' || t === 'profile') ? t : 'profile';
    } catch { return 'profile'; }
  }, [location.search]);
  const [active, setActive] = useState(initialTab);
  useEffect(() => { setActive(initialTab); }, [initialTab]);

  const content = useMemo(() => {
    switch (active) {
      case "profile":
        return (
          <div>
            <h4>Hồ sơ</h4>
            <p>Cập nhật thông tin cá nhân của bạn.</p>
            <div className="form-grid">
              <div>
                <label>Họ tên</label>
                <input className="form-control" placeholder="Nhập họ tên" />
              </div>
              <div>
                <label>Email</label>
                <input className="form-control" placeholder="Email" type="email" />
              </div>
              <div>
                <label>Số điện thoại</label>
                <input className="form-control" placeholder="Số điện thoại" />
              </div>
              <div>
                <label>Mật khẩu mới</label>
                <input className="form-control" placeholder="Mật khẩu mới" type="password" />
              </div>
            </div>
            <button className="btn btn-dark mt-3">Lưu thay đổi</button>
          </div>
        );
      case "bank":
        return (
          <div>
            <h4>Ngân hàng</h4>
            <p>Quản lý thẻ và tài khoản thanh toán.</p>
            <div className="card p-3 mb-2">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <strong>Chưa có thẻ</strong>
                  <div className="text-muted small">Thêm thẻ để thanh toán nhanh hơn</div>
                </div>
                <button className="btn btn-outline-dark">Thêm thẻ</button>
              </div>
            </div>
          </div>
        );
      case "address":
        return <AddressPanel/>;
      default:
        return null;
    }
  }, [active]);

  return (
    <div className="account-container container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Tài khoản của tôi</li>
        </ol>
      </nav>

      <div className="row g-3">
        <div className="col-12 col-md-3">
          <div className="account-sidebar card p-2">
            <button className={`side-item ${active==='profile'?'active':''}`} onClick={()=>setActive('profile')}>
              <i className="bi bi-person me-2"/> Hồ sơ
            </button>
            <button className={`side-item ${active==='bank'?'active':''}`} onClick={()=>setActive('bank')}>
              <i className="bi bi-credit-card me-2"/> Ngân hàng
            </button>
            <button className={`side-item ${active==='address'?'active':''}`} onClick={()=>setActive('address')}>
              <i className="bi bi-geo-alt me-2"/> Địa chỉ
            </button>
          </div>
        </div>
        <div className="col-12 col-md-9">
          <div className="card p-3 account-content">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    ho_ten: "",
    sdt: "",
    tinh_tp: "",
    phuong_xa: "",
    dia_chi_chi_tiet: "",
    mac_dinh: false,
  });
  const [provOptions, setProvOptions] = useState([]);
  const [wardOptions, setWardOptions] = useState([]);
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [addrOpen, setAddrOpen] = useState(false);
  const pickerRef = useRef(null);

  // Lấy username ổn định (tránh object mới mỗi render gây loop)
  const username = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user'))?.ten_dang_nhap || null; } catch { return null; }
  }, []);

  const load = useCallback(() => {
    if (!username) { setLoading(false); return; }
    setLoading(true);
    axios.get(`${API_BASE_URL}/address/`, { params: { ten_dang_nhap: username }})
      .then(res => setItems(Array.isArray(res.data)? res.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => { load(); }, [load]);

  // Load provinces initial
  useEffect(() => {
    axios.get(`${API_BASE_URL}/locations/`, { params: { level: 'province' } })
      .then(res => setProvOptions(res.data || []))
      .catch(() => setProvOptions([]));
  }, []);

  // Khi chọn Tỉnh/TP → load trực tiếp danh sách Phường/Xã theo tỉnh (bỏ quận/huyện)
  useEffect(() => {
    if (!selectedProv) { setWardOptions([]); setSelectedWard(null); return; }
    axios.get(`${API_BASE_URL}/locations/`, { params: { level: 'ward', province_code: selectedProv.code } })
      .then(res => setWardOptions(res.data || []))
      .catch(() => setWardOptions([]));
  }, [selectedProv]);

  // Đóng panel khi click ra ngoài
  useEffect(() => {
    const onDocClick = (e) => {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(e.target)) setAddrOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const add = () => {
    if (!username) { alert('Vui lòng đăng nhập'); return; }
    // Ghi lại tên đã chọn vào form
    const payload = {
      ...form,
      tinh_tp: selectedProv?.name || form.tinh_tp,
      phuong_xa: selectedWard?.name || form.phuong_xa,
      ten_dang_nhap: username,
    };
    axios.post(`${API_BASE_URL}/address/`, payload)
      .then(() => { setForm({ ho_ten:"", sdt:"", tinh_tp:"", phuong_xa:"", dia_chi_chi_tiet:"", mac_dinh:false }); load(); })
      .catch(err => alert(err?.response?.data?.error || 'Không thể thêm địa chỉ'));
  };

  const remove = (id) => {
    if (!username) return;
    if (!window.confirm('Xóa địa chỉ này?')) return;
    axios.delete(`${API_BASE_URL}/address/`, { data: { id, ten_dang_nhap: username }})
      .then(() => load())
      .catch(err => alert(err?.response?.data?.error || 'Không thể xóa địa chỉ'));
  };

  const setDefault = (id) => {
    if (!username) return;
    axios.put(`${API_BASE_URL}/address/`, { id, ten_dang_nhap: username, mac_dinh: true })
      .then(() => load())
      .catch(err => alert(err?.response?.data?.error || 'Không thể đặt mặc định'));
  };

  return (
    <div>
      <h4>Địa chỉ</h4>
      <p>Quản lý địa chỉ giao hàng của bạn.</p>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label">Họ tên người nhận</label>
            <input name="ho_ten" value={form.ho_ten} onChange={onChange} className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label">Số điện thoại</label>
            <input name="sdt" value={form.sdt} onChange={onChange} className="form-control" />
          </div>
          <div className="col-12">
            <label className="form-label">Địa bàn (Tỉnh/TP - Phường/Xã)</label>
            <div className="addr-picker" ref={pickerRef}>
              <div className="picker-label">Tỉnh/ Thành phố, Phường/Xã</div>
              <input
                className="picker-input form-control"
                type="text"
                readOnly
                autoComplete="user-administrative-divisions"
                placeholder="Tỉnh/ Thành phố, Phường/Xã"
                value={selectedWard ? `${selectedProv?.name}, ${selectedWard?.name}` : (selectedProv ? `${selectedProv?.name}` : '')}
                onClick={() => setAddrOpen((v) => !v)}
              />
              <div className={`picker-dropdown card ${addrOpen ? 'show' : ''}`}>
                <div className="picker-columns">
                  <div className="picker-col prov list-group">
                    {provOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.code}
                        className={`list-group-item list-group-item-action ${selectedProv?.code===opt.code? 'active':''}`}
                        onClick={() => {
                          setSelectedProv(opt);
                          setSelectedWard(null);
                        }}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                  <div className="picker-col ward list-group">
                    {wardOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.code}
                        disabled={!selectedProv}
                        className={`list-group-item list-group-item-action ${selectedWard?.code===opt.code? 'active':''}`}
                        onClick={() => {
                          setSelectedWard(opt);
                          setForm(prev => ({
                            ...prev,
                            tinh_tp: selectedProv?.name || '',
                            phuong_xa: opt?.name || ''
                          }));
                          setAddrOpen(false);
                        }}
                      >
                        {opt.name}
                      </button>
                    ))}
                    {selectedProv && (!wardOptions || wardOptions.length === 0) && (
                      <div className="text-muted small p-2">Không có dữ liệu Phường/Xã cho tỉnh đã chọn.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12">
            <label className="form-label">Địa chỉ chi tiết</label>
            <input name="dia_chi_chi_tiet" value={form.dia_chi_chi_tiet} onChange={onChange} className="form-control" />
          </div>
          <div className="col-12 d-flex align-items-center">
            <input id="mac_dinh" name="mac_dinh" type="checkbox" checked={form.mac_dinh} onChange={onChange} className="form-check-input me-2" />
            <label htmlFor="mac_dinh" className="form-check-label">Đặt làm mặc định</label>
          </div>
        </div>
        <div className="mt-3">
          <button className="btn btn-dark" onClick={add}>Thêm địa chỉ</button>
        </div>
      </div>

      <div className="list-group">
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          items.length === 0 ? (
            <div className="text-muted">Chưa có địa chỉ.</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="list-group-item d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-semibold">
                    {it.ho_ten} • {it.sdt}
                    {it.mac_dinh && <span className="badge bg-dark ms-2">Mặc định</span>}
                  </div>
                  <div className="text-muted small">
                    {[
                      it.dia_chi_chi_tiet,
                      it.phuong_xa,
                      it.tinh_tp
                    ].filter(Boolean).join(', ')}
                  </div>
                </div>
                <div className="d-flex gap-2">
                  {!it.mac_dinh && (
                    <button className="btn btn-outline-dark btn-sm" onClick={() => setDefault(it.id)}>Đặt mặc định</button>
                  )}
                  <button className="btn btn-outline-danger btn-sm" onClick={() => remove(it.id)}>Xóa</button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

// (Đã chuyển sang cascader 3 cột nên không dùng SearchableSelect nữa)
