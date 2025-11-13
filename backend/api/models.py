from django.db import models
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import timedelta

# -------------------------------
# 🧍 KHÁCH HÀNG
# -------------------------------
class KhachHang(models.Model):
    ma_kh = models.AutoField(primary_key=True)
    ho_ten = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    sdt = models.CharField(max_length=15, unique=True)
    dia_chi = models.CharField(max_length=255)
    ten_dang_nhap = models.CharField(max_length=50, unique=True)
    mat_khau = models.CharField(max_length=255)
    def save(self, *args, **kwargs):
        # Mã hóa mật khẩu nếu chưa được mã hóa
        if not self.mat_khau.startswith('pbkdf2_'):
            self.mat_khau = make_password(self.mat_khau)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.ho_ten


# -------------------------------
# 📦 SẢN PHẨM
# -------------------------------
class SanPham(models.Model):
    ma_sp = models.AutoField(primary_key=True)
    ten_sp = models.CharField(max_length=100)
    hang_sx = models.CharField(max_length=100)
    gia = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    thong_so = models.TextField(blank=True, null=True)
    ngay_nhap = models.DateField()
    tinh_trang = models.CharField(max_length=50)
    so_luong_ton = models.IntegerField(default=0)

    def __str__(self):
        return self.ten_sp

    def save(self, *args, **kwargs):
        # Tự động đồng bộ tình trạng theo tồn kho
        try:
            qty = int(self.so_luong_ton or 0)
        except Exception:
            qty = 0
        self.tinh_trang = 'Hết hàng' if qty <= 0 else 'Còn hàng'
        super().save(*args, **kwargs)

class HinhAnhSanPham(models.Model):
    san_pham = models.ForeignKey(SanPham, on_delete=models.CASCADE, related_name='hinh_anh_list')
    hinh_anh = models.ImageField(upload_to='sanpham/', blank=True, null=True)
    mo_ta = models.CharField(max_length=255, blank=True, null=True)

# -------------------------------
# 🛡️ BẢO HÀNH SẢN PHẨM
# -------------------------------
class BaoHanh(models.Model):
    """Chính sách bảo hành/đổi trả theo từng sản phẩm."""
    san_pham = models.OneToOneField(SanPham, on_delete=models.CASCADE, related_name='bao_hanh')
    doi_moi_ngay = models.IntegerField(default=30)        # số ngày đổi mới
    bao_hanh_thang = models.IntegerField(default=12)      # số tháng bảo hành sửa chữa
    mo_ta = models.TextField(blank=True, null=True)       # mô tả chi tiết chính sách

    def __str__(self):
        return f"BH {self.san_pham.ten_sp}: {self.doi_moi_ngay}d/{self.bao_hanh_thang}m"
# -------------------------------
# 🛒 GIỎ HÀNG
# -------------------------------
class GioHang(models.Model):
    ma_gh = models.AutoField(primary_key=True)
    khach_hang = models.OneToOneField(KhachHang, on_delete=models.CASCADE, related_name='giohang')
    ngay_tao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Giỏ hàng của {self.khach_hang.ho_ten}"

class ChiTietGio(models.Model):
    gio_hang = models.ForeignKey(GioHang, on_delete=models.CASCADE, related_name='chi_tiet')
    san_pham = models.ForeignKey(SanPham, on_delete=models.CASCADE)
    so_luong = models.IntegerField(default=1)

    class Meta:
        unique_together = ('gio_hang', 'san_pham')

    def __str__(self):
        return f"{self.san_pham.ten_sp} ({self.so_luong})"


# -------------------------------
# 🧾 ĐƠN HÀNG
# -------------------------------
class DonHang(models.Model):
    ma_dh = models.CharField(max_length=20, unique=True)
    khach_hang = models.ForeignKey(KhachHang, on_delete=models.CASCADE, related_name='don_hang')
    ngay_dat = models.DateTimeField(auto_now_add=True)
    tong_tien = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    trang_thai = models.CharField(max_length=50, default='Chờ xử lý')
    dia_chi_giao = models.CharField(max_length=255)

    def __str__(self):
        return f"Đơn hàng {self.ma_dh} - {self.khach_hang.ho_ten}"


class ChiTietDH(models.Model):
    don_hang = models.ForeignKey(DonHang, on_delete=models.CASCADE, related_name='chi_tiet')
    san_pham = models.ForeignKey(SanPham, on_delete=models.CASCADE)
    so_luong = models.IntegerField()
    don_gia = models.DecimalField(max_digits=12, decimal_places=2)
    thanh_tien = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ('don_hang', 'san_pham')

    def __str__(self):
        return f"{self.san_pham.ten_sp} ({self.so_luong})"


# -------------------------------
# 💳 THANH TOÁN
# -------------------------------
class ThanhToan(models.Model):
    ma_tt = models.AutoField(primary_key=True)
    don_hang = models.ForeignKey(DonHang, on_delete=models.CASCADE)
    phuong_thuc = models.CharField(max_length=50)
    trang_thai_tt = models.CharField(max_length=50, default='Chưa thanh toán')

    def __str__(self):
        return f"Thanh toán {self.ma_tt} - {self.trang_thai_tt}"


# -------------------------------
# ⭐ ĐÁNH GIÁ
# -------------------------------
class DanhGia(models.Model):
    ma_dgia = models.AutoField(primary_key=True)
    san_pham = models.ForeignKey(SanPham, on_delete=models.CASCADE, related_name='danh_gia')
    khach_hang = models.ForeignKey(KhachHang, on_delete=models.CASCADE)
    so_sao = models.IntegerField()
    noi_dung = models.TextField(blank=True, null=True)
    hinh_anh = models.ImageField(upload_to='danhgia/', blank=True, null=True)
    ngay_danh_gia = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Đánh giá {self.san_pham.ten_sp} - {self.so_sao} sao"


# -------------------------------
# ❤️ YÊU THÍCH
# -------------------------------
class YeuThich(models.Model):
    khach_hang = models.ForeignKey(KhachHang, on_delete=models.CASCADE)
    san_pham = models.ForeignKey(SanPham, on_delete=models.CASCADE)
    ngay_them = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('khach_hang', 'san_pham')

    def __str__(self):
        return f"{self.khach_hang.ho_ten} yêu thích {self.san_pham.ten_sp}"


# -------------------------------
# 🏠 ĐỊA CHỈ NHẬN HÀNG
# -------------------------------
class DiaChiNhanHang(models.Model):
    khach_hang = models.ForeignKey(KhachHang, on_delete=models.CASCADE, related_name='dia_chis')
    ho_ten = models.CharField(max_length=100)
    sdt = models.CharField(max_length=20)
    tinh_tp = models.CharField(max_length=100)
    phuong_xa = models.CharField(max_length=100)
    dia_chi_chi_tiet = models.CharField(max_length=255)
    mac_dinh = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        parts = [self.dia_chi_chi_tiet, self.phuong_xa, self.tinh_tp]
        return f"{self.ho_ten} - "+ ", ".join([p for p in parts if p])


# -------------------------------
# 🧑‍💼 QUẢN TRỊ
# -------------------------------
class QuanTri(models.Model):
    ma_qt = models.AutoField(primary_key=True)
    ho_ten = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    ten_dang_nhap = models.CharField(max_length=50, unique=True)
    mat_khau = models.CharField(max_length=255)
    VAI_TRO_CHOICES = (
        ('admin', 'Admin'),
        ('nhan_vien', 'Nhân viên cửa hàng'),
    )
    vai_tro = models.CharField(max_length=50, choices=VAI_TRO_CHOICES, default='admin')

    def save(self, *args, **kwargs):
        if not self.mat_khau.startswith('pbkdf2_'):
            self.mat_khau = make_password(self.mat_khau)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.ho_ten


# -------------------------------
# 🎁 KHUYẾN MÃI
# -------------------------------
class KhuyenMai(models.Model):
    ma_km = models.AutoField(primary_key=True)
    ten_km = models.CharField(max_length=100)
    mo_ta = models.TextField()
    ngay_bd = models.DateField()
    ngay_kt = models.DateField()
    gia_tri_giam = models.DecimalField(max_digits=10, decimal_places=2)
    ap_dung_cho = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.ten_km


# -------------------------------
# 🖼️ BANNER
# -------------------------------
class Banner(models.Model):
    ma_bn = models.AutoField(primary_key=True)
    tieu_de = models.CharField(max_length=100)
    hinh_anh = models.ImageField(upload_to='banner/')
    ngay_bd = models.DateField()
    ngay_kt = models.DateField()
    link = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.tieu_de


# -------------------------------
# 📊 BÁO CÁO
# -------------------------------
class BaoCao(models.Model):
    ma_bc = models.AutoField(primary_key=True)
    loai_bao_cao = models.CharField(max_length=100)
    thoi_gian = models.DateTimeField()
    noi_dung = models.TextField()
    nguoi_tao = models.ForeignKey(QuanTri, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"Báo cáo {self.loai_bao_cao} - {self.thoi_gian.strftime('%d/%m/%Y')}"


# -------------------------------
# 🚚 VẬN CHUYỂN (Theo dõi trạng thái đơn hàng)
# -------------------------------
class VanChuyen(models.Model):
    """Theo dõi trạng thái vận chuyển của một đơn hàng.
    Một đơn hàng có một bản ghi vận chuyển kèm các thông tin hiển thị cho khách hàng.
    """
    don_hang = models.OneToOneField(DonHang, on_delete=models.CASCADE, related_name='van_chuyen')
    trang_thai = models.CharField(max_length=50, default='Chờ lấy hàng')  # Ví dụ: Chờ lấy hàng, Đang giao, Giao thành công, Đã hủy
    nha_vc = models.CharField(max_length=100, blank=True, null=True)      # Đơn vị vận chuyển (GHN, GHTK, VNPost...)
    ma_van_don = models.CharField(max_length=64, blank=True, null=True)   # Mã vận đơn (nếu có)
    ngay_du_kien = models.DateField(blank=True, null=True)                # Ngày giao dự kiến
    ngay_giao_thanh_cong = models.DateTimeField(blank=True, null=True)    # Mốc bắt đầu bảo hành
    ghi_chu = models.TextField(blank=True, null=True)
    cap_nhat_cuoi = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"VC {self.don_hang.ma_dh} - {self.trang_thai}"

# -------------------------------
# 🔐 OTP (Xác thực SĐT)
# -------------------------------
class OTPCode(models.Model):
    PURPOSE_CHOICES = (
        ("register", "Register"),
        ("reset", "Reset Password"),
    )

    sdt = models.CharField(max_length=15)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=16, choices=PURPOSE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=5)
        super().save(*args, **kwargs)

    def is_valid(self):
        return (not self.is_used) and timezone.now() <= self.expires_at
