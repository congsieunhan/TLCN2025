import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";
import { API_BASE_URL } from "../config";

const Register = () => {
  const [form, setForm] = useState({
    ho_ten: "",
    email: "",
    sdt: "",
    dia_chi: "",
    ten_dang_nhap: "",
    mat_khau: "",
    otp: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpInfo, setOtpInfo] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.otp) {
      setError("Vui lòng nhập mã OTP đã gửi tới SĐT");
      return;
    }
    axios
      .post(`${API_BASE_URL}/auth/register/`, form)
      .then(() => {
        const msg = "Đăng ký thành công. Vui lòng đăng nhập.";
        setSuccess(msg);
        // Hiển thị thông báo và chỉ chuyển trang sau khi người dùng đóng thông báo
        window.alert(msg);
        navigate("/login");
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Đăng ký thất bại";
        setError(msg);
        // Hiển thị thông báo lỗi theo yêu cầu
        window.alert(msg);
      });
  };

  const requestOtp = () => {
    if (!form.sdt) {
      setError("Vui lòng nhập số điện thoại trước");
      return;
    }
    setError("");
    setOtpInfo("");
    setSending(true);
    axios
      .post(`${API_BASE_URL}/auth/request-otp/`, { sdt: form.sdt, purpose: "register" })
      .then((res) => {
        const otp = res.data?.otp;
        setOtpInfo(otp ? `Mã OTP (dev): ${otp}` : "Đã gửi OTP tới SĐT của bạn");
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Không thể gửi OTP";
        setError(msg);
      })
      .finally(() => setSending(false));
  };

  return (
    <div className="login-page">
      <div className="login-container register-container">
        <h2>Register</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          <input name="ho_ten" placeholder="Họ tên" value={form.ho_ten} onChange={onChange} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
          <input name="sdt" placeholder="Số điện thoại" value={form.sdt} onChange={onChange} required />
          <input name="dia_chi" placeholder="Địa chỉ" value={form.dia_chi} onChange={onChange} required />
          <input name="ten_dang_nhap" placeholder="Tên đăng nhập" value={form.ten_dang_nhap} onChange={onChange} required />
          <input name="mat_khau" type="password" placeholder="Mật khẩu" value={form.mat_khau} onChange={onChange} required />
          <div style={{ display: "flex", gap: 8 }}>
            <input name="otp" placeholder="Mã OTP" value={form.otp} onChange={onChange} required style={{ flex: 1 }} />
            <button type="button" onClick={requestOtp} disabled={sending} style={{ minWidth: 160 }}>
              {sending ? "Đang gửi..." : "Gửi OTP"}
            </button>
          </div>
          {error && <p className="form-msg error">{error}</p>}
          {success && <p className="form-msg success">{success}</p>}
          {otpInfo && <p className="form-msg success">{otpInfo}</p>}
          <button type="submit">Đăng ký</button>
        </form>
        <p style={{ marginTop: 10 }}>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
