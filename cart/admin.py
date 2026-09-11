from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('created_at', 'updated_at', 'item_total')


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_items', 'subtotal', 'created_at', 'updated_at')
    search_fields = ('user__email', 'user__full_name')
    readonly_fields = ('created_at', 'updated_at', 'total_items', 'subtotal')
    inlines = [CartItemInline]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'cart', 'product', 'quantity', 'item_total', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('cart__user__email', 'product__name')
