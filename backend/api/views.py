from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import SanPham
from .serializers import SanPhamSerializer
from django.http import JsonResponse
from rest_framework import status
from django.utils import timezone
from django.db import transaction
from .models import KhachHang, SanPham, DonHang, ChiTietDH, ThanhToan
import uuid
from rest_framework.views import APIView
from rest_framework import status
from backend.api.models import KhachHang, SanPham, GioHang, ChiTietGio
from backend.api.serializers import GioHangSerializer, ChiTietGioSerializer



@api_view(['GET'])
def get_all_sanpham(request):
    sanphams = SanPham.objects.prefetch_related('hinh_anh_list').all()
    serializer = SanPhamSerializer(sanphams, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def dat_hang(request):
    try:
        data = request.data
        khach_hang_id = data.get('khach_hang_id')
        dia_chi_giao = data.get('dia_chi_giao')
        phuong_thuc_tt = data.get('phuong_thuc_tt')
        products = data.get('products', [])

        if not khach_hang_id or not products:
            return Response({'error': 'Thiếu thông tin khách hàng hoặc sản phẩm!'}, status=status.HTTP_400_BAD_REQUEST)

        khach_hang = KhachHang.objects.get(pk=khach_hang_id)

        # Tạo mã đơn hàng ngẫu nhiên
        ma_dh = f"DH{uuid.uuid4().hex[:8].upper()}"

        tong_tien = 0

        with transaction.atomic():  # Đảm bảo an toàn dữ liệu
            # 1️⃣ Tính tổng tiền
            for p in products:
                tong_tien += float(p['don_gia']) * int(p['so_luong'])

            # 2️⃣ Tạo đơn hàng
            don_hang = DonHang.objects.create(
                ma_dh=ma_dh,
                khach_hang=khach_hang,
                tong_tien=tong_tien,
                dia_chi_giao=dia_chi_giao,
                trang_thai="Chờ xử lý",
                ngay_dat=timezone.now()
            )

            # 3️⃣ Tạo chi tiết đơn hàng
            for p in products:
                sp = SanPham.objects.get(ma_sp=p['ma_sp'])

                # Kiểm tra tồn kho
                if sp.so_luong_ton < p['so_luong']:
                    raise ValueError(f"Sản phẩm {sp.ten_sp} không đủ hàng.")

                thanh_tien = float(p['don_gia']) * int(p['so_luong'])

                ChiTietDH.objects.create(
                    don_hang=don_hang,
                    san_pham=sp,
                    so_luong=p['so_luong'],
                    don_gia=p['don_gia'],
                    thanh_tien=thanh_tien
                )

                # Cập nhật tồn kho
                sp.so_luong_ton -= int(p['so_luong'])
                sp.save()

            # 4️⃣ Tạo bản ghi thanh toán
            ThanhToan.objects.create(
                don_hang=don_hang,
                phuong_thuc=phuong_thuc_tt,
                trang_thai_tt="Chưa thanh toán"
            )

        return Response({
            'success': True,
            'message': 'Đặt hàng thành công!',
            'ma_don_hang': ma_dh,
            'tong_tien': tong_tien
        }, status=status.HTTP_201_CREATED)

    except KhachHang.DoesNotExist:
        return Response({'error': 'Không tìm thấy khách hàng!'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class SanPhamDetailAPIView(APIView):
    def get(self, request, pk, format=None):
        try:
            product = SanPham.objects.get(pk=pk)
        except SanPham.DoesNotExist:
            return Response({"detail": "Không tìm thấy sản phẩm."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SanPhamSerializer(product)
        return Response(serializer.data)

class GioHangView(APIView):
    """
    API Giỏ hàng:
    - GET: Lấy giỏ hàng của 1 khách hàng (?ten_dang_nhap=hoangcong)
    - POST: Thêm sản phẩm vào giỏ hàng
    """

    def get(self, request):
        ten_dang_nhap = request.query_params.get("ten_dang_nhap")

        # Kiểm tra tham số bắt buộc
        if not ten_dang_nhap:
            return Response(
                {"error": "Thiếu tên đăng nhập"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Tìm khách hàng
            khach_hang = KhachHang.objects.get(ten_dang_nhap=ten_dang_nhap)

            # Lấy (hoặc tạo mới) giỏ hàng cho khách
            gio_hang, _ = GioHang.objects.get_or_create(khach_hang=khach_hang)

            # Lấy chi tiết các sản phẩm trong giỏ
            chi_tiet_gio = ChiTietGio.objects.filter(gio_hang=gio_hang)

            if not chi_tiet_gio.exists():
                return Response({"message": "Giỏ hàng trống"}, status=status.HTTP_200_OK)

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

            # Lấy khách hàng và sản phẩm
            khach_hang = KhachHang.objects.get(ten_dang_nhap=ten_dang_nhap)
            san_pham = SanPham.objects.get(ma_sp=ma_sp)

            # ✅ Lấy giỏ hàng mới nhất hoặc tạo mới nếu chưa có
            gio_hang = GioHang.objects.filter(khach_hang=khach_hang).last()
            if gio_hang is None:
                gio_hang = GioHang.objects.create(khach_hang=khach_hang)

            # ✅ Tìm hoặc tạo chi tiết giỏ hàng
            chi_tiet, created = ChiTietGio.objects.get_or_create(
                gio_hang=gio_hang,
                san_pham=san_pham,
                defaults={'so_luong': so_luong}
            )

            if not created:
                chi_tiet.so_luong += so_luong
                chi_tiet.save()

            return Response({"message": "Đã thêm vào giỏ hàng thành công!"})

        except SanPham.DoesNotExist:
            return Response({"error": "Sản phẩm không tồn tại"}, status=400)
        except KhachHang.DoesNotExist:
            return Response({"error": "Khách hàng không tồn tại"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
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

            gio_hang = GioHang.objects.filter(khach_hang=khach_hang).last()
            if not gio_hang:
                return Response({"error": "Giỏ hàng không tồn tại"}, status=404)

            chi_tiet = ChiTietGio.objects.filter(gio_hang=gio_hang, san_pham=san_pham).first()
            if not chi_tiet:
                return Response({"error": "Sản phẩm không có trong giỏ hàng"}, status=404)

            chi_tiet.delete()
            return Response({"message": "Đã xóa sản phẩm khỏi giỏ hàng"}, status=200)

        except KhachHang.DoesNotExist:
            return Response({"error": "Khách hàng không tồn tại"}, status=404)
        except SanPham.DoesNotExist:
            return Response({"error": "Sản phẩm không tồn tại"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)