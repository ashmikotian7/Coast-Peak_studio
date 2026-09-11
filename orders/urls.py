from django.urls import path
from .views import (
    CheckoutAPIView,
    OrderTrackingAPIView,
    OrderDropdownListView,
    OrderStatusUpdateAPIView,
    OrderListAPIView,
    OrderHistoryAPIView,
)

urlpatterns = [
    # Customer Order History (GET/POST /api/orders/history/)
    path('history/', OrderHistoryAPIView.as_view(), name='orders-history'),
    path('user-history/', OrderHistoryAPIView.as_view(), name='orders-user-history'),

    # All orders list (e.g. GET /api/orders/ or GET /api/orders/all/)
    path('', OrderListAPIView.as_view(), name='orders-list'),
    path('all/', OrderListAPIView.as_view(), name='orders-all'),

    # Dropdown and list of orders for the user with products
    path('dropdown/', OrderDropdownListView.as_view(), name='orders-dropdown'),
    path('user-orders/', OrderDropdownListView.as_view(), name='orders-user-list'),

    # Order tracking status update (PATCH or POST)
    path('track/<str:order_number>/status/', OrderStatusUpdateAPIView.as_view(), name='order-status-update'),
    path('status/', OrderStatusUpdateAPIView.as_view(), name='order-status-update-direct'),
    path('update-status/', OrderStatusUpdateAPIView.as_view(), name='order-status-update-alias'),

    # Order tracking endpoints (status, timeline, user, and products)
    path('track/', OrderTrackingAPIView.as_view(), name='track-query'),
    path('track-status/', OrderTrackingAPIView.as_view(), name='track-status'),
    path('track/<str:order_number>/', OrderTrackingAPIView.as_view(), name='track-detail'),

    # Checkout
    path('checkout/', CheckoutAPIView.as_view(), name='checkout'),
]
