from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction
from .models import KhachHang, SanPham, DonHang, ChiTietDH, ThanhToan, GioHang, ChiTietGio, VanChuyen, BaoHanh

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
        chi_tiet = []
        # Thông tin vận chuyển (nếu có)
        vc = getattr(dh, 'van_chuyen', None)
        for ct in dh.chi_tiet.all():
            # Bảo hành theo chính sách sản phẩm (nếu có)
            policy = None
            try:
                bh = BaoHanh.objects.get(san_pham=ct.san_pham)
                policy = {
                    'doi_moi_ngay': bh.doi_moi_ngay,
                    'bao_hanh_thang': bh.bao_hanh_thang,
                    'mo_ta': bh.mo_ta or '',
                }
            except BaoHanh.DoesNotExist:
                bh = None
            bh_block = None
            if vc and vc.ngay_giao_thanh_cong and bh:
                from datetime import timedelta
                start = vc.ngay_giao_thanh_cong
                doi_moi_den = start + timedelta(days=bh.doi_moi_ngay)
                bao_hanh_den = start + timedelta(days=bh.bao_hanh_thang * 30)
                bh_block = {
                    'ngay_bat_dau': start,
                    'doi_moi_den_ngay': doi_moi_den,
                    'bao_hanh_den_ngay': bao_hanh_den,
                    'policy': policy,
                }
            chi_tiet.append({
                'san_pham': {
                    'ten_sp': ct.san_pham.ten_sp,
                    'hinh_anh': ct.san_pham.hinh_anh_list.first().hinh_anh.url if ct.san_pham.hinh_anh_list.first() else '',
                },
                'so_luong': ct.so_luong,
                'don_gia': ct.don_gia,
                'thanh_tien': ct.thanh_tien,
                'bao_hanh': bh_block,
            })

        vc_info = None
        if vc:
            vc_info = {
                'trang_thai': vc.trang_thai,
                'nha_vc': vc.nha_vc,
                'ma_van_don': vc.ma_van_don,
                'ngay_du_kien': vc.ngay_du_kien,
                'cap_nhat_cuoi': vc.cap_nhat_cuoi,
                'ghi_chu': vc.ghi_chu,
                'ngay_giao_thanh_cong': vc.ngay_giao_thanh_cong,
            }

        data.append({
            'ma_dh': dh.ma_dh,
            'ngay_dat': dh.ngay_dat,
            'tong_tien': dh.tong_tien,
            'trang_thai': dh.trang_thai,
            'dia_chi_giao': dh.dia_chi_giao,
            'chi_tiet': chi_tiet,
            'van_chuyen': vc_info,
        })

    return Response(data)
    
# @api_view(['POST'])
# def dat_hang(request):
#     try:
#         data = request.data
#         khach_hang_id = data.get('khach_hang_id')
#         dia_chi_giao = data.get('dia_chi_giao')
#         phuong_thuc_tt = data.get('phuong_thuc_tt')
#         products = data.get('products', [])

#         if not khach_hang_id or not products:
#             return Response({'error': 'Thiếu thông tin khách hàng hoặc sản phẩm!'}, status=status.HTTP_400_BAD_REQUEST)

#         khach_hang = KhachHang.objects.get(pk=khach_hang_id)
#         ma_dh = f"DH{uuid.uuid4().hex[:8].upper()}"
#         tong_tien = 0

#         with transaction.atomic():
#             for p in products:
#                 tong_tien += float(p['don_gia']) * int(p['so_luong'])

#             don_hang = DonHang.objects.create(
#                 ma_dh=ma_dh,
#                 khach_hang=khach_hang,
#                 tong_tien=tong_tien,
#                 dia_chi_giao=dia_chi_giao,
#                 trang_thai="Chờ xử lý",
#                 ngay_dat=timezone.now()
#             )

#             # ✅ Tạo chi tiết đơn hàng và trừ số lượng tồn
#             for p in products:
#                 sp = SanPham.objects.get(ma_sp=p['ma_sp'])
#                 if sp.so_luong_ton < p['so_luong']:
#                     raise ValueError(f"Sản phẩm {sp.ten_sp} không đủ hàng.")

#                 thanh_tien = float(p['don_gia']) * int(p['so_luong'])
#                 ChiTietDH.objects.create(
#                     don_hang=don_hang,
#                     san_pham=sp,
#                     so_luong=p['so_luong'],
#                     don_gia=p['don_gia'],
#                     thanh_tien=thanh_tien
#                 )

#                 sp.so_luong_ton -= int(p['so_luong'])
#                 sp.save()

#             # ✅ Tạo thông tin thanh toán
#             ThanhToan.objects.create(
#                 don_hang=don_hang,
#                 phuong_thuc=phuong_thuc_tt,
#                 trang_thai_tt="Chưa thanh toán"
#             )

#             # ✅ Xóa sản phẩm đã mua trong giỏ hàng
#             try:
#                 gio_hang = GioHang.objects.get(khach_hang=khach_hang)
#                 for p in products:
#                     ChiTietGio.objects.filter(gio_hang=gio_hang, san_pham__ma_sp=p['ma_sp']).delete()
#             except GioHang.DoesNotExist:
#                 pass  # Khách chưa có giỏ hàng

#         return Response({
#             'success': True,
#             'message': 'Đặt hàng thành công!',
#             'ma_don_hang': ma_dh,
#             'tong_tien': tong_tien
#         }, status=status.HTTP_201_CREATED)

#     except KhachHang.DoesNotExist:
#         return Response({'error': 'Không tìm thấy khách hàng!'}, status=status.HTTP_404_NOT_FOUND)
#     except Exception as e:
#         return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Tối ưu hóa hàm dat_hang để kiểm tra tồn kho sớm hơn

@api_view(['POST'])
def dat_hang(request):
    try:
        data = request.data
        khach_hang_id = data.get('khach_hang_id')
        dia_chi_giao = data.get('dia_chi_giao')
        phuong_thuc_tt = data.get('phuong_thuc_tt')
        products = data.get('products', [])

        if not khach_hang_id or not products or not dia_chi_giao or not phuong_thuc_tt:
            return Response({'error': 'Thiếu thông tin bắt buộc (khách hàng, sản phẩm, địa chỉ hoặc phương thức TT)!'}, status=status.HTTP_400_BAD_REQUEST)

        khach_hang = KhachHang.objects.get(pk=khach_hang_id)
        ma_dh = f"DH{uuid.uuid4().hex[:8].upper()}"
        tong_tien = 0
        
        # Tạo dictionary để lưu trữ thông tin sản phẩm (để tránh query lại)
        product_details = {} 

        with transaction.atomic():
            
            # 1️⃣ Kiểm tra tồn kho và Tính tổng tiền
            for p in products:
                ma_sp = p.get('ma_sp')
                so_luong_mua = int(p.get('so_luong', 0))
                don_gia = float(p.get('don_gia', 0))

                sp = SanPham.objects.get(ma_sp=ma_sp)

                if sp.so_luong_ton < so_luong_mua:
                    raise ValueError(f"Sản phẩm {sp.ten_sp} (Mã {ma_sp}) không đủ hàng. Tồn kho: {sp.so_luong_ton}, Yêu cầu: {so_luong_mua}.")
                
                if so_luong_mua <= 0:
                    raise ValueError("Số lượng sản phẩm phải lớn hơn 0.")

                tong_tien += don_gia * so_luong_mua
                product_details[ma_sp] = sp # Lưu object SanPham

            # 2️⃣ Tạo đơn hàng
            don_hang = DonHang.objects.create(
                ma_dh=ma_dh,
                khach_hang=khach_hang,
                tong_tien=tong_tien,
                dia_chi_giao=dia_chi_giao,
                trang_thai="Chờ xử lý",
                ngay_dat=timezone.now()
            )

            # 3️⃣ Tạo chi tiết đơn hàng và Cập nhật tồn kho
            for p in products:
                ma_sp = p.get('ma_sp')
                so_luong_mua = int(p.get('so_luong', 0))
                don_gia = float(p.get('don_gia', 0))
                sp = product_details[ma_sp] # Lấy object đã query sẵn

                thanh_tien = don_gia * so_luong_mua
                ChiTietDH.objects.create(
                    don_hang=don_hang,
                    san_pham=sp,
                    so_luong=so_luong_mua,
                    don_gia=don_gia,
                    thanh_tien=thanh_tien
                )

                sp.so_luong_ton -= so_luong_mua
                sp.save()

            # 4️⃣ Tạo thông tin thanh toán
            ThanhToan.objects.create(
                don_hang=don_hang,
                phuong_thuc=phuong_thuc_tt,
                trang_thai_tt="Chưa thanh toán"
            )

            # 5️⃣ Khởi tạo thông tin vận chuyển mặc định cho đơn hàng
            try:
                from datetime import date, timedelta, datetime
                now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                vc = VanChuyen.objects.create(
                    don_hang=don_hang,
                    trang_thai='Chờ lấy hàng',
                    nha_vc='Nội bộ',
                    ngay_du_kien=date.today() + timedelta(days=3),
                    ghi_chu=f"{now}: Tạo đơn hàng, chờ xử lý"
                )
            except Exception:
                pass

            # 6️⃣ Xóa sản phẩm đã mua trong giỏ hàng
            try:
                gio_hang = GioHang.objects.get(khach_hang=khach_hang)
                for p in products:
                    ChiTietGio.objects.filter(gio_hang=gio_hang, san_pham__ma_sp=p['ma_sp']).delete()
            except GioHang.DoesNotExist:
                pass

        return Response({
            'success': True,
            'message': 'Đặt hàng thành công!',
            'ma_don_hang': ma_dh,
            'tong_tien': tong_tien
        }, status=status.HTTP_201_CREATED)

    except KhachHang.DoesNotExist:
        return Response({'error': 'Không tìm thấy khách hàng!'}, status=status.HTTP_404_NOT_FOUND)
    except SanPham.DoesNotExist:
         return Response({'error': 'Sản phẩm trong đơn hàng không tồn tại!'}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as ve:
         return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def buynow_preview(request):
    """Preview dữ liệu Checkout cho nút Mua Ngay.
    Query params: ma_sp (int), so_luong (int, default 1)
    Trả về: { products: [...], totalPrice }
    """
    try:
        ma_sp = int(request.query_params.get('ma_sp', '0'))
        so_luong = int(request.query_params.get('so_luong', '1'))
        if ma_sp <= 0 or so_luong <= 0:
            return Response({'error': 'Thiếu hoặc sai ma_sp/so_luong'}, status=400)
        sp = SanPham.objects.get(ma_sp=ma_sp)
        don_gia = float(sp.gia)
        thanh_tien = don_gia * so_luong
        img_rel = sp.hinh_anh_list.first().hinh_anh.url if sp.hinh_anh_list.first() else ''
        product = {
            'id': sp.ma_sp,
            'ten_sp': sp.ten_sp,
            'hinh_anh': img_rel,
            'so_luong': so_luong,
            'don_gia': don_gia,
            'thanh_tien': thanh_tien,
        }
        return Response({'products': [product], 'totalPrice': thanh_tien})
    except SanPham.DoesNotExist:
        return Response({'error': 'Sản phẩm không tồn tại'}, status=404)
    except ValueError:
        return Response({'error': 'Tham số không hợp lệ'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
def huy_don_hang_khach(request):
    """Khách hàng hủy đơn hàng của chính mình khi đơn còn 'Chờ xử lý'.
    body: { ten_dang_nhap, ma_dh, ly_do? }
    """
    data = request.data or {}
    username = (data.get('ten_dang_nhap') or '').strip()
    ma_dh = (data.get('ma_dh') or '').strip()
    ly_do = (data.get('ly_do') or '').strip()
    if not username or not ma_dh:
        return Response({'error': 'Thiếu tên đăng nhập hoặc mã đơn'}, status=400)
    try:
        kh = KhachHang.objects.get(ten_dang_nhap=username)
    except KhachHang.DoesNotExist:
        return Response({'error': 'Không tìm thấy khách hàng'}, status=404)
    try:
        dh = DonHang.objects.get(ma_dh=ma_dh, khach_hang=kh)
    except DonHang.DoesNotExist:
        return Response({'error': 'Không tìm thấy đơn hàng'}, status=404)
    # Chỉ cho phép hủy khi chưa xác nhận
    if (dh.trang_thai or '').strip() != 'Chờ xử lý':
        return Response({'error': 'Đơn hàng đã được xử lý, không thể hủy'}, status=400)
    # Hủy đơn
    dh.trang_thai = 'Đã hủy'
    dh.save(update_fields=['trang_thai'])
    # Cập nhật vận chuyển
    from datetime import datetime
    vc, _ = VanChuyen.objects.get_or_create(don_hang=dh)
    vc.trang_thai = 'Đã hủy'
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    note = vc.ghi_chu or ''
    more = f"{ts}: Khách hàng hủy đơn"
    if ly_do:
        more += f" - {ly_do}"
    vc.ghi_chu = (note + "\n" if note else '') + more
    vc.save(update_fields=['trang_thai', 'ghi_chu'])
    return Response({'message': 'Đã hủy đơn hàng', 'ma_dh': dh.ma_dh})
