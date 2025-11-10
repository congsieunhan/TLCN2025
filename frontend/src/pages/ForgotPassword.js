import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";
import { API_BASE_URL } from "../config";

const ForgotPassword = () => {
  const [form, setForm] = useState({ ten_dang_nhap: "", sdt: "", otp: "", mat_khau_moi: "", xac_nhan: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const [otpInfo, setOtpInfo] = useState("");
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.mat_khau_moi.length < 6) {
      setError("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }
    if (form.mat_khau_moi !== form.xac_nhan) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }
    if (!form.otp) {
      setError("Vui lòng nhập mã OTP");
      return;
    }

    axios
      .post(`${API_BASE_URL}/auth/reset-password/`, {
        ten_dang_nhap: form.ten_dang_nhap,
        sdt: form.sdt,
        otp: form.otp,
        mat_khau_moi: form.mat_khau_moi,
      })
      .then(() => {
        const msg = "Đổi mật khẩu thành công. Vui lòng đăng nhập.";
        setSuccess(msg);
        // Hiển thị thông báo, khi nhấn OK mới chuyển sang trang đăng nhập
        window.alert(msg);
        navigate("/login");
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || "Không thể đặt lại mật khẩu";
        setError(msg);
      });
  };

  const requestOtp = () => {
    if (!form.sdt || !form.ten_dang_nhap) { // Kiểm tra thêm tên đăng nhập
      setError("Vui lòng nhập Tên đăng nhập và Số điện thoại trước");
      return;
    }
    setError("");
    setOtpInfo("");
    setSending(true);
    axios
    .post(`${API_BASE_URL}/auth/request-otp/`, { 
      ten_dang_nhap: form.ten_dang_nhap, // THÊM TÊN ĐĂNG NHẬP
      sdt: form.sdt, 
      purpose: "reset" 
    })
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
      <div className="login-container" style={{ width: "min(92vw, 460px)" }}>
        <h2>Quên mật khẩu</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          <input
            name="ten_dang_nhap"
            placeholder="Tên đăng nhập"
            value={form.ten_dang_nhap}
            onChange={onChange}
            required
          />
          <input name="sdt" placeholder="Số điện thoại" value={form.sdt} onChange={onChange} required />
          <div style={{ display: "flex", gap: 8 }}>
            <input name="otp" placeholder="Mã OTP" value={form.otp} onChange={onChange} required style={{ flex: 1 }} />
            <button type="button" onClick={requestOtp} disabled={sending} style={{ minWidth: 160 }}>
              {sending ? "Đang gửi..." : "Gửi OTP"}
            </button>
          </div>
          <input name="mat_khau_moi" type="password" placeholder="Mật khẩu mới" value={form.mat_khau_moi} onChange={onChange} required />
          <input name="xac_nhan" type="password" placeholder="Xác nhận mật khẩu mới" value={form.xac_nhan} onChange={onChange} required />
          {error && <p className="form-msg error">{error}</p>}
          {success && <p className="form-msg success">{success}</p>}
          {otpInfo && <p className="form-msg success">{otpInfo}</p>}
          <button type="submit">Đặt lại mật khẩu</button>
        </form>
        <p style={{ marginTop: 10 }}>
          <Link to="/login">Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
