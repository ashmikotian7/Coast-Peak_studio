from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    ProductViewSet,
    ProductTagListView,
    ProductGroupedByTagView,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'items', ProductViewSet)

urlpatterns = [
    # Grouped endpoint (all tags in a single call)
    path('by-tag/', ProductGroupedByTagView.as_view(), name='product-grouped-by-tag'),

    # Direct tag shortcuts
    path('new/', ProductTagListView.as_view(), {'tag': 'new'}, name='product-tag-new'),
    path('bestsellers/', ProductTagListView.as_view(), {'tag': 'bestseller'}, name='product-tag-bestsellers'),
    path('bestseller/', ProductTagListView.as_view(), {'tag': 'bestseller'}, name='product-tag-bestseller-alias'),
    path('limited/', ProductTagListView.as_view(), {'tag': 'limited'}, name='product-tag-limited'),

    # Dynamic tag route (e.g. /api/products/tags/new/, /api/products/tags/bestsellers/, etc.)
    path('tags/<str:tag>/', ProductTagListView.as_view(), name='product-tag-list'),

    # Standard model viewsets (/api/products/items/, /api/products/categories/)
    path('', include(router.urls)),
]
