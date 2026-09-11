from django.urls import path
from .views import (
    CartDetailView,
    CartItemAddView,
    CartItemDetailView,
    CartClearView,
    CartMergeView,
)

urlpatterns = [
    path('', CartDetailView.as_view(), name='cart-detail'),
    path('items/', CartItemAddView.as_view(), name='cart-item-add'),
    path('items/<int:pk>/', CartItemDetailView.as_view(), name='cart-item-detail'),
    path('clear/', CartClearView.as_view(), name='cart-clear'),
    path('merge/', CartMergeView.as_view(), name='cart-merge'),
]
