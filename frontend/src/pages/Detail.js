import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./Detail.css";
import { API_BASE_URL, IMG_BASE_URL, IMG_PLACEHOLDER_LARGE as IMG_PLACEHOLDER } from "../config";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(IMG_PLACEHOLDER);
  const [activeTab, setActiveTab] = useState("details"); // Dữ liệu tab

  useEffect(() => {
    axios
      .get(`${IMG_BASE_URL}/api/products/${id}/`)
      .then((res) => {
        setProduct(res.data);
        
        // Thiết lập ảnh chính và xử lý URL
        const firstImage = res.data.hinh_anh_list?.[0]?.hinh_anh;
        const url = firstImage ? `${IMG_BASE_URL}${firstImage}` : IMG_PLACEHOLDER;
        setSelectedImage(url);
        
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Lỗi khi load chi tiết sản phẩm:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="loading">Đang tải...</p>;
  if (!product) return <p className="not-found">Không tìm thấy sản phẩm.</p>;

  // Hàm xử lý lỗi ảnh
  const handleImageError = (e) => {
    if (e.target.src !== IMG_PLACEHOLDER) {
      e.target.src = IMG_PLACEHOLDER;
    }
  };
  
  // Hàm thêm vào giỏ hàng
  const handleAddToCart = () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) {
        alert('Vui lòng đăng nhập trước khi thêm giỏ hàng');
        return;
      }
      axios.post(`${API_BASE_URL}/giohang/`, {
        ten_dang_nhap: user.ten_dang_nhap,
        ma_sp: Number(id),
        so_luong: 1,
      }).then(() => {
        alert(`Đã thêm sản phẩm: ${product.ten_sp} vào giỏ hàng!`);
      }).catch((err) => {
        const msg = err?.response?.data?.error || 'Không thể thêm vào giỏ hàng';
        alert(msg);
      });
    } catch (e) {
      alert('Lỗi không xác định khi thêm giỏ hàng');
    }
  }

  return (
    <div className="product-detail-container">
      
      {/* 📍 Khối thông tin chính: Ảnh và Chi tiết */}
      <div className="main-info">
        <div className="product-images">
          <img 
            src={selectedImage} 
            alt={product.ten_sp} 
            className="main-image" 
            onError={handleImageError} // Xử lý lỗi ảnh chính
          />
          <div className="thumbnail-container">
            {product.hinh_anh_list?.map((img) => (
              <img
                key={img.id}
                src={`${IMG_BASE_URL}${img.hinh_anh}`}
                alt={img.mo_ta}
                className={`thumbnail ${selectedImage === `${IMG_BASE_URL}${img.hinh_anh}` ? "active" : ""}`}
                onClick={() =>
                  setSelectedImage(`${IMG_BASE_URL}${img.hinh_anh}`)
                }
                onError={handleImageError} // Xử lý lỗi ảnh thumbnail
              />
            ))}
          </div>
        </div>

        <div className="product-info">
          <h2>{product.ten_sp}</h2>
          <p className="brand">Hãng: <strong>{product.hang_sx}</strong></p>
          <p className="price">{Number(product.gia).toLocaleString()} đ</p>
          <p className="status">Tình trạng: <strong>{product.tinh_trang}</strong></p>
          <p className="stock">Còn lại: <strong>{product.so_luong_ton}</strong></p>
          <p className="storage">Thông số: <em>{product.thong_so || "Đang cập nhật"}</em></p>

          <div className="actions">
            <button 
                className="add-to-cart" 
                onClick={handleAddToCart}
                disabled={product.so_luong_ton <= 0}
            >
                🛒 Thêm vào giỏ hàng
            </button>
            <Link to="/shop" className="back-btn">⬅️ Quay lại cửa hàng</Link>
          </div>
        </div>
      </div>

      {/* 📍 Phần tab nội dung ở dưới */}
      <div className="tabs-section">
        <div className="tabs">
          <button
            className={activeTab === "details" ? "tab active" : "tab"}
            onClick={() => setActiveTab("details")}
          >
            Thông tin chi tiết
          </button>
          <button
            className={activeTab === "reviews" ? "tab active" : "tab"}
            onClick={() => setActiveTab("reviews")}
          >
            Đánh giá
          </button>
        </div>

        <div className="tab-content">
          {/* Thông tin chi tiết */}
          <div className={`tab-pane ${activeTab === "details" ? "active" : ""}`}>
            <h3>Thông số kỹ thuật</h3>
            {/* Đây là dữ liệu giả lập, bạn nên thay thế bằng dữ liệu từ API */}
            <ul className="product-details-list">
              <li><strong>Màn hình:</strong> 6.7 inch Super Retina XDR, tần số quét 120Hz</li>
              <li><strong>Camera:</strong> 48MP (chính), 12MP (ultra wide), 12MP (telephoto)</li>
              <li><strong>Chip:</strong> Apple A17 Pro, 6 nhân CPU, GPU 6 nhân</li>
              <li><strong>RAM & Bộ nhớ:</strong> 8GB RAM, 256GB ROM</li>
              <li><strong>Pin & Sạc:</strong> 4422 mAh, sạc nhanh 20W, hỗ trợ sạc không dây MagSafe</li>
            </ul>
          </div>

          {/* Đánh giá */}
          <div className={`tab-pane ${activeTab === "reviews" ? "active" : ""}`}>
            <h3>Đánh giá sản phẩm</h3>
            <p>Hiện chưa có đánh giá nào cho sản phẩm này.</p>
            <button className="review-btn">✍️ Viết đánh giá</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
