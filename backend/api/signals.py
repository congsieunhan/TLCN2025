from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import DiaChiNhanHang, ChiTietGio, DonHang, VanChuyen
from . import realtime


def _username_from_order(dh: DonHang):
    try:
        return dh.khach_hang.ten_dang_nhap
    except Exception:
        return None


@receiver(post_save, sender=ChiTietGio)
@receiver(post_delete, sender=ChiTietGio)
def cart_changed(sender, instance: ChiTietGio, **kwargs):
    try:
        user = instance.gio_hang.khach_hang.ten_dang_nhap
    except Exception:
        user = None
    realtime.publish('header_counts', { 'reason': 'cart_changed' }, username=user)


@receiver(post_save, sender=DiaChiNhanHang)
@receiver(post_delete, sender=DiaChiNhanHang)
def address_changed(sender, instance: DiaChiNhanHang, **kwargs):
    try:
        user = instance.khach_hang.ten_dang_nhap
    except Exception:
        user = None
    realtime.publish('addresses', { 'reason': 'address_changed' }, username=user)


@receiver(post_save, sender=DonHang)
def order_created_or_updated(sender, instance: DonHang, created, **kwargs):
    user = _username_from_order(instance)
    realtime.publish('orders', { 'reason': 'order_created' if created else 'order_updated', 'ma_dh': instance.ma_dh }, username=user)


@receiver(post_save, sender=VanChuyen)
def shipping_updated(sender, instance: VanChuyen, created, **kwargs):
    user = _username_from_order(instance.don_hang)
    realtime.publish('orders', { 'reason': 'shipping_created' if created else 'shipping_updated', 'ma_dh': instance.don_hang.ma_dh }, username=user)

