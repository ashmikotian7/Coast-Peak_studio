from django.urls import path
from .views import (
    WishlistListView,
    WishlistToggleView,
    WishlistItemDeleteView,
    WishlistMoveToCartView,
    WishlistMergeView,
)

urlpatterns = [
    path('', WishlistListView.as_view(), name='wishlist-list'),
    path('toggle/', WishlistToggleView.as_view(), name='wishlist-toggle'),
    path('items/<str:product_id>/', WishlistItemDeleteView.as_view(), name='wishlist-item-delete'),
    path('move-to-cart/', WishlistMoveToCartView.as_view(), name='wishlist-move-to-cart'),
    path('merge/', WishlistMergeView.as_view(), name='wishlist-merge'),
]
