import React, { useEffect, useMemo, useState } from "react";
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
  const admin = useMemo(() => { try { return JSON.parse(localStorage.getItem('admin')) || null; } catch { return null; } }, []);
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState({ ten_sp: '', hang_sx: '', gia: 0, so_luong_ton: 0, thong_so: '', tinh_trang: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

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

  // Toast message auto hide (must be before any early returns)
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 2000);
    return () => clearTimeout(t);
  }, [msg]);

  const openAdminEdit = () => {
    if (!product) return;
    setEdit({
      ten_sp: product.ten_sp || '',
      hang_sx: product.hang_sx || '',
      gia: Number(product.gia || 0),
      so_luong_ton: Number(product.so_luong_ton || 0),
      thong_so: product.thong_so || '',
      tinh_trang: product.tinh_trang || '',
    });
    setEditOpen(true);
  };

  const saveAdminEdit = async () => {
    if (!admin) { alert('Chỉ admin mới chỉnh sửa sản phẩm'); return; }
    try {
      const res = await fetch(`${IMG_BASE_URL}/api/admin/products/${id}/`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ten_dang_nhap_admin: admin.ten_dang_nhap, ...edit, gia: Number(edit.gia), so_luong_ton: Number(edit.so_luong_ton) })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Lưu thất bại'); return; }
      setProduct(data);
      setEditOpen(false);
      setMsg('Đã lưu sản phẩm');
    } catch (e) { alert('Không thể kết nối'); }
  };

  const uploadImage = async () => {
    if (!admin) { alert('Chỉ admin mới thao tác'); return; }
    if (!file) { alert('Chọn một ảnh'); return; }
    try {
      const fd = new FormData();
      fd.append('ten_dang_nhap_admin', admin.ten_dang_nhap);
      fd.append('file', file);
      setUploading(true);
      const res = await fetch(`${IMG_BASE_URL}/api/admin/products/${id}/images/`, { method: 'POST', body: fd });
      const data = await res.json();
      setUploading(false);
      if (!res.ok) { alert(data.error || 'Upload thất bại'); return; }
      // Reload chi tiết
      axios.get(`${IMG_BASE_URL}/api/products/${id}/`).then(r => setProduct(r.data));
      setFile(null);
    } catch (e) {
      setUploading(false);
      alert('Không thể kết nối');
    }
  };

  const removeImage = async (imgId) => {
    if (!admin) { alert('Chỉ admin'); return; }
    if (!window.confirm('Xóa ảnh này?')) return;
    try {
      const res = await fetch(`${IMG_BASE_URL}/api/admin/products/${id}/images/${imgId}/`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ten_dang_nhap_admin: admin.ten_dang_nhap }) });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { alert(data.error || 'Xóa thất bại'); return; }
      axios.get(`${IMG_BASE_URL}/api/products/${id}/`).then(r => setProduct(r.data));
    } catch (e) { alert('Không thể kết nối'); }
  };

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
      {msg && (
        <div style={{position:'fixed', top:16, right:16, zIndex:2000}}>
          <div className="alert alert-success shadow-sm py-2 px-3 mb-0" role="alert">{msg}</div>
        </div>
      )}
      
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
          {admin && (
            <div className='card p-2 mt-2 text-start'>
              <div className='fw-semibold mb-2'>Quản lý ảnh</div>
              <div className='d-flex align-items-center gap-2'>
                <input type='file' className='form-control' onChange={e=> setFile(e.target.files?.[0] || null)} />
                <button className='btn btn-dark' onClick={uploadImage} disabled={uploading}>{uploading? 'Đang tải...':'Tải lên'}</button>
              </div>
              {product.hinh_anh_list?.length > 0 && (
                <div className='d-flex flex-wrap gap-2 mt-2'>
                  {product.hinh_anh_list.map(img => (
                    <div key={img.id} className='position-relative'>
                      <img src={`${IMG_BASE_URL}${img.hinh_anh}`} alt='' style={{width:72,height:72,objectFit:'cover',border:'1px solid #ddd',borderRadius:4}} />
                      <button className='btn btn-sm btn-danger position-absolute' style={{top:0,right:0}} onClick={()=> removeImage(img.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
            {admin && (
              <button className="back-btn" onClick={openAdminEdit}>✏️ Sửa sản phẩm</button>
            )}
          </div>
        </div>
      </div>

      {/* Admin edit modal (simple) */}
      {admin && editOpen && (
        <div className="modal fade show" style={{display:'block', background:'rgba(0,0,0,0.4)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Sửa sản phẩm</h5>
                <button className="btn-close" onClick={()=>setEditOpen(false)}></button>
              </div>
              <div className="modal-body">
                <div className='mb-2'>
                  <label className='form-label'>Tên</label>
                  <input className='form-control' value={edit.ten_sp} onChange={e=> setEdit({...edit, ten_sp: e.target.value})} />
                </div>
                <div className='mb-2'>
                  <label className='form-label'>Hãng</label>
                  <input className='form-control' value={edit.hang_sx} onChange={e=> setEdit({...edit, hang_sx: e.target.value})} />
                </div>
                <div className='mb-2'>
                  <label className='form-label'>Giá</label>
                  <input type='number' className='form-control' value={edit.gia} onChange={e=> setEdit({...edit, gia: e.target.value})} />
                </div>
                <div className='mb-2'>
                  <label className='form-label'>Số lượng tồn</label>
                  <input type='number' className='form-control' value={edit.so_luong_ton} onChange={e=> setEdit({...edit, so_luong_ton: e.target.value})} />
                </div>
                <div className='mb-2'>
                  <label className='form-label'>Tình trạng</label>
                  <input className='form-control' value={edit.tinh_trang} onChange={e=> setEdit({...edit, tinh_trang: e.target.value})} />
                </div>
                <div className='mb-2'>
                  <label className='form-label'>Thông số</label>
                  <textarea className='form-control' rows='4' value={edit.thong_so} onChange={e=> setEdit({...edit, thong_so: e.target.value})}></textarea>
                </div>
              </div>
              <div className='modal-footer'>
                <button className='btn btn-secondary' onClick={()=>setEditOpen(false)}>Đóng</button>
                <button className='btn btn-dark' onClick={saveAdminEdit}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <button
            className={activeTab === "warranty" ? "tab active" : "tab"}
            onClick={() => setActiveTab("warranty")}
          >
            Bảo hành
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

          {/* Chính sách bảo hành */}
          <div className={`tab-pane ${activeTab === "warranty" ? "active" : ""}`}>
            <h3>Chính sách bảo hành & đổi trả</h3>
            {product.bao_hanh ? (
              <ul className="product-details-list">
                <li>
                  <strong>Đổi mới trong {product.bao_hanh.doi_moi_ngay} ngày</strong> kể từ ngày mua nếu phát sinh lỗi do nhà sản xuất (cần biên bản xác nhận lỗi, sản phẩm còn nguyên IMEI/Serial, tem bảo hành).
                </li>
                <li>
                  <strong>Bảo hành chính hãng {product.bao_hanh.bao_hanh_thang} tháng</strong> tại hệ thống trung tâm bảo hành ủy quyền (điện thoại/máy chính). <strong>Phụ kiện</strong> chính hãng (pin, sạc, cáp) <strong>bảo hành 6 tháng</strong>.
                </li>
                <li>
                  <strong>Không áp dụng đổi trả</strong> với các lỗi do sử dụng: rơi vỡ, vào nước/ẩm, trầy xước, cháy nổ, tự ý can thiệp phần cứng/phần mềm hoặc dùng sai hướng dẫn.
                </li>
                <li>
                  <strong>Điều kiện áp dụng</strong>: còn tem/IMEI/serial, đầy đủ hộp & phụ kiện, hóa đơn/chứng từ mua hàng.
                </li>
                <li>
                  <strong>Thời gian xử lý bảo hành</strong>: dự kiến 3–7 ngày làm việc (phụ thuộc hãng và linh kiện).
                </li>
                <li>
                  <strong>Hỗ trợ tại cửa hàng</strong>: tiếp nhận sản phẩm và gửi hãng miễn phí; thông báo/tra cứu tình trạng qua điện thoại.
                </li>
                {product.bao_hanh.mo_ta && (
                  <li>
                    <strong>Ghi chú bổ sung:</strong> {product.bao_hanh.mo_ta}
                  </li>
                )}
              </ul>
            ) : (
              <div className="text-muted">Chính sách bảo hành đang được cập nhật.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
