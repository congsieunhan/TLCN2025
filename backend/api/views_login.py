from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction, IntegrityError
from .models import KhachHang, GioHang, OTPCode
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import check_password
from datetime import timedelta
import random
import os
from django.conf import settings
# from twilio.rest import Client # Chỉ import khi cần sử dụng hàm _send_otp_sms
# import vonage # Chỉ import khi cần sử dụng hàm _send_otp_sms
# Không ép import Twilio ở mức module để tránh lỗi môi trường


# ==============================================================================
# 📦 HÀM HỖ TRỢ (PRIVATE FUNCTIONS)
# Hàm này cần được copy sang đây để độc lập
# ==============================================================================

def _normalize_phone(phone: str) -> str:
    """Chuẩn hóa SĐT: 0xxxxxxxxx -> +84xxxxxxxxx."""
    p = phone.strip().replace(' ', '')
    if p.startswith('+'):
        return p
    if p.startswith('0'):
        return '+84' + p[1:]
    return p


def _send_otp_sms(sdt: str, code: str) -> None:
    """Gửi SMS OTP qua nhà cung cấp nếu đã cấu hình env. Fail silent nếu thiếu thư viện/cấu hình."""
    provider = (os.getenv('SMS_PROVIDER') or '').lower()  # 'twilio' | 'vonage'
    text = f"Ma xac thuc OTP cua ban la: {code}. Hieu luc 5 phut."
    to = _normalize_phone(sdt)

    try:
        if provider == 'twilio':
            sid = os.getenv('TWILIO_ACCOUNT_SID')
            token = os.getenv('TWILIO_AUTH_TOKEN')
            from_num = os.getenv('TWILIO_FROM_NUMBER')
            service_sid = os.getenv('TWILIO_MESSAGING_SERVICE_SID')
            from_num = from_num.strip() if from_num else None
            if not (sid and token):
                return

            # Import cục bộ để tránh lỗi môi trường khi không cài twilio
            try:
                from twilio.rest import Client
            except Exception:
                return

            client = Client(sid, token)
            if service_sid:
                client.messages.create(to=to, messaging_service_sid=service_sid, body=text)
            elif from_num:
                client.messages.create(to=to, from_=from_num, body=text)
            else:
                return
        # elif provider == 'vonage':
        #     # Logic cho Vonage
        #     pass
        else:
            return
    except Exception:
        return


# ==============================================================================
# 🔐 API XÁC THỰC (AUTH) VÀ OTP
# ==============================================================================

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def register_khach_hang(request):
    """Đăng ký khách hàng mới (yêu cầu OTP)."""
    data = request.data or {}
    required = ["ho_ten", "email", "sdt", "dia_chi", "ten_dang_nhap", "mat_khau", "otp"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return Response({"error": f"Thiếu trường: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Xác thực OTP theo SĐT, purpose=register
        otp = OTPCode.objects.filter(
            sdt=data["sdt"].strip(), code=str(data["otp"]).strip(), purpose="register", is_used=False
        ).order_by('-created_at').first()
        
        if not otp or (hasattr(otp, 'is_valid') and not otp.is_valid()):
            return Response({"error": "Mã OTP không hợp lệ hoặc đã hết hạn"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            kh = KhachHang(
                ho_ten=data["ho_ten"].strip(),
                email=data["email"].strip(),
                sdt=data["sdt"].strip(),
                dia_chi=data["dia_chi"].strip(),
                ten_dang_nhap=data["ten_dang_nhap"].strip(),
                mat_khau=data["mat_khau"],
            )
            kh.save() 
            GioHang.objects.get_or_create(khach_hang=kh)
            
            otp.is_used = True
            otp.save()

        return Response(
            {
                "message": "Đăng ký thành công",
                "user": {
                    "ma_kh": kh.ma_kh,
                    "ten_dang_nhap": kh.ten_dang_nhap,
                    "ho_ten": kh.ho_ten,
                    "email": kh.email,
                    "sdt": kh.sdt,
                    "dia_chi": kh.dia_chi,
                },
            },
            status=status.HTTP_201_CREATED,
        )
    except IntegrityError:
        return Response({"error": "Email/SĐT/Tên đăng nhập đã tồn tại"}, status=status.HTTP_409_CONFLICT)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login_khach_hang(request):
    """Đăng nhập bằng tên_dang_nhap và mật khẩu."""
    data = request.data or {}
    username = data.get("ten_dang_nhap")
    password = data.get("mat_khau")
    if not username or not password:
        return Response({"error": "Thiếu tên đăng nhập hoặc mật khẩu"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        kh = KhachHang.objects.get(ten_dang_nhap=username)
    except KhachHang.DoesNotExist:
        return Response({"error": "Tên đăng nhập hoặc mật khẩu không đúng"}, status=status.HTTP_400_BAD_REQUEST)

    if not check_password(password, kh.mat_khau):
        return Response({"error": "Tên đăng nhập hoặc mật khẩu không đúng"}, status=status.HTTP_400_BAD_REQUEST)

    GioHang.objects.get_or_create(khach_hang=kh)

    return Response(
        {
            "message": "Đăng nhập thành công",
            "user": {
                "ma_kh": kh.ma_kh,
                "ten_dang_nhap": kh.ten_dang_nhap,
                "ho_ten": kh.ho_ten,
                "email": kh.email,
                "sdt": kh.sdt,
                "dia_chi": kh.dia_chi,
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def reset_password(request):
    """Đặt lại mật khẩu qua SĐT + OTP."""
    data = request.data or {}
    username = data.get("ten_dang_nhap")
    sdt = data.get("sdt")
    otp_code = data.get("otp")
    new_pw = data.get("mat_khau_moi")

    if not username or not sdt or not otp_code or not new_pw:
        return Response({"error": "Thiếu thông tin bắt buộc"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        kh = KhachHang.objects.get(ten_dang_nhap=username, sdt=sdt)
    except KhachHang.DoesNotExist:
        return Response({"error": "Không tìm thấy người dùng với thông tin cung cấp"}, status=status.HTTP_404_NOT_FOUND)

    otp = OTPCode.objects.filter(sdt=sdt, code=str(otp_code).strip(), purpose="reset", is_used=False).order_by('-created_at').first()
    
    if not otp or (hasattr(otp, 'is_valid') and not otp.is_valid()):
        return Response({"error": "Mã OTP không hợp lệ hoặc đã hết hạn"}, status=status.HTTP_400_BAD_REQUEST)

    kh.mat_khau = new_pw
    kh.save() 
    otp.is_used = True
    otp.save()

    return Response({"message": "Đã đặt lại mật khẩu thành công"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def request_otp(request):
    """Tạo OTP 6 số cho SĐT (register/reset)."""
    data = request.data or {}
    sdt = (data.get("sdt") or "").strip()
    ten_dn = (data.get("ten_dang_nhap") or "").strip()
    purpose = (data.get("purpose") or "").strip()
    if not sdt or purpose not in ("register", "reset"):
        return Response({"error": "Thiếu sdt hoặc purpose không hợp lệ"}, status=status.HTTP_400_BAD_REQUEST)

    if purpose == "register" and KhachHang.objects.filter(sdt=sdt).exists():
        return Response({"error": "Số điện thoại đã được sử dụng"}, status=status.HTTP_400_BAD_REQUEST)
    if purpose == "reset":
        # Nếu có cung cấp tên đăng nhập thì xác minh khớp username + SĐT
        if ten_dn:
            try:
                kh = KhachHang.objects.get(ten_dang_nhap=ten_dn)
                if kh.sdt != sdt:
                    return Response({"error": "Tên đăng nhập và SĐT không khớp"}, status=status.HTTP_400_BAD_REQUEST)
            except KhachHang.DoesNotExist:
                return Response({"error": "Không tìm thấy tài khoản"}, status=status.HTTP_404_NOT_FOUND)
        else:
            if not KhachHang.objects.filter(sdt=sdt).exists():
                return Response({"error": "Không tìm thấy tài khoản với SĐT này"}, status=status.HTTP_404_NOT_FOUND)

    # Chặn spam: không cho tạo OTP mới trong vòng 60s
    last = OTPCode.objects.filter(sdt=sdt, purpose=purpose).order_by('-created_at').first()
    if last and (timezone.now() - last.created_at) < timedelta(seconds=60):
        wait = 60 - int((timezone.now() - last.created_at).total_seconds())
        return Response({"error": f"Vui lòng thử lại sau {wait}s"}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    code = f"{random.randint(0, 999999):06d}"
    otp = OTPCode.objects.create(sdt=sdt, code=code, purpose=purpose, expires_at=timezone.now() + timedelta(minutes=5))

    _send_otp_sms(sdt, code)

    payload = {"message": "OTP đã được gửi", "expires_in": 300}
    
    if getattr(settings, 'DEBUG', False) and os.getenv('SMS_ECHO_OTP') == '1':
        payload["otp"] = code
    return Response(payload, status=status.HTTP_201_CREATED)
