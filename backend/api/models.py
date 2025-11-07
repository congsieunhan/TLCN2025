from django.db import models
from django.contrib.auth.hashers import make_password

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

class HinhAnhSanPham(models.Model):
    san_pham = models.ForeignKey(SanPham, on_delete=models.CASCADE, related_name='hinh_anh_list')
    hinh_anh = models.ImageField(upload_to='sanpham/', blank=True, null=True)
    mo_ta = models.CharField(max_length=255, blank=True, null=True)
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
# 🧑‍💼 QUẢN TRỊ
# -------------------------------
class QuanTri(models.Model):
    ma_qt = models.AutoField(primary_key=True)
    ho_ten = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    ten_dang_nhap = models.CharField(max_length=50, unique=True)
    mat_khau = models.CharField(max_length=255)
    vai_tro = models.CharField(max_length=50, default='admin')

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
