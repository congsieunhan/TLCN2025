import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL, IMG_BASE_URL } from "../config";
import "./OrdersPage.css";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const username = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('user'))?.ten_dang_nhap || null; } catch { return null; }
    }, []);

    // 📦 Lấy danh sách đơn hàng từ backend
    useEffect(() => {
        const fetchOrders = () => {
            if (!username) { setLoading(false); return; }
            fetch(`${API_BASE_URL}/donhang/?ten_dang_nhap=${username}`)
                .then((res) => res.json())
                .then((data) => {
                    setOrders(Array.isArray(data) ? data : []);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Lỗi khi tải đơn hàng:", err);
                    setLoading(false);
                });
        };
        fetchOrders();
        // Realtime: subscribe SSE để tự refresh khi có thay đổi đơn hàng/ vận chuyển
        let es;
        try {
            if (username) {
                es = new EventSource(`${API_BASE_URL}/stream/?channels=orders&ten_dang_nhap=${encodeURIComponent(username)}`);
                es.addEventListener('orders', () => fetchOrders());
            }
        } catch {}
        return () => { try { es && es.close(); } catch {} };
    }, [username]);

    const cancelOrder = async (ma_dh) => {
        if (!username) { alert('Vui lòng đăng nhập'); return; }
        if (!window.confirm(`Hủy đơn ${ma_dh}?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/donhang/cancel/`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ten_dang_nhap: username, ma_dh })
            });
            const data = await res.json();
            if (!res.ok) { alert(data.error || 'Không thể hủy đơn'); return; }
            // Tải lại đơn hàng
            setLoading(true);
            fetch(`${API_BASE_URL}/donhang/?ten_dang_nhap=${username}`)
              .then(r=>r.json()).then(d=> setOrders(Array.isArray(d)? d : []))
              .finally(()=> setLoading(false));
        } catch (e) { alert('Không thể kết nối máy chủ'); }
    };

    // 💬 Hàm xử lý đánh giá từng sản phẩm
    const handleReview = async (ma_sp, ten_sp) => {
        const so_sao = prompt(`🌟 Bạn chấm bao nhiêu sao cho "${ten_sp}" (1-5)?`);
        if (!so_sao || isNaN(so_sao) || so_sao < 1 || so_sao > 5) {
            alert("Số sao không hợp lệ!");
            return;
        }

        const noi_dung = prompt("📝 Nhập nội dung đánh giá của bạn (tuỳ chọn):");

        try {
            if (!username) { alert('Vui lòng đăng nhập'); return; }
            const res = await fetch(`${API_BASE_URL}/danh-gia/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ten_dang_nhap: username,
                    ma_sp,
                    so_sao,
                    noi_dung,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("🎉 Cảm ơn bạn đã đánh giá sản phẩm!");
            } else {
                alert(data.error || "❌ Lỗi khi gửi đánh giá!");
            }
        } catch (err) {
            console.error("Lỗi khi gửi đánh giá:", err);
            alert("Lỗi kết nối đến máy chủ!");
        }
    };

    // 🌀 Loading
    if (loading) return <div className="loading">⏳ Đang tải đơn hàng...</div>;

    // ❌ Không có đơn hàng
    if (!username) {
        return (
            <div className="no-orders">
                <h3>Vui lòng đăng nhập để xem đơn hàng</h3>
                <Link to="/login">Đăng nhập</Link>
            </div>
        );
    }

    if (orders.length === 0)
        return (
            <div className="no-orders">
                <h3>Bạn chưa có đơn hàng nào 🛍️</h3>
                <Link to="/">Tiếp tục mua sắm</Link>
            </div>
        );

    // ✅ Giao diện chính
    return (
        <div className="orders-container">
            <h2>📦 Đơn hàng của tôi</h2>

            {orders.map((order) => (
                <div key={order.ma_dh} className="order-card">
                    <div className="order-header">
                        <span>
                            <strong>Mã đơn hàng:</strong> {order.ma_dh}
                        </span>
                        <span
                            className={`status ${order.trang_thai === "Đã hoàn thành"
                                ? "completed"
                                : order.trang_thai === "Đang giao hàng"
                                    ? "shipping"
                                    : order.trang_thai === "Chờ xử lý"
                                        ? "pending"
                                        : "other"
                                }`}
                        >
                            {order.trang_thai}
                        </span>
                        {order.trang_thai === 'Chờ xử lý' && (
                          <button className="review-btn" style={{marginLeft: 8}} onClick={()=> cancelOrder(order.ma_dh)}>Hủy đơn</button>
                        )}
                    </div>

                    <div className="order-info">
                        <p>
                            <strong>Ngày đặt:</strong>{" "}
                            {new Date(order.ngay_dat).toLocaleString()}
                        </p>
                        <p>
                            <strong>Tổng tiền:</strong>{" "}
                            {Number(order.tong_tien).toLocaleString()}₫
                        </p>
                        <p>
                            <strong>Địa chỉ giao:</strong> {order.dia_chi_giao}
                        </p>
                    </div>

                    {/* Thông tin vận chuyển (nếu có) */}
                    {order.van_chuyen && (
                        <div className="shipping-box" style={{marginTop: 8}}>
                            <div>
                                <strong>Vận chuyển:</strong> {order.van_chuyen.trang_thai || '—'}
                            </div>
                            <div className="shipping-detail" style={{gap: 8, flexWrap: 'wrap'}}>
                                <span><strong>Đơn vị:</strong> {order.van_chuyen.nha_vc || '—'}</span>
                                <span><strong>Mã vận đơn:</strong> {order.van_chuyen.ma_van_don || '—'}</span>
                                <span><strong>Ngày giao dự kiến:</strong> {order.van_chuyen.ngay_du_kien ? new Date(order.van_chuyen.ngay_du_kien).toLocaleDateString() : '—'}</span>
                            </div>
                        </div>
                    )}

                    {/* Chi tiết sản phẩm trong đơn */}
                    <div className="order-products">
                        {order.chi_tiet.map((ct, i) => (
                            <div key={i} className="product-item">
                                <img
                                    src={`${IMG_BASE_URL}${ct.san_pham.hinh_anh}`}
                                    alt={ct.san_pham.ten_sp}
                                />
                                <div className="product-details">
                                    <div className="info">
                                        <p className="product-name">{ct.san_pham.ten_sp}</p>
                                        <p>
                                            SL: {ct.so_luong} × {Number(ct.don_gia).toLocaleString()}₫
                                        </p>
                                        <strong>{Number(ct.thanh_tien).toLocaleString()}₫</strong>
                                    </div>

                                    {ct.bao_hanh && (
                                        <div className="text-muted small" style={{marginTop: 6}}>
                                            <div>
                                                <strong>Bảo hành:</strong> {ct.bao_hanh.policy?.bao_hanh_thang || 0} tháng
                                                {ct.bao_hanh.policy?.doi_moi_ngay ? ` • Đổi mới ${ct.bao_hanh.policy?.doi_moi_ngay} ngày` : ''}
                                            </div>
                                            <div>
                                                Bắt đầu: {new Date(ct.bao_hanh.ngay_bat_dau).toLocaleString()}
                                            </div>
                                            <div>
                                                Đổi mới đến: {new Date(ct.bao_hanh.doi_moi_den_ngay).toLocaleDateString()} • Bảo hành đến: {new Date(ct.bao_hanh.bao_hanh_den_ngay).toLocaleDateString()}
                                            </div>
                                            {ct.bao_hanh.policy?.mo_ta && (
                                                <div>Chính sách: {ct.bao_hanh.policy.mo_ta}</div>
                                            )}
                                        </div>
                                    )}

                                    {order.trang_thai === "Đã hoàn thành" && (
                                        <button
                                            className="review-btn"
                                            onClick={() => handleReview(ct.san_pham.ma_sp, ct.san_pham.ten_sp)}
                                        >
                                            ⭐ Đánh giá
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
