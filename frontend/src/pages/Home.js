import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../App.css";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, IMG_BASE_URL, IMG_PLACEHOLDER_SMALL as IMG_PLACEHOLDER } from "../config";
import "./Home.css";
import sl1 from "../assets/1.jpg";
import sl2 from "../assets/2.jpg";
import sl3 from "../assets/3.jpg";
export default function Home() {
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
          .get(`${API_BASE_URL}/products/top/`)
          .then((res) => {
              const data = (res.data || []).map((p) => {
                  const firstImage = Array.isArray(p.hinh_anh_list) && p.hinh_anh_list.length > 0
                    ? p.hinh_anh_list[0].hinh_anh
                    : "";
                  const imgUrl = firstImage ? `${IMG_BASE_URL}${firstImage}` : IMG_PLACEHOLDER;
                  return {
                      id: p.ma_sp,
                      name: p.ten_sp,
                      brand: p.hang_sx,
                      price: Number(p.gia || 0),
                      img: imgUrl,
                      sold: Number(p.sold || 0),
                  };
              });
              setTopProducts(data);
          })
          .catch((err) => {
              console.error("Lỗi tải top sản phẩm:", err);
          })
          .finally(() => setLoading(false));
    }, []);

    const addToCart = (productId, name) => {
        try {
            const u = localStorage.getItem('user');
            const user = u ? JSON.parse(u) : null;
            if (!user) { alert('Vui lòng đăng nhập trước'); return; }
            axios.post(`${API_BASE_URL}/giohang/`, {
                ten_dang_nhap: user.ten_dang_nhap,
                ma_sp: productId,
                so_luong: 1,
            }).then(() => alert(`Đã thêm ${name} vào giỏ`))
              .catch((e) => alert(e?.response?.data?.error || 'Không thể thêm vào giỏ'));
        } catch {
            alert('Lỗi không xác định');
        }
    };
    return (
        <div>
            {/* Carousel */}
            <div id="carouselExampleDark" className="carousel carousel-dark slide" data-bs-ride="carousel">
                {/* indicators */}
                <div className="carousel-indicators">
                    <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="0" className="active" aria-label="Slide 1"></button>
                    <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="1" aria-label="Slide 2"></button>
                    <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="2" aria-label="Slide 3"></button>
                </div>

                {/* slides */}
                <div className="carousel-inner">
                    <div className="carousel-item active" data-bs-interval="3000">
                        <img src={sl1} className="d-block w-100 mx-auto" alt="Slide 1" />
                        <div className="carousel-caption d-none d-md-block">
                            <h5>First slide label</h5>
                            <p>Some representative placeholder content for the first slide.</p>
                        </div>
                    </div>
                    <div className="carousel-item" data-bs-interval="3000">
                        <img src={sl2} className="d-block w-100 mx-auto" alt="Slide 2" />
                        <div className="carousel-caption d-none d-md-block">
                            <h5>Second slide label</h5>
                            <p>Some representative placeholder content for the second slide.</p>
                        </div>
                    </div>
                    <div className="carousel-item" data-bs-interval="3000">
                        <img src={sl3} className="d-block w-100 mx-auto" alt="Slide 3" />
                        <div className="carousel-caption d-none d-md-block">
                            <h5>Third slide label</h5>
                            <p>Some representative placeholder content for the third slide.</p>
                        </div>
                    </div>
                </div>

                {/* controls */}
                <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                </button>
            </div>


            {/* Brands */}
            <div className="brand-logos text-center my-5">
                <img alt="Apple" />
                <img alt="Samsung" />
                <img alt="Xiaomi" />
                <img alt="Oppo" />
                <img alt="Vivo" />
            </div>

            {/* Featured Products */}
            <div className="container my-5 featured-products">
                <h2 className="fp-section-title text-center mb-4">SẢN PHẨM NỔI BẬT</h2>
                {loading ? (
                    <p className="text-center">Đang tải...</p>
                ) : (
                    <div className="featured-grid">
                        {topProducts.map((p) => (
                            <div className="fp-card" key={p.id}>
                                <Link to={`/detail/${p.id}`} className="d-block">
                                    <img className="fp-thumb" src={p.img} alt={p.name} onError={(e)=>{ if(e.target.src!==IMG_PLACEHOLDER) e.target.src=IMG_PLACEHOLDER; }} />
                                </Link>
                                <div className="fp-body">
                                    <div className="fp-title">{p.name}</div>
                                    <div className="fp-meta">
                                        <div className="fp-price">{p.price.toLocaleString('vi-VN')}₫</div>
                                        <div className="fp-sold">Đã bán {p.sold}</div>
                                    </div>
                                    <div className="fp-actions">
                                        <Link to={`/detail/${p.id}`} className="fp-btn">Mua ngay</Link>
                                        <button className="fp-icon-btn" onClick={() => addToCart(p.id, p.name)}>
                                            <i className="bi bi-cart"></i>
                                        </button>
                                        <button className="fp-icon-btn">
                                            <i className="bi bi-heart"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
