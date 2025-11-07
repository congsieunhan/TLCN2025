import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Pagination } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./Shop.css";

export default function Shop() {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState([]);
  const [storageFilter, setStorageFilter] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100000000]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 👉 mỗi trang hiển thị 8 sản phẩm
  const [message, setMessage] = useState("");

  const username = "vana";

  // 🛒 Hàm thêm vào giỏ hàng
  const themVaoGioHang = (ma_sp) => {
    axios
      .post("http://localhost:8000/api/giohang/", {
        ten_dang_nhap: username,
        ma_sp: ma_sp,
        so_luong: 1,
      })
      .then((response) => {
        console.log("✅ Thêm vào giỏ hàng thành công:", response.data);
        alert("✅ Đã thêm vào giỏ hàng!");
      })
      .catch((error) => {
        console.error("❌ Lỗi khi thêm vào giỏ hàng:", error);
        if (error.response) {
          alert(`Lỗi từ server: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          alert("Không nhận được phản hồi từ server!");
        } else {
          alert("Lỗi không xác định: " + error.message);
        }
      });
  };

  // 📦 Gọi API lấy danh sách sản phẩm
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/products/")
      .then((res) => {
        const data = res.data.map((p) => {
          const firstImage =
            Array.isArray(p.hinh_anh_list) && p.hinh_anh_list.length > 0
              ? p.hinh_anh_list[0].hinh_anh
              : "";

          const imgUrl = firstImage.startsWith("http")
            ? firstImage
            : `http://127.0.0.1:8000${firstImage}`;

          return {
            id: p.ma_sp,
            name: p.ten_sp,
            brand: p.hang_sx,
            price: Number(p.gia),
            img: imgUrl,
            storage: p.thong_so,
            quantity: p.so_luong_ton || 0, // ✅ thêm số lượng còn lại
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

  // ⚙️ Bộ lọc
  const toggleFilter = (filter, setFilter, value) => {
    setFilter((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  // 🔍 Lọc sản phẩm
  const filteredPhones = phones.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (brandFilter.length === 0 || brandFilter.includes(p.brand)) &&
      (storageFilter.length === 0 || storageFilter.includes(p.storage)) &&
      p.price >= priceRange[0] &&
      p.price <= priceRange[1]
  );

  // 📄 Phân trang
  const totalPages = Math.ceil(filteredPhones.length / itemsPerPage);
  const paginatedPhones = filteredPhones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <p className="text-center mt-5">Đang tải dữ liệu...</p>;
  if (error) return <p className="text-center text-danger mt-5">Lỗi: {error}</p>;

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
              onChange={(e) => setSearch(e.target.value)}
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
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
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
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="col-md-9">
          <div className="row row-cols-1 row-cols-md-4 g-4">
            {/* 👉 hiển thị 4 sản phẩm mỗi hàng */}
            {paginatedPhones.length > 0 ? (
              paginatedPhones.map((phone) => (
                <div className="col" key={phone.id}>
                  <div className="card h-100 shadow-sm">
                    <Link
                      to={`/detail/${phone.id}`}
                      className="text-decoration-none text-dark"
                    >
                      <img
                        src={phone.img}
                        className="card-img-top"
                        alt={phone.name}
                      />
                      <div className="card-body text-center">
                        <h6 className="card-title">{phone.name}</h6>
                        <p className="text-muted mb-1">
                          {phone.brand} - {phone.storage}
                        </p>
                        <p className="text-success mb-2">
                          🏷️ Còn lại: {phone.quantity}
                        </p>
                        <p className="text-danger fw-bold">
                          {phone.price.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </Link>

                    <div className="card-footer bg-white border-0 text-center">
                      <button
                        className="btn btn-dark w-100 mb-2"
                        onClick={() => themVaoGioHang(phone.id)}
                      >
                        <i className="bi bi-cart-plus me-2"></i> Thêm vào giỏ
                      </button>
                      <button className="btn btn-outline-danger w-100 mb-2">
                        <i className="bi bi-heart-fill me-2"></i> Yêu thích
                      </button>
                      <button className="btn btn-warning w-100">
                        <i className="bi bi-lightning-fill me-2"></i> Mua ngay
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center">Không tìm thấy sản phẩm phù hợp</p>
            )}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
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
