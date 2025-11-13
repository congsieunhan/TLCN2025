import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Header.css";
import { API_BASE_URL } from "../config";
import logo from "../assets/logo.png"; // import ảnh từ thư mục assets

function Header() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    try {
      // Lấy thông tin user từ localStorage khi component render hoặc khi location thay đổi
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
      const a = localStorage.getItem("admin");
      setAdmin(a ? JSON.parse(a) : null);
    } catch (e) {
      setUser(null);
      setAdmin(null);
    }
  }, [location]);

  useEffect(() => {
    // Fetch số lượng giỏ hàng và yêu thích khi user thay đổi hoặc route đổi
    const fetchCounts = async () => {
      try {
        if (!user) { setCartCount(0); setWishCount(0); return; }
        const res = await fetch(`${API_BASE_URL}/header/counts/?ten_dang_nhap=${encodeURIComponent(user.ten_dang_nhap)}`);
        if (!res.ok) { setCartCount(0); setWishCount(0); return; }
        const data = await res.json();
        setCartCount(Number(data.cart_count || 0));
        setWishCount(Number(data.wishlist_count || 0));
      } catch {
        setCartCount(0);
        setWishCount(0);
      }
    };
    fetchCounts();
    // Realtime: lắng nghe thay đổi header_counts qua SSE
    let es;
    try {
      if (user) {
        es = new EventSource(`${API_BASE_URL}/stream/?channels=header_counts&ten_dang_nhap=${encodeURIComponent(user.ten_dang_nhap)}`);
        es.addEventListener('header_counts', () => fetchCounts());
      }
    } catch {}
    return () => { try { es && es.close(); } catch {} };
  }, [user, location]);

  const handleLogout = () => {
    // Xóa user khỏi localStorage
    localStorage.removeItem("user");
    setUser(null);
    // Chuyển hướng về trang chủ
    window.location.href = "/";
  };
  const handleAdminLogout = () => {
    try { localStorage.removeItem('admin'); } catch {}
    setAdmin(null);
    window.location.href = "/admin/login";
  };
  return (
    <nav className="navbar navbar-expand-lg header-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand header-brand" to="/">
          <img src={logo} alt="Logo" className="header-logo" />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          {/* Search */}
          <form className="header-search d-flex my-2 my-lg-0 mx-lg-3">
            <input
              className="form-control"
              type="search"
              placeholder="Tìm sản phẩm..."
              aria-label="Search"
            />
            <button className="btn btn-dark ms-2" type="submit">
              <i className="bi bi-search"></i>
            </button>
          </form>

          {/* Menu */}
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
            <li className="nav-item">
              <Link className={`nav-link menu-link ${location.pathname === '/' ? 'active' : ''}`} to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link menu-link ${location.pathname.startsWith('/shop') ? 'active' : ''}`} to="/shop">
                Shop
              </Link>
            </li>
            <li className="nav-item dropdown">
              <button className="nav-link dropdown-toggle menu-link btn btn-link" id="navbarDropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                More
              </button>
              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" to="/about">About</Link></li>
                <li><button className="dropdown-item" type="button">Another action</button></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item" type="button">Something else here</button></li>
              </ul>
            </li>
          </ul>

          {/* Icons */}
          <div className="header-icons d-flex align-items-center ms-lg-3 gap-2">
            {/* Cart */}
            <Link to="/cart" className="btn btn-outline-dark position-relative">
              <i className="bi bi-cart"></i>
              {cartCount > 0 && (
                <span className="header-badge badge bg-dark">{cartCount}</span>
              )}
            </Link>

            {/* Wishlist */}
            <button className="btn btn-outline-dark position-relative" type="button">
              <i className="bi bi-heart"></i>
              {wishCount > 0 && (
                <span className="header-badge badge bg-dark">{wishCount}</span>
              )}
            </button>

            {/* Orders */}
            <Link to="/orders" className="btn btn-outline-dark position-relative d-none d-lg-inline-flex">
              <i className="bi bi-clipboard-check"></i>
            </Link>

            {/* Admin shortcut (only when admin logged in) */}
            {admin && (
              <Link to="/admin" className="btn btn-outline-warning position-relative d-none d-lg-inline-flex" title="Quản trị">
                <i className="bi bi-shield-lock"></i>
              </Link>
            )}
            {admin && (
              <button className="btn btn-outline-warning d-none d-lg-inline-flex" title="Đăng xuất quản trị" onClick={handleAdminLogout}>
                <i className="bi bi-box-arrow-right"></i>
              </button>
            )}

            {/* User */}
            {user ? (
              <div className="dropdown">
                <button className="btn btn-outline-dark dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="bi bi-person"></i>
                  <span className="ms-1 d-none d-sm-inline">{user.ten_dang_nhap}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/account">
                      <i className="bi bi-person-gear me-2"/> Tài khoản của tôi
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider"/></li>
                  <li><button className="dropdown-item" onClick={handleLogout}>Đăng xuất</button></li>
                </ul>
              </div>
            ) : admin ? (
              // Nếu chưa có user nhưng có admin -> hiện nút đăng xuất quản trị trên mobile
              <button className="btn btn-outline-warning d-inline-flex d-lg-none" title="Đăng xuất quản trị" onClick={handleAdminLogout}>
                <i className="bi bi-box-arrow-right"></i>
              </button>
            ) : (
              <div className="btn-group">
                <Link to="/login" className="btn btn-outline-dark" type="button">
                  <i className="bi bi-person"></i>
                </Link>
                <Link to="/register" className="btn btn-dark" type="button">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
export default Header;
