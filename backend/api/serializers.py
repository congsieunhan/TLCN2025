from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import GioHang, ChiTietGio, SanPham, KhachHang, HinhAnhSanPham 
class HinhAnhSanPhamSerializer(serializers.ModelSerializer):
    class Meta:
        model = HinhAnhSanPham
        fields = ['id', 'hinh_anh', 'mo_ta']

class SanPhamSerializer(serializers.ModelSerializer):
    hinh_anh_list = HinhAnhSanPhamSerializer(many=True, read_only=True)

    class Meta:
        model = SanPham
        fields = [
            'ma_sp', 'ten_sp', 'hang_sx', 'gia', 'thong_so',
            'ngay_nhap', 'tinh_trang', 'so_luong_ton', 'hinh_anh_list'
        ]
class ChiTietGioSerializer(serializers.ModelSerializer):
    san_pham = SanPhamSerializer()

    class Meta:
        model = ChiTietGio
        fields = ['san_pham', 'so_luong']

class GioHangSerializer(serializers.ModelSerializer):
    chi_tiet = ChiTietGioSerializer(source='chitietgio_set', many=True)

    class Meta:
        model = GioHang
        fields = ['ma_gh', 'ngay_tao', 'chi_tiet']