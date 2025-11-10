from rest_framework import serializers
from .models import (
    GioHang, 
    ChiTietGio, 
    SanPham, 
    KhachHang, 
    HinhAnhSanPham,
    DonHang,         # Thêm các models khác nếu cần sử dụng serializer
    ChiTietDH,
    ThanhToan,
    DanhGia,
    YeuThich,
    # QuanTri, 
    # KhuyenMai, 
    # Banner, 
    # BaoCao, 
    # OTPCode
)

# ==============================================================================
# 📦 SẢN PHẨM (Product)
# ==============================================================================

class HinhAnhSanPhamSerializer(serializers.ModelSerializer):
    class Meta:
        model = HinhAnhSanPham
        fields = ['id', 'hinh_anh', 'mo_ta']

class SanPhamSerializer(serializers.ModelSerializer):
    # Lấy tất cả ảnh liên quan thông qua related_name='hinh_anh_list'
    hinh_anh_list = HinhAnhSanPhamSerializer(many=True, read_only=True)

    class Meta:
        model = SanPham
        fields = [
            'ma_sp', 'ten_sp', 'hang_sx', 'gia', 'thong_so',
            'ngay_nhap', 'tinh_trang', 'so_luong_ton', 'hinh_anh_list'
        ]

# ==============================================================================
# 🛒 GIỎ HÀNG (Cart)
# ==============================================================================

class ChiTietGioSerializer(serializers.ModelSerializer):
    # Nhúng thông tin chi tiết sản phẩm vào chi tiết giỏ hàng
    san_pham = SanPhamSerializer() 

    class Meta:
        model = ChiTietGio
        fields = ['san_pham', 'so_luong'] # Không cần hiển thị ID ChiTietGio

class GioHangSerializer(serializers.ModelSerializer):
    # Lấy các mục ChiTietGio thông qua related_name='chi_tiet'
    chi_tiet = ChiTietGioSerializer(source='chi_tiet', many=True) 

    class Meta:
        model = GioHang
        fields = ['ma_gh', 'ngay_tao', 'chi_tiet']


# ==============================================================================
# 🧾 ĐƠN HÀNG (Order) - Thêm Serializers cho Đơn hàng
# ==============================================================================

class ChiTietDHSerializer(serializers.ModelSerializer):
    # Có thể hiển thị tên sản phẩm thay vì toàn bộ chi tiết
    ten_sp = serializers.ReadOnlyField(source='san_pham.ten_sp') 

    class Meta:
        model = ChiTietDH
        fields = ['ten_sp', 'so_luong', 'don_gia', 'thanh_tien']

class DonHangSerializer(serializers.ModelSerializer):
    khach_hang_ten = serializers.ReadOnlyField(source='khach_hang.ho_ten')
    chi_tiet_dh = ChiTietDHSerializer(source='chi_tiet', many=True, read_only=True)
    
    class Meta:
        model = DonHang
        fields = [
            'ma_dh', 'khach_hang_ten', 'ngay_dat', 'tong_tien', 
            'trang_thai', 'dia_chi_giao', 'chi_tiet_dh'
        ]


# ==============================================================================
# ⭐ ĐÁNH GIÁ VÀ YÊU THÍCH (Review & Wishlist)
# ==============================================================================

class DanhGiaSerializer(serializers.ModelSerializer):
    khach_hang_ten = serializers.ReadOnlyField(source='khach_hang.ho_ten')
    
    class Meta:
        model = DanhGia
        fields = ['ma_dgia', 'khach_hang_ten', 'so_sao', 'noi_dung', 'hinh_anh', 'ngay_danh_gia']

class YeuThichSerializer(serializers.ModelSerializer):
    san_pham_ten = serializers.ReadOnlyField(source='san_pham.ten_sp')

    class Meta:
        model = YeuThich
        fields = ['san_pham_ten', 'ngay_them']