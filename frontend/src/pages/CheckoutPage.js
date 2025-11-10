import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL, IMG_BASE_URL } from "../config";
import "./Checkout.css";

export default function CheckoutPage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    if (!state || !state.products) {
        return <div>Không có sản phẩm nào để thanh toán.</div>;
    }

    const { products, totalPrice } = state;
    const shippingFee = 1000;
    const grandTotal = totalPrice + shippingFee;

    // 🧾 Gửi yêu cầu đặt hàng đến backend
    const handleOrder = async () => {
        setLoading(true);
        setMessage("");
    console.log("🧾 Kiểm tra sản phẩm đầu tiên:", products[0]);

        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user) {
                setMessage('Vui lòng đăng nhập để đặt hàng');
                setLoading(false);
                navigate('/login');
                return;
            }
            // Dữ liệu gửi đi
            const orderData = {
                khach_hang_id: user.ma_kh,
                dia_chi_giao: user.dia_chi || "Chợ Long Điền, Huyện Long Điền, Bà Rịa - Vũng Tàu",
                phuong_thuc_tt: "Thanh toán khi nhận hàng",
                products: products.map((item) => ({
                    ma_sp: item.id,
                    so_luong: item.so_luong,
                    don_gia: item.don_gia,
                })),
            };
            console.log("📦 Dữ liệu gửi đi:", orderData); 
            const response = await fetch(`${API_BASE_URL}/dathang/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage("🎉 Đặt hàng thành công! Mã đơn: " + data.ma_don_hang);
                // Có thể chuyển hướng sau vài giây
                setTimeout(() => navigate("/"), 2000);
            } else {
                setMessage("❌ Lỗi khi đặt hàng: " + (data.error || "Không xác định"));
            }
        } catch (error) {
            console.error("Lỗi đặt hàng:", error);
            setMessage("❌ Kết nối thất bại tới máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout-container">
            {/* Địa chỉ nhận hàng */}
            <div className="checkout-section address-section">
                <h3 className="section-title">📍 Địa Chỉ Nhận Hàng</h3>
                <div className="address-box">
                    <div className="address-info">
                        <strong>cong hoang</strong> <span>(+84) 365 807 229</span>
                    </div>
                    <p>
                        Chợ Long Điền, Khu Phố Long Phượng, Thị Trấn Long Điền, Huyện Long
                        Điền, Bà Rịa - Vũng Tàu{" "}
                        <span className="tag-default">Mặc Định</span>{" "}
                        <span className="link">Thay Đổi</span>
                    </p>
                </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="checkout-section product-section">
                <div className="product-header">
                    <span className="col-name">Sản phẩm</span>
                    <span className="col-price">Đơn giá</span>
                    <span className="col-qty">Số lượng</span>
                    <span className="col-total">Thành tiền</span>
                </div>

                {products.map((item) => (
                    <div key={item.id} className="checkout-item">
                        <div className="item-info">
                            <img
                                src={`${IMG_BASE_URL}${item.hinh_anh}`}
                                alt={item.ten_sp}
                                className="item-img"
                            />
                            <div className="item-detail">
                                <div className="shop-row">
                                    <span className="fav-tag">Yêu thích</span>
                                    <span className="shop-name">Junmall Chai nhựa đẹp</span>
                                    <span className="chat">💬 Chat ngay</span>
                                </div>
                                <p className="product-title">
                                    {item.ten_sp}{" "}
                                    <span className="variant">Phân loại: NẮP NHỰA ĐEN</span>
                                </p>
                            </div>
                        </div>

                        <div className="col-price">{item.don_gia.toLocaleString()}₫</div>
                        <div className="col-qty">{item.so_luong}</div>
                        <div className="col-total">
                            {item.thanh_tien.toLocaleString()}₫
                        </div>
                    </div>
                ))}

                {/* Bảo hiểm sản phẩm */}
                <div className="insurance-box">
                    <input type="checkbox" />
                    <span>
                        Bảo hiểm Thiệt hại sản phẩm{" "}
                        <span className="link">Tìm hiểu thêm</span>
                    </span>
                    <span className="insurance-price">289₫ x2 = 578₫</span>
                </div>

                {/* Phương thức vận chuyển */}
                <div className="shipping-box">
                    <div>
                        Phương thức vận chuyển: <strong>Nhanh</strong>
                    </div>
                    <div className="shipping-detail">
                        🚚 Nhận từ 10 Th11 - 11 Th11{" "}
                        <span className="link">Thay đổi</span>
                        <span className="shipping-fee">1.000₫</span>
                    </div>
                </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="checkout-section payment-section">
                <h4>Phương thức thanh toán</h4>
                <div className="payment-method">
                    <button className="payment-selected">Thanh toán khi nhận hàng</button>
                </div>
            </div>

            {/* Tổng kết thanh toán */}
            <div className="checkout-section total-section">
                <div className="summary-row">
                    <span>Tổng tiền hàng:</span>
                    <strong>{totalPrice.toLocaleString()}₫</strong>
                </div>
                <div className="summary-row">
                    <span>Tổng tiền phí vận chuyển:</span>
                    <strong>{shippingFee.toLocaleString()}₫</strong>
                </div>
                <div className="summary-row total">
                    <span>Tổng thanh toán:</span>
                    <strong className="total-price">{grandTotal.toLocaleString()}₫</strong>
                </div>

                <div className="checkout-actions">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        ← Quay lại giỏ hàng
                    </button>
                    <button
                        className="confirm-btn"
                        onClick={handleOrder}
                        disabled={loading}
                    >
                        {loading ? "⏳ Đang xử lý..." : "Đặt hàng"}
                    </button>
                </div>

                {/* Hiển thị kết quả */}
                {message && <p className="order-message">{message}</p>}
            </div>
        </div>
    );
}
