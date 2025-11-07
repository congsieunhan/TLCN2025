from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction
from .models import KhachHang, SanPham, DonHang, ChiTietDH, ThanhToan, GioHang, ChiTietGio

import uuid
@api_view(['GET'])
def danh_sach_don_hang(request):
    ten_dang_nhap = request.GET.get('ten_dang_nhap')
    if not ten_dang_nhap:
        return Response({'error': 'Thiếu tên đăng nhập'}, status=400)

    try:
        kh = KhachHang.objects.get(ten_dang_nhap=ten_dang_nhap)
    except KhachHang.DoesNotExist:
        return Response({'error': 'Không tìm thấy khách hàng'}, status=404)

    don_hangs = DonHang.objects.filter(khach_hang=kh).order_by('-ngay_dat')

    data = []
    for dh in don_hangs:
        chi_tiet = [
            {
                'san_pham': {
                    'ten_sp': ct.san_pham.ten_sp,
                    'hinh_anh': ct.san_pham.hinh_anh_list.first().hinh_anh.url if ct.san_pham.hinh_anh_list.first() else '',
                },
                'so_luong': ct.so_luong,
                'don_gia': ct.don_gia,
                'thanh_tien': ct.thanh_tien,
            }
            for ct in dh.chi_tiet.all()
        ]

        data.append({
            'ma_dh': dh.ma_dh,
            'ngay_dat': dh.ngay_dat,
            'tong_tien': dh.tong_tien,
            'trang_thai': dh.trang_thai,
            'dia_chi_giao': dh.dia_chi_giao,
            'chi_tiet': chi_tiet,
        })

    return Response(data)
    
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
        ma_dh = f"DH{uuid.uuid4().hex[:8].upper()}"
        tong_tien = 0

        with transaction.atomic():
            for p in products:
                tong_tien += float(p['don_gia']) * int(p['so_luong'])

            don_hang = DonHang.objects.create(
                ma_dh=ma_dh,
                khach_hang=khach_hang,
                tong_tien=tong_tien,
                dia_chi_giao=dia_chi_giao,
                trang_thai="Chờ xử lý",
                ngay_dat=timezone.now()
            )

            # ✅ Tạo chi tiết đơn hàng và trừ số lượng tồn
            for p in products:
                sp = SanPham.objects.get(ma_sp=p['ma_sp'])
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

                sp.so_luong_ton -= int(p['so_luong'])
                sp.save()

            # ✅ Tạo thông tin thanh toán
            ThanhToan.objects.create(
                don_hang=don_hang,
                phuong_thuc=phuong_thuc_tt,
                trang_thai_tt="Chưa thanh toán"
            )

            # ✅ Xóa sản phẩm đã mua trong giỏ hàng
            try:
                gio_hang = GioHang.objects.get(khach_hang=khach_hang)
                for p in products:
                    ChiTietGio.objects.filter(gio_hang=gio_hang, san_pham__ma_sp=p['ma_sp']).delete()
            except GioHang.DoesNotExist:
                pass  # Khách chưa có giỏ hàng

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
