import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Pagination } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./Shop.css"; // Đảm bảo đã import CSS
import { API_BASE_URL, IMG_BASE_URL, IMG_PLACEHOLDER_SMALL as IMG_PLACEHOLDER } from "../config";


export default function Shop() {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState([]);
  const [storageFilter, setStorageFilter] = useState([]);
  // Giữ nguyên dải giá lớn nhất 100M VND
  const [priceRange, setPriceRange] = useState([0, 100000000]); 
  const [currentPage, setCurrentPage] = useState(1);
  // const [message, setMessage] = useState(""); 

  // Sử dụng giá trị itemsPerPage = 6 để phù hợp với bố cục 3 cột (row-cols-md-3)
  const itemsPerPage = 6; 

  // Lấy thông tin user hiện tại (chỉ chạy 1 lần)
  const currentUser = (() => { 
    try { 
      return JSON.parse(localStorage.getItem("user")); 
    } catch { 
      return null; 
    } 
  })();

  // 🛒 Hàm thêm vào giỏ hàng
  function themVaoGioHang(ma_sp) {
    const user = currentUser; 
    if (!user) {
      // Thay thế alert bằng custom modal trong production
      alert("Vui lòng đăng nhập trước khi thêm giỏ hàng");
      return;
    }
    axios
      .post(`${API_BASE_URL}/giohang/`, {
        ten_dang_nhap: user.ten_dang_nhap,
        ma_sp: ma_sp,
        so_luong: 1, // Mặc định thêm 1 sản phẩm
      })
      .then((response) => {
        console.log("✅ Thêm vào giỏ hàng thành công:", response.data);
        alert("✅ Đã thêm vào giỏ hàng!");
        // Có thể cần fetch lại giỏ hàng nếu badge giỏ hàng cần cập nhật
      })
      .catch((error) => {
        console.error("❌ Lỗi khi thêm vào giỏ hàng:", error);
        if (error.response) {
          const errMsg = error.response.data.error || JSON.stringify(error.response.data);
          alert(`Lỗi từ server: ${errMsg}`);
        } else {
          alert("Lỗi kết nối hoặc lỗi không xác định!");
        }
      });
  }

  // 📦 Gọi API lấy danh sách sản phẩm
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/products/`)
      .then((res) => {
        const data = res.data.map((p) => {
          const firstImage =
            Array.isArray(p.hinh_anh_list) && p.hinh_anh_list.length > 0
              ? p.hinh_anh_list[0].hinh_anh
              : "";

          const imgUrl = firstImage
            ? (firstImage.startsWith("http") ? firstImage : `${IMG_BASE_URL}${firstImage}`)
            : IMG_PLACEHOLDER; 

          return {
            id: p.ma_sp,
            name: p.ten_sp,
            brand: p.hang_sx,
            price: Number(p.gia),
            img: imgUrl,
            storage: p.thong_so,
            quantity: p.so_luong_ton || 0, // ✅ Đảm bảo có số lượng tồn
          };
        });
        
        setPhones(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Lỗi khi gọi API:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ⚙️ Bộ lọc (Đã thêm reset currentPage)
  const toggleFilter = (filter, setFilter, value) => {
    setFilter((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
    setCurrentPage(1);
  };

  // 🔍 Lọc sản phẩm
  const filteredPhones = phones.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (brandFilter.length === 0 || brandFilter.includes(p.brand)) &&
      (storageFilter.length === 0 || (p.storage && storageFilter.includes(p.storage))) &&
      p.price >= priceRange[0] &&
      p.price <= priceRange[1]
  );

  // 📄 Phân trang
  const totalPages = Math.ceil(filteredPhones.length / itemsPerPage);
  const paginatedPhones = filteredPhones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- Kiểm tra trạng thái tải ---
  if (loading) return <p className="text-center mt-5">Đang tải dữ liệu...</p>;
  if (error) return <p className="text-center text-danger mt-5">Lỗi: {error}</p>;

  // --- JSX Rendering ---
  return (
    <div className="container-fluid mt-5 pt-3">
      <div className="row">
        
        {/* Sidebar lọc */}
        <div className="col-md-3">
          <div className="card p-3 shadow-sm">
            <h5>Bộ lọc</h5>

            <input
              type="text"
              className="form-control mb-3"
              placeholder="Tìm điện thoại..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
              }}
            />

            <h6>Hãng</h6>
            {["Apple", "Samsung", "Xiaomi", "OPPO"].map((b) => (
              <div className="form-check" key={b}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={brandFilter.includes(b)}
                  onChange={() => toggleFilter(brandFilter, setBrandFilter, b)}
                  id={b}
                />
                <label className="form-check-label" htmlFor={b}>
                  {b}
                </label>
              </div>
            ))}

            <h6 className="mt-3">Bộ nhớ</h6>
            {/* Lọc bộ nhớ */}
            {["128GB", "256GB", "512GB"].map((s) => (
              <div className="form-check" key={s}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={storageFilter.includes(s)}
                  onChange={() => toggleFilter(storageFilter, setStorageFilter, s)}
                  id={s}
                />
                <label className="form-check-label" htmlFor={s}>
                  {s}
                </label>
              </div>
            ))}

            <h6 className="mt-3">Khoảng giá</h6>
            <input
              type="range"
              className="form-range"
              min="0"
              max="100000000"
              step="1000000"
              value={priceRange[1]}
              onChange={(e) => {
                setPriceRange([0, Number(e.target.value)]);
                setCurrentPage(1); // Reset về trang 1 khi thay đổi giá
              }}
            />
            <p>
              {priceRange[0].toLocaleString("vi-VN")}đ -{" "}
              {priceRange[1].toLocaleString("vi-VN")}đ
            </p>

            <button
              className="btn btn-dark w-100"
              onClick={() => {
                setSearch("");
                setBrandFilter([]);
                setStorageFilter([]);
                setPriceRange([0, 100000000]);
                setCurrentPage(1); // Reset về trang 1 khi reset
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="col-md-9">
          {/* Dùng row-cols-md-3 để hiển thị 3 sản phẩm mỗi hàng (phù hợp với itemsPerPage = 6) */}
          <div className="row row-cols-1 row-cols-md-3 g-4"> 
            {paginatedPhones.length > 0 ? (
              paginatedPhones.map((phone) => (
                <div className="col" key={phone.id}>
                  <div className="card h-100 shadow-sm transition-shadow hover:shadow-lg">
                    <Link
                      to={`/detail/${phone.id}`}
                      className="text-decoration-none text-dark p-3 d-block"
                    >
                      <img
                        src={phone.img}
                        className="card-img-top mx-auto"
                        alt={phone.name}
                        style={{ height: '200px', objectFit: 'contain' }}
                        onError={(e) => {
                          if (e.target.src !== IMG_PLACEHOLDER) e.target.src = IMG_PLACEHOLDER;
                        }}
                      />
                      <div className="card-body text-center">
                        <h6 className="card-title fw-semibold">{phone.name}</h6>
                        <p className="text-muted mb-1" style={{fontSize: '0.9em'}}>
                          {phone.brand} - {phone.storage}
                        </p>
                        <p className="text-success mb-2 fw-medium">
                          🏷️ Còn lại: <strong>{phone.quantity}</strong>
                        </p>
                        <p className="text-danger fw-bold fs-5">
                          {phone.price.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    </Link>

                    <div className="card-footer bg-white border-0 text-center pt-0 pb-3">
                      <button
                        className="btn btn-dark w-100 mb-2"
                        onClick={() => themVaoGioHang(phone.id)}
                        disabled={phone.quantity === 0} 
                      >
                        <i className="bi bi-cart-plus me-2"></i> Thêm vào giỏ
                      </button>
                      <button className="btn btn-outline-danger w-100 mb-2">
                        <i className="bi bi-heart-fill me-2"></i> Yêu thích
                      </button>
                      <button className="btn btn-warning w-100" disabled={phone.quantity === 0}>
                        <i className="bi bi-lightning-fill me-2"></i> Mua ngay
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center w-100 alert alert-secondary mx-3">Không tìm thấy sản phẩm phù hợp</p>
            )}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5 mb-5">
              <Pagination>
                <Pagination.First
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                />
                {[...Array(totalPages)].map((_, idx) => (
                  <Pagination.Item
                    key={idx + 1}
                    active={idx + 1 === currentPage}
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
