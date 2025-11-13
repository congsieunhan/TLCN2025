from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction
import uuid
from rest_framework.views import APIView
from .models import SanPham, KhachHang, GioHang, ChiTietGio, DonHang, ChiTietDH, ThanhToan, YeuThich
from .serializers import SanPhamSerializer, ChiTietGioSerializer
from django.db.models import Sum


# ==============================================================================
# 📱 API SẢN PHẨM & CHI TIẾT
# ==============================================================================

@api_view(['GET'])
def get_all_sanpham(request):
    """Lấy danh sách tất cả sản phẩm."""
    sanphams = SanPham.objects.prefetch_related('hinh_anh_list').all()
    serializer = SanPhamSerializer(sanphams, many=True)
    return Response(serializer.data)


class SanPhamDetailAPIView(APIView):
    """Lấy chi tiết sản phẩm theo PK (ma_sp)."""
    def get(self, request, pk, format=None):
        try:
            product = SanPham.objects.get(pk=pk)
        except SanPham.DoesNotExist:
            return Response({"detail": "Không tìm thấy sản phẩm."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SanPhamSerializer(product)
        return Response(serializer.data)


# ==============================================================================
# 🔥 TOP SẢN PHẨM BÁN CHẠY
# ==============================================================================

@api_view(['GET'])
def top_selling_products(request):
    """Trả về danh sách sản phẩm bán chạy theo tổng số lượng bán ra (top 8)."""
    try:
        top = (
            ChiTietDH.objects.values('san_pham')
            .annotate(sold=Sum('so_luong'))
            .order_by('-sold')[:8]
        )

        results = []
        for row in top:
            sp_id = row['san_pham']
            sold = row['sold'] or 0
            try:
                sp = SanPham.objects.prefetch_related('hinh_anh_list').get(pk=sp_id)
                data = SanPhamSerializer(sp).data
                data['sold'] = sold
                results.append(data)
            except SanPham.DoesNotExist:
                continue

        return Response(results)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==============================================================================
# 📊 COUNTS CHO HEADER (Giỏ hàng + Yêu thích)
# ==============================================================================

@api_view(['GET'])
def header_counts(request):
    """Trả về cart_count (tổng số lượng trong giỏ) và wishlist_count cho user."""
    username = request.query_params.get('ten_dang_nhap')
    if not username:
        return Response({"cart_count": 0, "wishlist_count": 0})
    try:
        kh = KhachHang.objects.get(ten_dang_nhap=username)
        gio_hang, _ = GioHang.objects.get_or_create(khach_hang=kh)
        items = ChiTietGio.objects.filter(gio_hang=gio_hang)
        cart_count = sum((it.so_luong or 0) for it in items)
        wishlist_count = YeuThich.objects.filter(khach_hang=kh).count()
        return Response({"cart_count": cart_count, "wishlist_count": wishlist_count})
    except KhachHang.DoesNotExist:
        return Response({"cart_count": 0, "wishlist_count": 0})
    except Exception as e:
        return Response({"cart_count": 0, "wishlist_count": 0, "error": str(e)}, status=status.HTTP_200_OK)


# (Địa chỉ và danh mục địa lý đã chuyển sang views_address.py)


# ==============================================================================
# 🛒 API GIỎ HÀNG
# ==============================================================================

class GioHangView(APIView):
    """
    API Giỏ hàng:
    - GET: Lấy giỏ hàng của 1 khách hàng (?ten_dang_nhap=hoangcong)
    - POST: Thêm sản phẩm vào giỏ hàng
    - DELETE: Xóa 1 sản phẩm khỏi giỏ hàng
    """

    def get(self, request):
        ten_dang_nhap = request.query_params.get("ten_dang_nhap")

        if not ten_dang_nhap:
            return Response(
                {"error": "Thiếu tên đăng nhập"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            khach_hang = KhachHang.objects.get(ten_dang_nhap=ten_dang_nhap)
            gio_hang, _ = GioHang.objects.get_or_create(khach_hang=khach_hang)
            chi_tiet_gio = ChiTietGio.objects.filter(gio_hang=gio_hang)

            if not chi_tiet_gio.exists():
                return Response({"message": "Giỏ hàng trống", "items": []}, status=status.HTTP_200_OK)

            serializer = ChiTietGioSerializer(chi_tiet_gio, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except KhachHang.DoesNotExist:
            return Response(
                {"error": "Khách hàng không tồn tại"},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        try:
            ten_dang_nhap = request.data.get("ten_dang_nhap")
            ma_sp = request.data.get("ma_sp")
            so_luong = int(request.data.get("so_luong", 1))

            if so_luong <= 0:
                 return Response({"error": "Số lượng phải lớn hơn 0"}, status=status.HTTP_400_BAD_REQUEST)
                 
            khach_hang = KhachHang.objects.get(ten_dang_nhap=ten_dang_nhap)
            san_pham = SanPham.objects.get(ma_sp=ma_sp)

            gio_hang, _ = GioHang.objects.get_or_create(khach_hang=khach_hang)
            
            chi_tiet, created = ChiTietGio.objects.get_or_create(
                gio_hang=gio_hang,
                san_pham=san_pham,
                defaults={'so_luong': so_luong}
            )

            if not created:
                chi_tiet.so_luong += so_luong
                chi_tiet.save()
            
            if chi_tiet.so_luong > san_pham.so_luong_ton:
                chi_tiet.so_luong -= so_luong 
                chi_tiet.save()
                return Response({"error": f"Sản phẩm {san_pham.ten_sp} chỉ còn {san_pham.so_luong_ton} sản phẩm."}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"message": "Đã thêm vào giỏ hàng thành công!"})

        except SanPham.DoesNotExist:
            return Response({"error": "Sản phẩm không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        except KhachHang.DoesNotExist:
            return Response({"error": "Khách hàng không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """
        Xóa 1 sản phẩm khỏi giỏ hàng
        Yêu cầu body: { "ten_dang_nhap": "...", "ma_sp": "..." }
        """
        try:
            ten_dang_nhap = request.data.get("ten_dang_nhap")
            ma_sp = request.data.get("ma_sp")

            if not ten_dang_nhap or not ma_sp:
                return Response(
                    {"error": "Thiếu tên đăng nhập hoặc mã sản phẩm"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            khach_hang = KhachHang.objects.get(ten_dang_nhap=ten_dang_nhap)
            san_pham = SanPham.objects.get(ma_sp=ma_sp)

            gio_hang, _ = GioHang.objects.get_or_create(khach_hang=khach_hang)
            
            chi_tiet = ChiTietGio.objects.filter(gio_hang=gio_hang, san_pham=san_pham).first()
            if not chi_tiet:
                return Response({"error": "Sản phẩm không có trong giỏ hàng"}, status=status.HTTP_404_NOT_FOUND)

            chi_tiet.delete()
            return Response({"message": "Đã xóa sản phẩm khỏi giỏ hàng"}, status=status.HTTP_200_OK)

        except KhachHang.DoesNotExist:
            return Response({"error": "Khách hàng không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        except SanPham.DoesNotExist:
            return Response({"error": "Sản phẩm không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


