from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema, OpenApiResponse
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


def normalize_tag(tag: str) -> str:
    """Normalize tags like 'best-sellers', 'bestsellers', 'best sellers' to 'bestseller'."""
    if not tag:
        return ''
    cleaned = tag.strip().lower().replace('-', '').replace('_', '').replace(' ', '')
    if cleaned in ['bestseller', 'bestsellers', 'bestselling']:
        return 'bestseller'
    if cleaned in ['new', 'newarrivals', 'newarrival']:
        return 'new'
    if cleaned in ['limited', 'limitededition']:
        return 'limited'
    return tag.strip().lower()


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
        tag = self.request.query_params.get('tag', None)
        if tag:
            normalized = normalize_tag(tag)
            queryset = queryset.filter(tag=normalized)
        return queryset


class ProductTagListView(views.APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="List products by tag",
        description="Retrieve active products matching a tag ('new', 'bestseller', 'limited').",
        responses={200: ProductSerializer(many=True)}
    )
    def get(self, request, tag=None):
        tag_param = tag or request.query_params.get('tag', '')
        normalized = normalize_tag(tag_param)
        products = Product.objects.filter(is_active=True, tag=normalized).order_by('-created_at')
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductGroupedByTagView(views.APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="List products grouped by tag",
        description="Retrieve products grouped into 'new', 'bestsellers', and 'limited' collections.",
        responses={200: OpenApiResponse(description="Object containing product arrays grouped by tag")}
    )
    def get(self, request):
        active_products = Product.objects.filter(is_active=True).order_by('-created_at')
        context = {'request': request}

        new_items = active_products.filter(tag='new')
        bestseller_items = active_products.filter(tag='bestseller')
        limited_items = active_products.filter(tag='limited')

        return Response(
            {
                'new': ProductSerializer(new_items, many=True, context=context).data,
                'bestsellers': ProductSerializer(bestseller_items, many=True, context=context).data,
                'limited': ProductSerializer(limited_items, many=True, context=context).data,
            },
            status=status.HTTP_200_OK
        )
