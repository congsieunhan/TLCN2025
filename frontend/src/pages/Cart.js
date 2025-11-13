// import React, { useEffect, useState } from "react";
// import "./Cart.css";
// import { useNavigate } from "react-router-dom";

// export default function CartPage() {
//   const [cartItems, setCartItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedItems, setSelectedItems] = useState([]);
//   const navigate = useNavigate();

//   // 🧭 Lấy dữ liệu giỏ hàng
//   const fetchCart = async () => {
//     try {
//       const res = await fetch(
//         "http://localhost:8000/api/giohang/?ten_dang_nhap=vana",
//         {
//           headers: { Accept: "application/json" },
//         }
//       );
//       const data = await res.json();
//       setCartItems(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("Fetch error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCart();
//   }, []);

//   // 🗑 Xóa sản phẩm khỏi giỏ hàng
//   const handleDelete = async (cartItemId, ma_sp) => {
//     if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) return;

//     try {
//       const res = await fetch("http://localhost:8000/api/giohang/", {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ ten_dang_nhap: "vana", ma_sp }),
//       });
//       const result = await res.json();

//       if (res.ok) {
//         alert(result.message || "Đã xóa sản phẩm");
//         fetchCart();
//         setSelectedItems((prev) => prev.filter((x) => x !== cartItemId));
//       } else {
//         alert(result.error || "Lỗi khi xóa sản phẩm");
//       }
//     } catch (error) {
//       console.error("Delete error:", error);
//     }
//   };

//   // 🔢 Tăng giảm số lượng
//   const handleQuantityChange = (index, delta) => {
//     setCartItems((prev) => {
//       const updated = [...prev];
//       const newQty = Math.max(1, updated[index].so_luong + delta);
//       updated[index].so_luong = newQty;
//       return updated;
//     });
//   };

//   // ✅ Chọn từng sản phẩm
//   const handleSelect = (cartItemId) => {
//     setSelectedItems((prev) =>
//       prev.includes(cartItemId)
//         ? prev.filter((x) => x !== cartItemId)
//         : [...prev, cartItemId]
//     );
//   };

//   // ✅ Chọn tất cả
//   const handleSelectAll = (checked) => {
//     if (checked) {
//       setSelectedItems(cartItems.map((item) => item.id));
//     } else {
//       setSelectedItems([]);
//     }
//   };

//   // 💰 Tính tổng tiền các sản phẩm được chọn
//   const total = cartItems.reduce((sum, item) => {
//     const giaGoc = parseFloat(item.san_pham.gia);
//     const giam = item.san_pham.giam_phan_tram || 0;
//     const giaSauGiam = giaGoc * (1 - giam / 100);
//     return selectedItems.includes(item.id)
//       ? sum + item.so_luong * giaSauGiam
//       : sum;
//   }, 0);

//   // 🛒 Xử lý khi ấn "Mua hàng"
//   const handleCheckout = () => {
//     if (selectedItems.length === 0) {
//       alert("Vui lòng chọn ít nhất một sản phẩm để mua!");
//       return;
//     }

//     const selectedProducts = cartItems
//       .filter((item) => selectedItems.includes(item.id))
//       .map((item) => {
//         const giaGoc = parseFloat(item.san_pham.gia);
//         const giam = item.san_pham.giam_phan_tram || 0;
//         const giaSauGiam = giaGoc * (1 - giam / 100);

//         return {
//           id: item.san_pham.ma_sp, // ✅ Lấy mã sản phẩm thật từ API
//           ten_sp: item.san_pham.ten_sp,
//           hinh_anh: item.san_pham.hinh_anh_list[0]?.hinh_anh,
//           so_luong: item.so_luong,
//           don_gia: giaSauGiam,
//           thanh_tien: giaSauGiam * item.so_luong,
//         };
//       });

//     navigate("/checkout", {
//       state: {
//         products: selectedProducts,
//         totalPrice: total,
//       },
//     });
//   };

//   if (loading) return <div className="loading">Đang tải giỏ hàng...</div>;

//   return (
//     <div className="cart-container">
//       {/* Header */}
//       <div className="cart-header-row">
//         <input
//           type="checkbox"
//           checked={selectedItems.length === cartItems.length && cartItems.length > 0}
//           onChange={(e) => handleSelectAll(e.target.checked)}
//         />
//         <span>Sản Phẩm</span>
//         <span>Đơn Giá</span>
//         <span>Số Lượng</span>
//         <span>Số Tiền</span>
//         <span>Thao Tác</span>
//       </div>

//       {/* Danh sách sản phẩm */}
//       <div className="shop-section">
//         <div className="shop-header">
//           <span className="shop-name">🛍️ Cửa hàng của bạn</span>
//           <span className="fav-tag">Yêu thích</span>
//         </div>

//         {cartItems.map((item, i) => {
//           const giaGoc = parseFloat(item.san_pham.gia);
//           const giam = item.san_pham.giam_phan_tram || 0;
//           const giaSauGiam = giaGoc * (1 - giam / 100);
//           const selected = selectedItems.includes(item.id);

//           return (
//             <div key={item.id || i} className="cart-item-row">
//               <input
//                 type="checkbox"
//                 checked={selected}
//                 onChange={() => handleSelect(item.id)}
//               />

//               <div className="cart-item">
//                 <img
//                   src={`http://127.0.0.1:8000${item.san_pham.hinh_anh_list[0]?.hinh_anh}`}
//                   alt={item.san_pham.ten_sp}
//                 />
//                 <div className="item-info">
//                   <div className="item-title">{item.san_pham.ten_sp}</div>
//                   <div className="item-variant">Phân loại: Ngẫu nhiên</div>
//                 </div>
//               </div>

//               <div className="item-price">
//                 <span className="old">{giaGoc.toLocaleString()}₫</span>
//                 <span className="new">{giaSauGiam.toLocaleString()}₫</span>
//               </div>

//               <div className="item-quantity">
//                 <button onClick={() => handleQuantityChange(i, -1)}>-</button>
//                 <input type="text" value={item.so_luong} readOnly />
//                 <button onClick={() => handleQuantityChange(i, 1)}>+</button>
//               </div>

//               <div className="item-total">
//                 {(giaSauGiam * item.so_luong).toLocaleString()}₫
//               </div>

//               <div className="item-action">
//                 <button
//                   className="delete-btn"
//                   onClick={() => handleDelete(item.id, item.san_pham.ma_sp)}
//                 >
//                   Xóa
//                 </button>
//                 <div className="find-similar">Tìm tương tự</div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Voucher */}
//       <div className="voucher-section">
//         <div>
//           🎟️ Voucher giảm đến 10k{" "}
//           <span className="link">Xem thêm voucher</span>
//         </div>
//         <div>
//           🚚 Giảm 500.000₫ phí vận chuyển đơn tối thiểu 0₫{" "}
//           <span className="link">Tìm hiểu thêm</span>
//         </div>
//       </div>

//       {/* Thanh tổng tiền */}
//       <div className="checkout-bar">
//         <div className="left">
//           <input
//             type="checkbox"
//             checked={selectedItems.length === cartItems.length && cartItems.length > 0}
//             onChange={(e) => handleSelectAll(e.target.checked)}
//           />
//           <span>Chọn tất cả ({cartItems.length})</span>
//           <span className="link">Xóa</span>
//           <span className="link">Lưu vào mục yêu thích</span>
//         </div>
//         <div className="right">
//           <span>Tổng cộng ({selectedItems.length} sản phẩm): </span>
//           <strong>{total.toLocaleString()}₫</strong>
//           <button
//             className={`checkout-btn ${selectedItems.length > 0 ? "black" : ""}`}
//             onClick={handleCheckout}
//           >
//             Mua Hàng
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState, useCallback } from "react";
import "./Cart.css";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, IMG_BASE_URL, IMG_PLACEHOLDER_SMALL as IMG_PLACEHOLDER } from "../config";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  // 🧭 Lấy thông tin user từ localStorage
  const getCurrentUser = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  };

  // 🧭 Lấy dữ liệu giỏ hàng
  const fetchCart = useCallback(async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('Vui lòng đăng nhập để xem giỏ hàng');
        navigate('/login');
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/giohang/?ten_dang_nhap=${currentUser.ten_dang_nhap}`,
        {
          headers: { Accept: "application/json" },
        }
      );
      
      if (!res.ok) {
        throw new Error('Không thể lấy giỏ hàng');
      }
      
      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.message.includes('401')) {
        alert('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 🗑 Xóa sản phẩm khỏi giỏ hàng
  const handleDelete = async (cartItemId, ma_sp) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) return;

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('Vui lòng đăng nhập');
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/giohang/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ten_dang_nhap: currentUser.ten_dang_nhap, 
          ma_sp: ma_sp 
        }),
      });
      
      const result = await res.json();

      if (res.ok) {
        alert(result.message || "Đã xóa sản phẩm");
        fetchCart();
        setSelectedItems((prev) => prev.filter((x) => x !== ma_sp));
      } else {
        alert(result.error || "Lỗi khi xóa sản phẩm");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // 🔢 Tăng giảm số lượng - CẬP NHẬT LÊN SERVER
  const handleQuantityChange = async (index, delta) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert('Vui lòng đăng nhập');
      navigate('/login');
      return;
    }

    const updatedItems = [...cartItems];
    const newQty = Math.max(1, updatedItems[index].so_luong + delta);
    
    // Cập nhật UI trước
    updatedItems[index].so_luong = newQty;
    setCartItems(updatedItems);

    try {
      // Gọi API để cập nhật số lượng trên server
      const res = await fetch(`${API_BASE_URL}/giohang/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ten_dang_nhap: currentUser.ten_dang_nhap,
          ma_sp: updatedItems[index].san_pham.ma_sp,
          so_luong: delta // Gửi số lượng thay đổi
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Lỗi cập nhật số lượng');
      }
    } catch (error) {
      console.error("Update quantity error:", error);
      // Rollback UI nếu có lỗi
      updatedItems[index].so_luong = updatedItems[index].so_luong - delta;
      setCartItems([...updatedItems]);
      alert('Có lỗi khi cập nhật số lượng');
    }
  };

  // ✅ Chọn từng sản phẩm (theo mã sản phẩm để duy nhất)
  const handleSelect = (ma_sp) => {
    setSelectedItems((prev) =>
      prev.includes(ma_sp)
        ? prev.filter((x) => x !== ma_sp)
        : [...prev, ma_sp]
    );
  };

  // ✅ Chọn tất cả
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(cartItems.map((item) => item.san_pham.ma_sp));
    } else {
      setSelectedItems([]);
    }
  };

  // 💰 Tính tổng tiền các sản phẩm được chọn
  const total = cartItems.reduce((sum, item) => {
    const giaGoc = parseFloat(item.san_pham.gia);
    const giam = item.san_pham.giam_phan_tram || 0;
    const giaSauGiam = giaGoc * (1 - giam / 100);
    return selectedItems.includes(item.san_pham.ma_sp)
      ? sum + item.so_luong * giaSauGiam
      : sum;
  }, 0);

  // 🛒 Xử lý khi ấn "Mua hàng"
  const handleCheckout = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert('Vui lòng đăng nhập để mua hàng');
      navigate('/login');
      return;
    }

    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để mua!");
      return;
    }

    const selectedProducts = cartItems
      .filter((item) => selectedItems.includes(item.san_pham.ma_sp))
      .map((item) => {
        const giaGoc = parseFloat(item.san_pham.gia);
        const giam = item.san_pham.giam_phan_tram || 0;
        const giaSauGiam = giaGoc * (1 - giam / 100);

        return {
          id: item.san_pham.ma_sp,
          ten_sp: item.san_pham.ten_sp,
          hinh_anh: item.san_pham.hinh_anh_list[0]?.hinh_anh,
          so_luong: item.so_luong,
          don_gia: giaSauGiam,
          thanh_tien: giaSauGiam * item.so_luong,
        };
      });

    navigate("/checkout", {
      state: {
        products: selectedProducts,
        totalPrice: total,
        user: currentUser
      },
    });
  };

  if (loading) return <div className="loading">Đang tải giỏ hàng...</div>;

  return (
    <div className="cart-container">
      {/* Header */}
      <div className="cart-header-row">
        <input
          type="checkbox"
          checked={selectedItems.length === cartItems.length && cartItems.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
        <span>Sản Phẩm</span>
        <span>Đơn Giá</span>
        <span>Số Lượng</span>
        <span>Số Tiền</span>
        <span>Thao Tác</span>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="shop-section">
        <div className="shop-header">
          <span className="shop-name">🛍️ Cửa hàng của bạn</span>
          <span className="fav-tag">Yêu thích</span>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            Giỏ hàng của bạn đang trống
          </div>
        ) : (
          cartItems.map((item, i) => {
            const giaGoc = parseFloat(item.san_pham.gia);
            const giam = item.san_pham.giam_phan_tram || 0;
            const giaSauGiam = giaGoc * (1 - giam / 100);
            const selected = selectedItems.includes(item.san_pham.ma_sp);

            return (
          <div key={item.san_pham.ma_sp || i} className="cart-item-row">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => handleSelect(item.san_pham.ma_sp)}
            />

                <div className="cart-item">
                  <img
                    src={`${IMG_BASE_URL}${item.san_pham.hinh_anh_list[0]?.hinh_anh}`}
                    alt={item.san_pham.ten_sp}
                    onError={(e) => {
                      if (e.target.src !== IMG_PLACEHOLDER) e.target.src = IMG_PLACEHOLDER;
                    }}
                  />
                  <div className="item-info">
                    <div className="item-title">{item.san_pham.ten_sp}</div>
                    <div className="item-variant">Phân loại: Ngẫu nhiên</div>
                  </div>
                </div>

                <div className="item-price">
                  {giam > 0 && (
                    <span className="old">{giaGoc.toLocaleString()}₫</span>
                  )}
                  <span className="new">{giaSauGiam.toLocaleString()}₫</span>
                </div>

                <div className="item-quantity">
                  <button 
                    onClick={() => handleQuantityChange(i, -1)}
                    disabled={item.so_luong <= 1}
                  >
                    -
                  </button>
                  <input type="text" value={item.so_luong} readOnly />
                  <button onClick={() => handleQuantityChange(i, 1)}>+</button>
                </div>

                <div className="item-total">
                  {(giaSauGiam * item.so_luong).toLocaleString()}₫
                </div>

                <div className="item-action">
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(item.id, item.san_pham.ma_sp)}
                  >
                    Xóa
                  </button>
                  <div className="find-similar">Tìm tương tự</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Voucher */}
      {cartItems.length > 0 && (
        <>
          <div className="voucher-section">
            <div>
              🎟️ Voucher giảm đến 10k{" "}
              <span className="link">Xem thêm voucher</span>
            </div>
            <div>
              🚚 Giảm 500.000₫ phí vận chuyển đơn tối thiểu 0₫{" "}
              <span className="link">Tìm hiểu thêm</span>
            </div>
          </div>

          {/* Thanh tổng tiền */}
          <div className="checkout-bar">
            <div className="left">
              <input
                type="checkbox"
                checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span>Chọn tất cả ({cartItems.length})</span>
              <span className="link">Xóa</span>
              <span className="link">Lưu vào mục yêu thích</span>
            </div>
            <div className="right">
              <span>Tổng cộng ({selectedItems.length} sản phẩm): </span>
              <strong>{total.toLocaleString()}₫</strong>
              <button
                className={`checkout-btn ${selectedItems.length > 0 ? "black" : ""}`}
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
              >
                Mua Hàng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
