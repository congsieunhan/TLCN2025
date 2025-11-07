import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import logo from "../assets/logo.png"; // import ảnh từ thư mục assets

function Header() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img
            src={logo}
            alt="Logo"
            style={{ width: "160px", height: "100px", marginLeft: "60px" }}
          />
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

        {/* Search form */}
        <form className="d-flex" style={{ marginLeft: "100px" }}>
          <input
            className="form-control me-2"
            type="search"
            placeholder="Search"
            aria-label="Search"
          />
          <button
            className="btn btn-outline-dark btn-outline-success rounded-circle"
            type="submit"
          >
            <i className="bi bi-search"></i>
          </button>
        </form>

        {/* Menu */}
        <div
          className="collapse navbar-collapse"
          id="navbarSupportedContent"
          style={{ marginLeft: "300px" }}
        >
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active menu-link" aria-current="page" to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link menu-link" to="/shop">
                Shop
              </Link>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle menu-link"
                href="#"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Dropdown
              </a>
              <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                <li><Link className="dropdown-item" to="/about">About</Link></li>
                <li><a className="dropdown-item" href="#">Another action</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#">Something else here</a></li>
              </ul>
            </li>
            <li className="nav-item">
              <a className="nav-link disabled menu-link" href="#" tabIndex="-1" aria-disabled="true">
                Disabled
              </a>
            </li>
          </ul>
        </div>

        {/* Icons (cart, heart, orders, user) */}
        <div style={{ marginRight: "60px", display: "flex", gap: "15px" }}>
          {/* 🛒 Giỏ hàng */}
          <div className="position-relative d-inline-block">
            <Link to="/cart" className="btn btn-outline-dark position-relative">
              <i className="bi bi-cart"></i>
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark">
                3
              </span>
            </Link>
          </div>

          {/* ❤️ Yêu thích */}
          <div className="position-relative d-inline-block">
            <button className="btn btn-outline-dark position-relative" type="button">
              <i className="bi bi-heart"></i>
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark">
                5
              </span>
            </button>
          </div>

          {/* 📦 Quản lý đơn hàng */}
          <div className="position-relative d-inline-block">
            <Link to="/orders" className="btn btn-outline-dark position-relative">
              <i className="bi bi-clipboard-check"></i>
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark">
                2
              </span>
            </Link>
          </div>

          {/* 👤 Người dùng */}
          <button className="btn btn-outline-dark" type="button">
            <i className="bi bi-person"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}
export default Header;
