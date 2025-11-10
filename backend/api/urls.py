from django.urls import path

# 1. Imports từ views.py (Sản phẩm & Giỏ hàng)
from .views import get_all_sanpham, SanPhamDetailAPIView, GioHangView, top_selling_products 

# 2. Imports từ views_dathang.py (Đặt hàng)
from .views_dathang import dat_hang, danh_sach_don_hang

# 3. Imports từ views_login.py (Xác thực/Auth)
from .views_login import register_khach_hang, login_khach_hang, reset_password, request_otp


urlpatterns = [
    # API Sản phẩm và Chi tiết
    path('products/', get_all_sanpham, name='get_all_sanpham'),
    path('products/<int:pk>/', SanPhamDetailAPIView.as_view(), name='product-detail'),
    path('products/top/', top_selling_products, name='top-products'),
    
    # API Giỏ hàng
    path('giohang/', GioHangView.as_view(), name='gio_hang'),
    
    # API Đặt hàng và Đơn hàng
    path('dathang/', dat_hang, name='dat_hang'),
    path('donhang/', danh_sach_don_hang, name='danh_sach_don_hang'),
    
    # API Xác thực (Auth)
    path('auth/register/', register_khach_hang, name='register'),
    path('auth/login/', login_khach_hang, name='login'),
    path('auth/reset-password/', reset_password, name='reset_password'),
    path('auth/request-otp/', request_otp, name='request_otp'),
]
