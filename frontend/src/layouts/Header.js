import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Header.css";
import logo from "../assets/logo.png"; // import ảnh từ thư mục assets

function Header() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    try {
      // Lấy thông tin user từ localStorage khi component render hoặc khi location thay đổi
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
    } catch (e) {
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    // Xóa user khỏi localStorage
    localStorage.removeItem("user");
    setUser(null);
    // Chuyển hướng về trang chủ
    window.location.href = "/";
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
              <a className="nav-link dropdown-toggle menu-link" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                More
              </a>
              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" to="/about">About</Link></li>
                <li><a className="dropdown-item" href="#">Another action</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#">Something else here</a></li>
              </ul>
            </li>
          </ul>

          {/* Icons */}
          <div className="header-icons d-flex align-items-center ms-lg-3 gap-2">
            {/* Cart */}
            <Link to="/cart" className="btn btn-outline-dark position-relative">
              <i className="bi bi-cart"></i>
              <span className="header-badge badge bg-dark">3</span>
            </Link>

            {/* Wishlist */}
            <button className="btn btn-outline-dark position-relative" type="button">
              <i className="bi bi-heart"></i>
              <span className="header-badge badge bg-dark">5</span>
            </button>

            {/* Orders */}
            <Link to="/orders" className="btn btn-outline-dark position-relative d-none d-lg-inline-flex">
              <i className="bi bi-clipboard-check"></i>
            </Link>

            {/* User */}
            {user ? (
              <div className="dropdown">
                <button className="btn btn-outline-dark dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="bi bi-person"></i>
                  <span className="ms-1 d-none d-sm-inline">{user.ten_dang_nhap}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><span className="dropdown-item-text">Xin chào, {user.ten_dang_nhap}</span></li>
                  <li><hr className="dropdown-divider"/></li>
                  <li><button className="dropdown-item" onClick={handleLogout}>Đăng xuất</button></li>
                </ul>
              </div>
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
