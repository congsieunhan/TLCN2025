from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Q
from datetime import datetime, date
from django.utils import timezone

from django.contrib.auth.hashers import check_password

from .models import QuanTri, SanPham, DonHang, KhachHang, VanChuyen, HinhAnhSanPham, BaoHanh
from .serializers import SanPhamSerializer, HinhAnhSanPhamSerializer


class AdminLoginView(APIView):
    def post(self, request):
        data = request.data or {}
        username = (data.get('ten_dang_nhap') or '').strip()
        password = (data.get('mat_khau') or '').strip()
        if not username or not password:
            return Response({ 'error': 'Thiếu tên đăng nhập hoặc mật khẩu' }, status=status.HTTP_400_BAD_REQUEST)
        try:
            ad = QuanTri.objects.get(ten_dang_nhap=username)
            if not check_password(password, ad.mat_khau):
                return Response({ 'error': 'Sai mật khẩu' }, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'ma_qt': ad.ma_qt,
                'ten_dang_nhap': ad.ten_dang_nhap,
                'email': ad.email,
                'ho_ten': ad.ho_ten,
                'vai_tro': ad.vai_tro,
            })
        except QuanTri.DoesNotExist:
            return Response({ 'error': 'Tài khoản quản trị không tồn tại' }, status=status.HTTP_404_NOT_FOUND)


class AdminOverviewView(APIView):
    def get(self, request):
        # Có thể kiểm tra vai trò đơn giản qua query param (tạm thời)
        # Trong thực tế nên dùng JWT/session + permission.
        # Ở đây chỉ nhằm mục đích hiển thị nhanh UI quản trị.
        username = (request.query_params.get('ten_dang_nhap_admin') or '').strip()
        if username:
            try:
                QuanTri.objects.get(ten_dang_nhap=username)
            except QuanTri.DoesNotExist:
                return Response({ 'error': 'Tài khoản quản trị không hợp lệ' }, status=400)
        counts = {
            'san_pham': SanPham.objects.count(),
            'don_hang': DonHang.objects.count(),
            'khach_hang': KhachHang.objects.count(),
        }
        tong_doanh_thu = DonHang.objects.aggregate(total=Sum('tong_tien'))['total'] or 0
        return Response({ 'counts': counts, 'tong_doanh_thu': tong_doanh_thu })


def _get_admin(request):
    # Lấy quản trị từ param ten_dang_nhap_admin (tạm thời, chưa dùng session/JWT)
    username = (request.data.get('ten_dang_nhap_admin') if isinstance(getattr(request, 'data', None), dict) else None) or (request.query_params.get('ten_dang_nhap_admin') or '')
    username = (username or '').strip()
    if not username:
        return None
    try:
        return QuanTri.objects.get(ten_dang_nhap=username)
    except QuanTri.DoesNotExist:
        return None


class OrdersManageView(APIView):
    """Quản lý đơn hàng cho Admin/Quản lý cửa hàng: xác nhận, bàn giao vận chuyển, cập nhật mã vận đơn."""
    def post(self, request):
        ad = _get_admin(request)
        if not ad:
            return Response({ 'error': 'Thiếu hoặc sai thông tin quản trị' }, status=401)
        role = (ad.vai_tro or '').strip()
        is_admin = role == 'admin'
        # Nhân viên cửa hàng: chỉ được xác nhận đơn; các thao tác khác chỉ dành cho admin
        # Vẫn hỗ trợ tên vai trò cũ để tương thích dữ liệu sẵn có
        is_staff = role in ('nhan_vien', 'quan_ly', 'quan_tri')
        if not (is_admin or is_staff):
            return Response({ 'error': 'Không có quyền' }, status=403)
        data = request.data or {}
        action = (data.get('action') or '').strip()
        ma_dh = (data.get('ma_dh') or '').strip()
        if not action or not ma_dh:
            return Response({ 'error': 'Thiếu action hoặc ma_dh' }, status=400)
        # Nhân viên có quyền thao tác đầy đủ vòng đời đơn hàng (confirm/ship/deliver/cancel)
        try:
            dh = DonHang.objects.get(ma_dh=ma_dh)
        except DonHang.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy đơn hàng' }, status=404)

        ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        actor = ad.ten_dang_nhap
        if action == 'confirm':
            # Xác nhận đơn
            dh.trang_thai = 'Đã xác nhận'
            dh.save(update_fields=['trang_thai'])
            vc, _ = VanChuyen.objects.get_or_create(don_hang=dh)
            note = vc.ghi_chu or ''
            vc.ghi_chu = (note + "\n" if note else '') + f"{ts}: Đơn đã được xác nhận (by {actor})"
            vc.save(update_fields=['ghi_chu'])
        elif action == 'ship':
            # Giao cho đơn vị vận chuyển
            nha_vc = (data.get('nha_vc') or '').strip() or 'Nội bộ'
            ma_van_don = (data.get('ma_van_don') or '').strip()
            ngay_du_kien = (data.get('ngay_du_kien') or '').strip()
            _ndk = None
            if ngay_du_kien:
                try:
                    _ndk = datetime.strptime(ngay_du_kien, '%Y-%m-%d').date()
                except Exception:
                    return Response({ 'error': 'ngay_du_kien không đúng định dạng YYYY-MM-DD' }, status=400)
            vc, _ = VanChuyen.objects.get_or_create(don_hang=dh)
            vc.trang_thai = 'Đang giao'
            vc.nha_vc = nha_vc
            vc.ma_van_don = ma_van_don or vc.ma_van_don
            vc.ngay_du_kien = _ndk
            note = vc.ghi_chu or ''
            more = f"{ts}: Bàn giao vận chuyển ({nha_vc})"
            if ma_van_don:
                more += f", mã vận đơn {ma_van_don}"
            more += f" (by {actor})"
            vc.ghi_chu = (note + "\n" if note else '') + more
            vc.save()
            dh.trang_thai = 'Đang giao hàng'
            dh.save(update_fields=['trang_thai'])
        elif action == 'deliver':
            # Đánh dấu đã giao thành công
            dh.trang_thai = 'Đã hoàn thành'
            dh.save(update_fields=['trang_thai'])
            vc, _ = VanChuyen.objects.get_or_create(don_hang=dh)
            vc.trang_thai = 'Giao thành công'
            note = vc.ghi_chu or ''
            vc.ghi_chu = (note + "\n" if note else '') + f"{ts}: Giao thành công (by {actor})"
            vc.ngay_giao_thanh_cong = timezone.now()
            vc.save(update_fields=['trang_thai', 'ghi_chu', 'ngay_giao_thanh_cong'])
        elif action == 'cancel':
            # Hủy đơn
            reason = (data.get('ly_do') or '').strip()
            dh.trang_thai = 'Đã hủy'
            dh.save(update_fields=['trang_thai'])
            vc, _ = VanChuyen.objects.get_or_create(don_hang=dh)
            vc.trang_thai = 'Đã hủy'
            note = vc.ghi_chu or ''
            more = f"{ts}: Hủy đơn (by {actor})"
            if reason:
                more += f" - {reason}"
            vc.ghi_chu = (note + "\n" if note else '') + more
            vc.save(update_fields=['trang_thai', 'ghi_chu'])
        else:
            return Response({ 'error': 'action không hợp lệ' }, status=400)

        # Trả về tóm tắt đơn hàng
        resp = {
            'ma_dh': dh.ma_dh,
            'trang_thai': dh.trang_thai,
        }
        try:
            vc = dh.van_chuyen
            resp['van_chuyen'] = {
                'trang_thai': vc.trang_thai,
                'nha_vc': vc.nha_vc,
                'ma_van_don': vc.ma_van_don,
                'ngay_du_kien': vc.ngay_du_kien,
            }
        except VanChuyen.DoesNotExist:
            pass
        return Response(resp)


class StoreSettingsView(APIView):
    """Quản trị cập nhật cấu hình cửa hàng cơ bản (tên, hotline, địa chỉ). Lưu file JSON."""
    def get(self, request):
        from pathlib import Path
        import json
        p = Path(__file__).resolve().parent / 'data' / 'store_settings.json'
        if not p.exists():
            return Response({ 'name': 'Cửa hàng', 'hotline': '', 'address': '' })
        try:
            with open(p, 'r', encoding='utf-8') as f:
                return Response(json.load(f))
        except Exception:
            return Response({ 'name': 'Cửa hàng', 'hotline': '', 'address': '' })

    def post(self, request):
        ad = _get_admin(request)
        if not ad:
            return Response({ 'error': 'Thiếu hoặc sai thông tin quản trị' }, status=401)
        if (ad.vai_tro or '') != 'admin':
            return Response({ 'error': 'Chỉ admin được phép cập nhật cấu hình' }, status=403)
        from pathlib import Path
        import json
        data = request.data or {}
        payload = {
            'name': (data.get('name') or '').strip() or 'Cửa hàng',
            'hotline': (data.get('hotline') or '').strip(),
            'address': (data.get('address') or '').strip(),
        }
        p = Path(__file__).resolve().parent / 'data' / 'store_settings.json'
        try:
            p.parent.mkdir(parents=True, exist_ok=True)
            with open(p, 'w', encoding='utf-8') as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            return Response(payload)
        except Exception as e:
            return Response({ 'error': str(e) }, status=400)


class AdminProductsView(APIView):
    """Danh sách/tạo sản phẩm (Admin-only)."""
    def get(self, request):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        q = (request.query_params.get('q') or '').strip()
        qs = SanPham.objects.all().order_by('-ma_sp')
        if q:
            qs = qs.filter(Q(ten_sp__icontains=q) | Q(hang_sx__icontains=q))
        data = [
            {
                'ma_sp': sp.ma_sp,
                'ten_sp': sp.ten_sp,
                'hang_sx': sp.hang_sx,
                'gia': float(sp.gia),
                'so_luong_ton': sp.so_luong_ton,
                'tinh_trang': sp.tinh_trang,
            }
            for sp in qs[:500]
        ]
        return Response(data)

    def post(self, request):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        d = request.data or {}
        try:
            sp = SanPham.objects.create(
                ten_sp=(d.get('ten_sp') or '').strip(),
                hang_sx=(d.get('hang_sx') or '').strip(),
                gia=float(d.get('gia') or 0),
                thong_so=(d.get('thong_so') or ''),
                ngay_nhap=d.get('ngay_nhap') or None,
                tinh_trang=(d.get('tinh_trang') or '').strip() or 'Còn hàng',
                so_luong_ton=int(d.get('so_luong_ton') or 0),
            )
            return Response(SanPhamSerializer(sp).data, status=201)
        except Exception as e:
            return Response({ 'error': str(e) }, status=400)


class AdminProductItemView(APIView):
    """Xem/Sửa/Xóa sản phẩm theo mã (Admin-only)."""
    def get(self, request, pk):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        try:
            sp = SanPham.objects.get(pk=pk)
            return Response(SanPhamSerializer(sp).data)
        except SanPham.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy sản phẩm' }, status=404)

    def patch(self, request, pk):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        try:
            sp = SanPham.objects.get(pk=pk)
        except SanPham.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy sản phẩm' }, status=404)
        d = request.data or {}
        try:
            if 'ten_sp' in d: sp.ten_sp = (d.get('ten_sp') or '').strip()
            if 'hang_sx' in d: sp.hang_sx = (d.get('hang_sx') or '').strip()
            if 'gia' in d: sp.gia = float(d.get('gia') or 0)
            if 'thong_so' in d: sp.thong_so = d.get('thong_so')
            if 'tinh_trang' in d: sp.tinh_trang = (d.get('tinh_trang') or '').strip()
            if 'so_luong_ton' in d: sp.so_luong_ton = int(d.get('so_luong_ton') or 0)
            sp.save()
            return Response(SanPhamSerializer(sp).data)
        except Exception as e:
            return Response({ 'error': str(e) }, status=400)

    put = patch

    def delete(self, request, pk):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        try:
            sp = SanPham.objects.get(pk=pk)
            sp.delete()
            return Response({ 'message': 'Đã xoá sản phẩm' })
        except SanPham.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy sản phẩm' }, status=404)


class AdminProductImagesView(APIView):
    """Upload/list ảnh sản phẩm (Admin-only)."""
    def post(self, request, pk):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        try:
            sp = SanPham.objects.get(pk=pk)
        except SanPham.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy sản phẩm' }, status=404)
        file = request.FILES.get('file') or request.FILES.get('image')
        if not file:
            return Response({ 'error': 'Thiếu file ảnh (file)' }, status=400)
        mo_ta = request.POST.get('mo_ta') or None
        img = HinhAnhSanPham.objects.create(san_pham=sp, hinh_anh=file, mo_ta=mo_ta)
        return Response(HinhAnhSanPhamSerializer(img).data, status=201)


class AdminProductImageItemView(APIView):
    """Xóa 1 ảnh của sản phẩm (Admin-only)."""
    def delete(self, request, pk, img_id):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        try:
            sp = SanPham.objects.get(pk=pk)
        except SanPham.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy sản phẩm' }, status=404)
        try:
            img = HinhAnhSanPham.objects.get(pk=img_id, san_pham=sp)
        except HinhAnhSanPham.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy ảnh' }, status=404)
        img.delete()
        return Response({ 'message': 'Đã xóa ảnh' })


class AdminProductWarrantyView(APIView):
    """Xem/Cập nhật chính sách bảo hành cho 1 sản phẩm (Admin-only)."""
    def get(self, request, pk):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        try:
            sp = SanPham.objects.get(pk=pk)
        except SanPham.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy sản phẩm' }, status=404)
        try:
            bh = sp.bao_hanh
            data = { 'doi_moi_ngay': bh.doi_moi_ngay, 'bao_hanh_thang': bh.bao_hanh_thang, 'mo_ta': bh.mo_ta or '' }
        except BaoHanh.DoesNotExist:
            data = { 'doi_moi_ngay': 30, 'bao_hanh_thang': 12, 'mo_ta': '' }
        return Response(data)

    def post(self, request, pk):
        return self._upsert(request, pk)

    def patch(self, request, pk):
        return self._upsert(request, pk)

    def _upsert(self, request, pk):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        try:
            sp = SanPham.objects.get(pk=pk)
        except SanPham.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy sản phẩm' }, status=404)
        d = request.data or {}
        try:
            doi_moi_ngay = int(d.get('doi_moi_ngay')) if d.get('doi_moi_ngay') is not None else 30
            bao_hanh_thang = int(d.get('bao_hanh_thang')) if d.get('bao_hanh_thang') is not None else 12
            mo_ta = (d.get('mo_ta') or '').strip()
        except Exception:
            return Response({ 'error': 'Giá trị không hợp lệ' }, status=400)
        bh, _ = BaoHanh.objects.update_or_create(
            san_pham=sp,
            defaults={ 'doi_moi_ngay': doi_moi_ngay, 'bao_hanh_thang': bao_hanh_thang, 'mo_ta': mo_ta }
        )
        return Response({ 'doi_moi_ngay': bh.doi_moi_ngay, 'bao_hanh_thang': bh.bao_hanh_thang, 'mo_ta': bh.mo_ta or '' })


class AdminStaffsView(APIView):
    """Danh sách/Tạo nhân viên (admin-only)."""
    def get(self, request):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        q = (request.query_params.get('q') or '').strip()
        qs = QuanTri.objects.filter(vai_tro='nhan_vien').order_by('-ma_qt')
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(ho_ten__icontains=q) | Q(email__icontains=q) | Q(ten_dang_nhap__icontains=q))
        data = [
            {
                'ma_qt': it.ma_qt,
                'ho_ten': it.ho_ten,
                'email': it.email,
                'ten_dang_nhap': it.ten_dang_nhap,
                'vai_tro': it.vai_tro,
            } for it in qs[:500]
        ]
        return Response(data)

    def post(self, request):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        d = request.data or {}
        ho_ten = (d.get('ho_ten') or '').strip()
        email = (d.get('email') or '').strip()
        ten = (d.get('ten_dang_nhap') or '').strip()
        mk = (d.get('mat_khau') or '').strip()
        if not (ho_ten and email and ten and mk):
            return Response({ 'error': 'Thiếu ho_ten/email/ten_dang_nhap/mat_khau' }, status=400)
        try:
            nv = QuanTri(ho_ten=ho_ten, email=email, ten_dang_nhap=ten, mat_khau=mk, vai_tro='nhan_vien')
            nv.save()
            return Response({ 'ma_qt': nv.ma_qt, 'ho_ten': nv.ho_ten, 'email': nv.email, 'ten_dang_nhap': nv.ten_dang_nhap, 'vai_tro': nv.vai_tro }, status=201)
        except Exception as e:
            return Response({ 'error': str(e) }, status=400)


class AdminStaffItemView(APIView):
    """Xem/Sửa/Xóa nhân viên (admin-only)."""
    def get(self, request, pk):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        try:
            it = QuanTri.objects.get(pk=pk, vai_tro='nhan_vien')
            return Response({ 'ma_qt': it.ma_qt, 'ho_ten': it.ho_ten, 'email': it.email, 'ten_dang_nhap': it.ten_dang_nhap, 'vai_tro': it.vai_tro })
        except QuanTri.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy nhân viên' }, status=404)

    def patch(self, request, pk):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        try:
            it = QuanTri.objects.get(pk=pk, vai_tro='nhan_vien')
        except QuanTri.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy nhân viên' }, status=404)
        d = request.data or {}
        if 'ho_ten' in d and d.get('ho_ten') is not None:
            it.ho_ten = str(d.get('ho_ten')).strip()
        if 'email' in d and d.get('email') is not None:
            it.email = str(d.get('email')).strip()
        if 'ten_dang_nhap' in d and d.get('ten_dang_nhap') is not None:
            it.ten_dang_nhap = str(d.get('ten_dang_nhap')).strip()
        if 'mat_khau' in d and d.get('mat_khau'):
            it.mat_khau = str(d.get('mat_khau'))  # sẽ được hash trong save()
        it.save()
        return Response({ 'ma_qt': it.ma_qt, 'ho_ten': it.ho_ten, 'email': it.email, 'ten_dang_nhap': it.ten_dang_nhap, 'vai_tro': it.vai_tro })

    put = patch

    def delete(self, request, pk):
        ad = _get_admin(request)
        if not ad or (ad.vai_tro or '').strip() != 'admin':
            return Response({ 'error': 'Chỉ admin mới có quyền' }, status=403)
        try:
            it = QuanTri.objects.get(pk=pk, vai_tro='nhan_vien')
            it.delete()
            return Response({ 'message': 'Đã xóa nhân viên' })
        except QuanTri.DoesNotExist:
            return Response({ 'error': 'Không tìm thấy nhân viên' }, status=404)


class StaffOverviewView(APIView):
    """Tổng quan cho Nhân viên: số lượng đơn theo trạng thái cần xử lý."""
    def get(self, request):
        ad = _get_admin(request)
        if not ad:
            return Response({ 'error': 'Thiếu hoặc sai thông tin quản trị' }, status=401)
        role = (ad.vai_tro or '').strip()
        if role not in ('nhan_vien', 'admin', 'quan_ly', 'quan_tri'):
            return Response({ 'error': 'Không có quyền' }, status=403)
        counts = {
            'cho_xu_ly': DonHang.objects.filter(trang_thai__in=['Chờ xử lý']).count(),
            'da_xac_nhan': DonHang.objects.filter(trang_thai__in=['Đã xác nhận']).count(),
            'dang_giao': DonHang.objects.filter(trang_thai__in=['Đang giao hàng']).count(),
            'giao_thanh_cong_hom_nay': DonHang.objects.filter(trang_thai='Đã hoàn thành', ngay_dat__date=date.today()).count(),
        }
        return Response(counts)


class StaffOrdersView(APIView):
    """Danh sách đơn cho Nhân viên theo trạng thái cần xử lý.
    GET params:
      - status: cho_xu_ly | da_xac_nhan | dang_giao | hoan_thanh | huy
      - q: từ khóa tìm theo mã đơn hoặc tên KH
    """
    def get(self, request):
        ad = _get_admin(request)
        if not ad:
            return Response({ 'error': 'Thiếu hoặc sai thông tin quản trị' }, status=401)
        role = (ad.vai_tro or '').strip()
        if role not in ('nhan_vien', 'admin', 'quan_ly', 'quan_tri'):
            return Response({ 'error': 'Không có quyền' }, status=403)
        status_map = {
            'cho_xu_ly': ['Chờ xử lý'],
            'da_xac_nhan': ['Đã xác nhận'],
            'dang_giao': ['Đang giao hàng'],
            'hoan_thanh': ['Đã hoàn thành'],
            'huy': ['Đã hủy'],
        }
        key = (request.query_params.get('status') or 'cho_xu_ly').strip()
        sts = status_map.get(key, ['Chờ xử lý'])
        q = (request.query_params.get('q') or '').strip().lower()
        qs = DonHang.objects.filter(trang_thai__in=sts).order_by('-ngay_dat')
        if q:
            qs = qs.filter(Q(ma_dh__icontains=q) | Q(khach_hang__ho_ten__icontains=q))
        out = []
        for dh in qs[:200]:
            vc = getattr(dh, 'van_chuyen', None)
            out.append({
                'ma_dh': dh.ma_dh,
                'khach_hang': dh.khach_hang.ho_ten,
                'tong_tien': dh.tong_tien,
                'trang_thai': dh.trang_thai,
                'ngay_dat': dh.ngay_dat,
                'van_chuyen': None if not vc else {
                    'trang_thai': vc.trang_thai,
                    'nha_vc': vc.nha_vc,
                    'ma_van_don': vc.ma_van_don,
                    'ngay_du_kien': vc.ngay_du_kien,
                    'ngay_giao_thanh_cong': vc.ngay_giao_thanh_cong,
                }
            })
        return Response(out)
