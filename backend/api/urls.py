from django.urls import path
from django.http import JsonResponse, StreamingHttpResponse
import json

# 1. Imports từ views.py (Sản phẩm & Giỏ hàng)
from .views import get_all_sanpham, SanPhamDetailAPIView, GioHangView, top_selling_products, header_counts 
from .views_address import DiaChiView, LocationsView

# 2. Imports từ views_dathang.py (Đặt hàng)
from .views_dathang import dat_hang, danh_sach_don_hang, buynow_preview, huy_don_hang_khach
from .views_admin import (
    AdminLoginView, AdminOverviewView, OrdersManageView, StoreSettingsView,
    StaffOverviewView, StaffOrdersView, AdminProductsView, AdminProductItemView,
    AdminProductImagesView, AdminProductImageItemView, AdminProductWarrantyView,
    AdminStaffsView, AdminStaffItemView
)
from . import realtime

# 3. Imports từ views_login.py (Xác thực/Auth)
from .views_login import register_khach_hang, login_khach_hang, reset_password, request_otp


urlpatterns = [
    # API Sản phẩm và Chi tiết
    path('products/', get_all_sanpham, name='get_all_sanpham'),
    path('products/<int:pk>/', SanPhamDetailAPIView.as_view(), name='product-detail'),
    path('products/top/', top_selling_products, name='top-products'),
    path('header/counts/', header_counts, name='header-counts'),
    # Địa chỉ nhận hàng
    path('address/', DiaChiView.as_view(), name='address'),
    # Địa lý VN
    path('locations/', LocationsView.as_view(), name='locations'),
    
    # API Giỏ hàng
    path('giohang/', GioHangView.as_view(), name='gio_hang'),
    
    # API Đặt hàng và Đơn hàng
    path('dathang/', dat_hang, name='dat_hang'),
    path('donhang/', danh_sach_don_hang, name='danh_sach_don_hang'),
    path('donhang/cancel/', huy_don_hang_khach, name='huy_don_hang_khach'),
    path('buynow/', buynow_preview, name='buynow_preview'),
    # SSE realtime stream
    path('stream/', lambda request: _sse_stream(request), name='sse_stream'),
    
    # API Xác thực (Auth)
    path('auth/register/', register_khach_hang, name='register'),
    path('auth/login/', login_khach_hang, name='login'),
    path('auth/reset-password/', reset_password, name='reset_password'),
    path('auth/request-otp/', request_otp, name='request_otp'),
    # Health check (không đụng DB)
    path('health/', lambda request: JsonResponse({"status": "ok"})),
    # Admin
    path('admin/login/', AdminLoginView.as_view(), name='admin_login'),
    path('admin/overview/', AdminOverviewView.as_view(), name='admin_overview'),
    path('admin/orders/manage/', OrdersManageView.as_view(), name='admin_orders_manage'),
    path('admin/store/settings/', StoreSettingsView.as_view(), name='admin_store_settings'),
    path('admin/staff/overview/', StaffOverviewView.as_view(), name='admin_staff_overview'),
    path('admin/staff/orders/', StaffOrdersView.as_view(), name='admin_staff_orders'),
    # Admin products
    path('admin/products/', AdminProductsView.as_view(), name='admin_products'),
    path('admin/products/<int:pk>/', AdminProductItemView.as_view(), name='admin_product_item'),
    path('admin/products/<int:pk>/images/', AdminProductImagesView.as_view(), name='admin_product_images'),
    path('admin/products/<int:pk>/images/<int:img_id>/', AdminProductImageItemView.as_view(), name='admin_product_image_item'),
    path('admin/products/<int:pk>/warranty/', AdminProductWarrantyView.as_view(), name='admin_product_warranty'),
    # Admin staffs
    path('admin/staffs/', AdminStaffsView.as_view(), name='admin_staffs'),
    path('admin/staffs/<int:pk>/', AdminStaffItemView.as_view(), name='admin_staff_item'),
]


def _sse_stream(request):
    chans_param = request.GET.get('channels') or ''
    username = (request.GET.get('ten_dang_nhap') or '').strip() or None
    raw = [c.strip() for c in chans_param.split(',') if c.strip()]
    keys = []
    for c in raw:
        keys.append(realtime._key(c, username))
    if not keys:
        keys = ['heartbeat']
    sub = realtime.subscribe(keys)

    def event_stream():
        hello = { 'channel': 'hello', 'username': username, 'payload': { 'subscribed': keys } }
        yield b"event: hello\n"
        yield ("data: " + json.dumps(hello) + "\n\n").encode('utf-8')
        for chunk in sub.stream():
            yield chunk

    resp = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    resp['Cache-Control'] = 'no-cache'
    resp['X-Accel-Buffering'] = 'no'
    return resp
