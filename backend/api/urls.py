from django.urls import path
from . import views
from .views import GioHangView
from .views import SanPhamDetailAPIView
from .views_dathang import dat_hang
from .views_dathang import danh_sach_don_hang
urlpatterns = [
    path('products/', views.get_all_sanpham, name='get_all_sanpham'),
    path('products/<int:pk>/', SanPhamDetailAPIView.as_view(), name='product-detail'),
    path('giohang/', GioHangView.as_view(), name='gio_hang'),
    path('dathang/', dat_hang, name='dat_hang'),
    path('donhang/', danh_sach_don_hang, name='danh_sach_don_hang'),
]

