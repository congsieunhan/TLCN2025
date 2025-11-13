import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL, IMG_BASE_URL } from "../config";
import "./Checkout.css";

export default function CheckoutPage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const username = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('user'))?.ten_dang_nhap || null; } catch { return null; }
    }, []);
    const [addresses, setAddresses] = useState([]);
    const [addrOpen, setAddrOpen] = useState(false);
    const [selectedAddrId, setSelectedAddrId] = useState(null);
    const [payment, setPayment] = useState("Thanh toán khi nhận hàng");

    // Không return sớm để không vi phạm rules-of-hooks; dùng giá trị mặc định
    const { products = [], totalPrice = 0 } = state || {};
    const shippingFee = 1000;
    const grandTotal = totalPrice + shippingFee;

    // 📮 Load địa chỉ của khách hàng
    useEffect(() => {
        if (!username) return;
        fetch(`${API_BASE_URL}/address/?ten_dang_nhap=${username}`)
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                setAddresses(list);
                const def = list.find(x => x.mac_dinh) || list[0] || null;
                setSelectedAddrId(def ? def.id : null);
                if (list.length === 0) {
                    // Thông báo và chuyển sang trang thêm địa chỉ
                    alert('Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ trước.');
                    navigate('/account?tab=address');
                }
            })
            .catch(() => setAddresses([]));
    }, [username, navigate]);

    const selectedAddr = useMemo(() => addresses.find(a => a.id === selectedAddrId) || null, [addresses, selectedAddrId]);

    // 🧾 Gửi yêu cầu đặt hàng đến backend
    const handleOrder = async () => {
        setLoading(true);
        setMessage("");
    if (products && products.length > 0) {
        console.log("🧾 Kiểm tra sản phẩm đầu tiên:", products[0]);
    }

        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user) {
                setMessage('Vui lòng đăng nhập để đặt hàng');
                setLoading(false);
                navigate('/login');
                return;
            }
            if (!selectedAddr) {
                setMessage('Vui lòng chọn địa chỉ giao hàng');
                setLoading(false);
                return;
            }
            // Dữ liệu gửi đi
            const orderData = {
                khach_hang_id: user.ma_kh,
                dia_chi_giao: [selectedAddr.dia_chi_chi_tiet, selectedAddr.phuong_xa, selectedAddr.tinh_tp].filter(Boolean).join(', '),
                phuong_thuc_tt: payment,
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
                // Điều hướng sang trang Đơn hàng của tôi
                navigate("/orders");
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
                {selectedAddr ? (
                    <div className="address-box">
                        <div className="address-info">
                            <strong>{selectedAddr.ho_ten}</strong> <span>{selectedAddr.sdt}</span>
                        </div>
                        <p>
                            {[selectedAddr.dia_chi_chi_tiet, selectedAddr.phuong_xa, selectedAddr.tinh_tp].filter(Boolean).join(', ')}{' '}
                            {selectedAddr.mac_dinh && <span className="tag-default">Mặc Định</span>}{' '}
                            <span className="link" onClick={()=> setAddrOpen(v=>!v)}>{addrOpen? 'Đóng' : 'Thay Đổi'}</span>
                        </p>
                        {addrOpen && (
                            <div className="address-picker">
                                {addresses.length === 0 ? (
                                    <div className="text-muted">Bạn chưa có địa chỉ nào. Vui lòng thêm trong Tài khoản » Địa chỉ.</div>
                                ) : (
                                    addresses.map(a => (
                                        <label key={a.id} className="addr-option">
                                            <input type="radio" name="addr" checked={selectedAddrId===a.id} onChange={()=> setSelectedAddrId(a.id)} />
                                            <div>
                                                <div className="addr-line"><strong>{a.ho_ten}</strong> <span className="ms-2">{a.sdt}</span> {a.mac_dinh && <span className="tag-default ms-2">Mặc Định</span>}</div>
                                                <div className="addr-line text-muted">{[a.dia_chi_chi_tiet, a.phuong_xa, a.tinh_tp].filter(Boolean).join(', ')}</div>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-muted">Đang tải hoặc chưa có địa chỉ. Vui lòng thêm trong Tài khoản » Địa chỉ.</div>
                )}
            </div>

            {/* Danh sách sản phẩm */}
            <div className="checkout-section product-section">
                <div className="product-header">
                    <span className="col-name">Sản phẩm</span>
                    <span className="col-price">Đơn giá</span>
                    <span className="col-qty">Số lượng</span>
                    <span className="col-total">Thành tiền</span>
                </div>

                {products.length === 0 ? (
                    <div className="text-muted" style={{padding: '12px 0'}}>Không có sản phẩm nào để thanh toán.</div>
                ) : products.map((item) => (
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

                        <div className="col-price">{Number(item.don_gia).toLocaleString()}₫</div>
                        <div className="col-qty">{item.so_luong}</div>
                        <div className="col-total">
                            {Number(item.thanh_tien).toLocaleString()}₫
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
                <div className="payment-methods">
                    {[
                        'Thanh toán khi nhận hàng',
                        'Chuyển khoản ngân hàng',
                        'Ví MoMo',
                        'Thẻ nội địa (ATM/NAPAS)',
                        'Thẻ quốc tế (Visa/Master)'
                    ].map(m => (
                        <button key={m}
                                type="button"
                                className={`pay-btn ${payment===m? 'active':''}`}
                                onClick={()=> setPayment(m)}>
                            {m}
                        </button>
                    ))}
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
