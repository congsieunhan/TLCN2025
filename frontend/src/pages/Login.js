import React, { useState } from "react";
import "./Login.css";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    axios
      .post(`${API_BASE_URL}/auth/login/`, {
        ten_dang_nhap: username,
        mat_khau: password,
      })
      .then((res) => {
        const user = res.data?.user;
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          // Đăng nhập thành công: không cần thông báo, điều hướng ngay
          navigate("/");
        } else {
          setError("Đăng nhập thất bại");
          window.alert("Đăng nhập thất bại");
        }
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Đăng nhập thất bại";
        setError(msg);
        // Hiển thị thông báo lỗi theo yêu cầu
        window.alert(msg);
      });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="form-msg error">{error}</p>}
          <button type="submit">Login</button>
        </form>
        <p style={{ marginTop: 10 }}>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
        <p style={{ marginTop: 6 }}>
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
