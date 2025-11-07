import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./Detail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/products/${id}/`)
      .then((res) => {
        setProduct(res.data);
        if (res.data.hinh_anh_list?.length > 0) {
          setSelectedImage(`http://127.0.0.1:8000${res.data.hinh_anh_list[0].hinh_anh}`);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Lỗi khi load chi tiết sản phẩm:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="loading">Đang tải...</p>;
  if (!product) return <p>Không tìm thấy sản phẩm.</p>;

  return (
    <div className="product-detail-container">
      {/* Khối thông tin chính */}
      <div className="main-info">
        <div className="product-images">
          <img src={selectedImage} alt={product.ten_sp} className="main-image" />
          <div className="thumbnail-container">
            {product.hinh_anh_list?.map((img) => (
              <img
                key={img.id}
                src={`http://127.0.0.1:8000${img.hinh_anh}`}
                alt={img.mo_ta}
                className={`thumbnail ${selectedImage === `http://127.0.0.1:8000${img.hinh_anh}` ? "active" : ""}`}
                onClick={() =>
                  setSelectedImage(`http://127.0.0.1:8000${img.hinh_anh}`)
                }
              />
            ))}
          </div>
        </div>

        <div className="product-info">
          <h2>{product.ten_sp}</h2>
          <p className="brand">Hãng: {product.hang_sx}</p>
          <p className="price">{Number(product.gia).toLocaleString()} đ</p>
          <p className="status">Tình trạng: {product.tinh_trang}</p>
          <p className="stock">Còn lại: {product.so_luong_ton}</p>
          <p className="storage">{product.thong_so}</p>

          <div className="actions">
            <button className="add-to-cart">🛒 Thêm vào giỏ hàng</button>
            <Link to="/" className="back-btn">⬅️ Quay lại cửa hàng</Link>
          </div>
        </div>
      </div>

      {/* Phần tab nội dung ở dưới */}
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
          <div className={`tab-pane ${activeTab === "details" ? "active" : ""}`}>
            <h3>Thông tin chi tiết</h3>
            <ul className="product-details-list">
              <li><strong>Màn hình:</strong> 6.7 inch Super Retina XDR, tần số quét 120Hz</li>
              <li><strong>Camera:</strong> 48MP (chính), 12MP (ultra wide), 12MP (telephoto)</li>
              <li><strong>Chip:</strong> Apple A17 Pro, 6 nhân CPU, GPU 6 nhân</li>
              <li><strong>RAM & Bộ nhớ:</strong> 8GB RAM, 256GB ROM</li>
              <li><strong>Pin & Sạc:</strong> 4422 mAh, sạc nhanh 20W, hỗ trợ sạc không dây MagSafe</li>
            </ul>
          </div>

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
