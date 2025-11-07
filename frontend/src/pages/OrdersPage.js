import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./OrdersPage.css";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const tenDangNhap = "vana"; // 🧍 Thay bằng tên tài khoản đăng nhập thực tế

    // 📦 Lấy danh sách đơn hàng từ backend
    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/donhang/?ten_dang_nhap=${tenDangNhap}`)
            .then((res) => res.json())
            .then((data) => {
                setOrders(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Lỗi khi tải đơn hàng:", err);
                setLoading(false);
            });
    }, []);

    // 💬 Hàm xử lý đánh giá từng sản phẩm
    const handleReview = async (ma_sp, ten_sp) => {
        const so_sao = prompt(`🌟 Bạn chấm bao nhiêu sao cho "${ten_sp}" (1-5)?`);
        if (!so_sao || isNaN(so_sao) || so_sao < 1 || so_sao > 5) {
            alert("Số sao không hợp lệ!");
            return;
        }

        const noi_dung = prompt("📝 Nhập nội dung đánh giá của bạn (tuỳ chọn):");

        try {
            const res = await fetch("http://127.0.0.1:8000/api/danh-gia/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ten_dang_nhap: tenDangNhap,
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

                    {/* Chi tiết sản phẩm trong đơn */}
                    <div className="order-products">
                        {order.chi_tiet.map((ct, i) => (
                            <div key={i} className="product-item">
                                <img
                                    src={`http://127.0.0.1:8000${ct.san_pham.hinh_anh}`}
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

                                    {order.trang_thai === "Đã hoàn thành" && (
                                        <button
                                            className="review-btn"
                                            onClick={() =>
                                                handleReview(ct.san_pham.ma_sp, ct.san_pham.ten_sp)
                                            }
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
