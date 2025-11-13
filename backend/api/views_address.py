from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from pathlib import Path
import csv
import re

from .models import KhachHang, DiaChiNhanHang
from .serializers import DiaChiNhanHangSerializer


class DiaChiView(APIView):
    """
    - GET: ?ten_dang_nhap=... -> danh sách địa chỉ (mặc định lên đầu)
    - POST: tạo địa chỉ mới
    - PUT/PATCH: cập nhật địa chỉ (theo id)
    - DELETE: xóa địa chỉ (theo id)
    """

    def get_kh(self, username):
        return KhachHang.objects.get(ten_dang_nhap=username)

    def get(self, request):
        username = request.query_params.get('ten_dang_nhap')
        if not username:
            return Response({"error": "Thiếu tên đăng nhập"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            kh = self.get_kh(username)
            qs = DiaChiNhanHang.objects.filter(khach_hang=kh).order_by('-mac_dinh', '-updated_at')
            return Response(DiaChiNhanHangSerializer(qs, many=True).data)
        except KhachHang.DoesNotExist:
            return Response({"error": "Không tìm thấy khách hàng"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        data = request.data or {}
        username = data.get('ten_dang_nhap')
        if not username:
            return Response({"error": "Thiếu tên đăng nhập"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            kh = self.get_kh(username)
            mac_dinh = bool(data.get('mac_dinh'))
            # Validate địa bàn (Tỉnh/TP và Phường/Xã) bắt buộc
            tinh_tp = (data.get('tinh_tp') or '').strip()
            phuong_xa = (data.get('phuong_xa') or '').strip()
            if not tinh_tp or not phuong_xa:
                return Response({
                    "error": "Vui lòng chọn đầy đủ Tỉnh/TP và Phường/Xã"
                }, status=status.HTTP_400_BAD_REQUEST)
            # Validate thông tin liên hệ tối thiểu
            ho_ten = (data.get('ho_ten') or '').strip()
            sdt = (data.get('sdt') or '').replace(' ', '').strip()
            dia_chi_ct = (data.get('dia_chi_chi_tiet') or '').strip()
            if not ho_ten:
                return Response({"error": "Vui lòng nhập Họ tên người nhận"}, status=status.HTTP_400_BAD_REQUEST)
            if not sdt or not re.match(r'^\+?\d{8,15}$', sdt):
                return Response({"error": "Số điện thoại không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)
            if not dia_chi_ct:
                return Response({"error": "Vui lòng nhập Địa chỉ chi tiết"}, status=status.HTTP_400_BAD_REQUEST)
            # Nếu là địa chỉ đầu tiên, tự động đặt làm mặc định
            if not DiaChiNhanHang.objects.filter(khach_hang=kh).exists():
                mac_dinh = True
            # Nếu là địa chỉ mặc định, bỏ cờ các địa chỉ khác
            if mac_dinh:
                DiaChiNhanHang.objects.filter(khach_hang=kh).update(mac_dinh=False)
            obj = DiaChiNhanHang.objects.create(
                khach_hang=kh,
                ho_ten=ho_ten,
                sdt=sdt,
                tinh_tp=tinh_tp,
                phuong_xa=phuong_xa,
                dia_chi_chi_tiet=dia_chi_ct,
                mac_dinh=mac_dinh,
            )
            return Response(DiaChiNhanHangSerializer(obj).data, status=status.HTTP_201_CREATED)
        except KhachHang.DoesNotExist:
            return Response({"error": "Không tìm thấy khách hàng"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        data = request.data or {}
        username = data.get('ten_dang_nhap')
        addr_id = data.get('id')
        if not username or not addr_id:
            return Response({"error": "Thiếu tên đăng nhập hoặc id địa chỉ"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            kh = self.get_kh(username)
            addr = DiaChiNhanHang.objects.get(id=addr_id, khach_hang=kh)
            # Cập nhật có điều kiện và validate nhẹ
            if 'ho_ten' in data and data.get('ho_ten') is not None:
                addr.ho_ten = str(data.get('ho_ten')).strip()
            if 'sdt' in data and data.get('sdt') is not None:
                _sdt = str(data.get('sdt')).replace(' ', '').strip()
                if not _sdt or not re.match(r'^\+?\d{8,15}$', _sdt):
                    return Response({"error": "Số điện thoại không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)
                addr.sdt = _sdt
            # Nếu thay đổi địa bàn thì yêu cầu đủ cả Tỉnh/TP và Phường/Xã
            will_set_tinh = ('tinh_tp' in data and data.get('tinh_tp') is not None)
            will_set_phuong = ('phuong_xa' in data and data.get('phuong_xa') is not None)
            if will_set_tinh ^ will_set_phuong:
                return Response({"error": "Khi cập nhật địa bàn, vui lòng cung cấp cả Tỉnh/TP và Phường/Xã"}, status=status.HTTP_400_BAD_REQUEST)
            if will_set_tinh and will_set_phuong:
                _tinh = str(data.get('tinh_tp')).strip()
                _phuong = str(data.get('phuong_xa')).strip()
                if not _tinh or not _phuong:
                    return Response({"error": "Tỉnh/TP và Phường/Xã không được để trống"}, status=status.HTTP_400_BAD_REQUEST)
                addr.tinh_tp = _tinh
                addr.phuong_xa = _phuong
            if 'dia_chi_chi_tiet' in data and data.get('dia_chi_chi_tiet') is not None:
                _d = str(data.get('dia_chi_chi_tiet')).strip()
                if not _d:
                    return Response({"error": "Địa chỉ chi tiết không được để trống"}, status=status.HTTP_400_BAD_REQUEST)
                addr.dia_chi_chi_tiet = _d
            if 'mac_dinh' in data:
                mac = bool(data.get('mac_dinh'))
                if mac:
                    DiaChiNhanHang.objects.filter(khach_hang=kh).update(mac_dinh=False)
                addr.mac_dinh = mac
            addr.save()
            return Response(DiaChiNhanHangSerializer(addr).data)
        except KhachHang.DoesNotExist:
            return Response({"error": "Không tìm thấy khách hàng"}, status=status.HTTP_404_NOT_FOUND)
        except DiaChiNhanHang.DoesNotExist:
            return Response({"error": "Không tìm thấy địa chỉ"}, status=status.HTTP_404_NOT_FOUND)

    patch = put

    def delete(self, request):
        data = request.data or {}
        username = data.get('ten_dang_nhap') or request.query_params.get('ten_dang_nhap')
        addr_id = data.get('id') or request.query_params.get('id')
        if not username or not addr_id:
            return Response({"error": "Thiếu tên đăng nhập hoặc id địa chỉ"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            kh = self.get_kh(username)
            addr = DiaChiNhanHang.objects.filter(id=addr_id, khach_hang=kh).first()
            if not addr:
                return Response({"error": "Không tìm thấy địa chỉ"}, status=status.HTTP_404_NOT_FOUND)
            was_default = addr.mac_dinh
            addr.delete()
            # Nếu vừa xóa địa chỉ mặc định và còn địa chỉ khác, đặt mặc định cái gần đây nhất
            if was_default:
                next_addr = DiaChiNhanHang.objects.filter(khach_hang=kh).order_by('-updated_at', '-created_at').first()
                if next_addr:
                    next_addr.mac_dinh = True
                    next_addr.save(update_fields=['mac_dinh'])
            return Response({"message": "Đã xóa địa chỉ"})
        except KhachHang.DoesNotExist:
            return Response({"error": "Không tìm thấy khách hàng"}, status=status.HTTP_404_NOT_FOUND)

class LocationsView(APIView):
    # --------------- helpers ---------------
    def _is_ward_level(self, cap: str) -> bool:
        lvl = (cap or '').strip().lower()
        return lvl in ('phường', 'phuong', 'xã', 'xa')

    def _load_cleaned_csv(self):
        data_dir = Path(__file__).resolve().parent / 'data'
        csv_path = data_dir / 'cleaned_wards.csv'
        if not csv_path.exists():
            return None
        provinces = {}
        try:
            with open(csv_path, 'r', encoding='utf-8-sig', newline='') as f:
                reader = csv.DictReader(f, delimiter=';')
                for r in reader:
                    ma_tp = (r.get('Ma_TP') or r.get('Mã TP') or '').strip()
                    tinh_tp = (r.get('Tinh_ThanhPho') or r.get('Tỉnh / Thành Phố') or '').strip()
                    ma = (r.get('Ma') or r.get('Mã') or '').strip()
                    ten = (r.get('Ten') or r.get('Tên') or '').strip()
                    cap = (r.get('Cap') or r.get('Cấp') or '').strip()
                    if not ma_tp and not tinh_tp:
                        continue
                    provinces.setdefault(ma_tp, { 'code': ma_tp, 'name': tinh_tp, 'wards': [] })
                    if self._is_ward_level(cap) and ma and ten:
                        provinces[ma_tp]['wards'].append({ 'code': ma, 'name': ten })
            return { 'provinces': list(provinces.values()) }
        except Exception:
            return None

    # ---------------- endpoint -------------
    def get(self, request):
        level = request.query_params.get('level', 'province')
        province_code = request.query_params.get('province_code')
        data = self._load_cleaned_csv() or { 'provinces': [] }
        provinces = data.get('provinces', [])

        # Fallback name map from the same data
        name_map = { (p.get('code') or '').strip(): (p.get('name') or '').strip()
                     for p in provinces if (p.get('code') or '').strip() and (p.get('name') or '').strip() }

        if level == 'province':
            seen_codes = set()
            out = []
            for p in provinces:
                code = (p.get('code') or '').strip()
                name = (p.get('name') or '').strip()
                # Fallback: resolve name by code from any source if missing or accidentally equal code
                if (not name) or (name == code):
                    name = name_map.get(code, name or code)
                if not code or code in seen_codes:
                    continue
                seen_codes.add(code)
                out.append({ 'code': code, 'name': name })
            # Sắp xếp theo mã (số) rồi theo tên để ổn định hiển thị
            def _num(s):
                try:
                    return int(s)
                except Exception:
                    return 999
            out.sort(key=lambda x: (_num(x['code']), x['name']))
            return Response(out)

        if level == 'ward':
            if not province_code:
                return Response({"error": "Thiếu province_code"}, status=status.HTTP_400_BAD_REQUEST)
            for p in provinces:
                if (p.get('code') or '').strip() == province_code:
                    wards = p.get('wards') or []
                    norm = [{ 'code': (w.get('code') or '').strip(), 'name': (w.get('name') or '').strip() } for w in wards]
                    # Sắp xếp theo tên để dễ tìm
                    norm = sorted(norm, key=lambda w: (w['name'], w['code']))
                    return Response(norm)
            return Response([])

        return Response({"error": "level không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)
