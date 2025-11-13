from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.api' 
    def ready(self):
        # Đăng ký signals cho realtime cập nhật
        try:
            from . import signals  # noqa: F401
        except Exception:
            # Tránh làm hỏng startup nếu lỗi bất ngờ trong môi trường dev
            pass
        # Tạo admin mặc định nếu chưa có (dev convenience)
        try:
            from django.conf import settings
            from django.db.utils import OperationalError, ProgrammingError
            from .models import QuanTri
            if not QuanTri.objects.exists():
                # Có thể lấy từ ENV, nếu không thì đặt mặc định
                email = getattr(settings, 'DEFAULT_ADMIN_EMAIL', 'admin@example.com')
                username = getattr(settings, 'DEFAULT_ADMIN_USERNAME', 'admin')
                password = getattr(settings, 'DEFAULT_ADMIN_PASSWORD', 'admin123')
                qt = QuanTri(ho_ten='Quản trị viên', email=email, ten_dang_nhap=username, mat_khau=password, vai_tro='admin')
                qt.save()
        except (OperationalError, ProgrammingError):
            # Bảng chưa migrate
            pass
        except Exception:
            pass
