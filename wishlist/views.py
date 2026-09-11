from django.db import transaction
from rest_framework import views, status, permissions
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse
from products.models import Product
from cart.models import Cart, CartItem
from .models import WishlistItem
from .serializers import (
    WishlistItemSerializer,
    WishlistToggleSerializer,
    WishlistMoveToCartSerializer,
    WishlistMergeSerializer,
)


class WishlistListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Retrieve user wishlist",
        description="Fetch all items saved in the user's wishlist along with a fast-lookup product_ids array.",
        responses={200: OpenApiResponse(description="List of wishlist items and bookmarked product IDs")}
    )
    def get(self, request):
        items = WishlistItem.objects.filter(user=request.user).select_related('product', 'product__category')
        serializer = WishlistItemSerializer(items, many=True, context={'request': request})
        product_ids = [str(item.product_id) for item in items]

        return Response(
            {
                'count': items.count(),
                'items': serializer.data,
                'product_ids': product_ids,
            },
            status=status.HTTP_200_OK
        )


class WishlistToggleView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Toggle product in wishlist",
        description="Add a product to the wishlist if not present, or remove it if already favorited.",
        request=WishlistToggleSerializer,
        responses={200: OpenApiResponse(description="Updated wish state for the product")}
    )
    def post(self, request):
        serializer = WishlistToggleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        product_id = serializer.validated_data['product_id']
        product = Product.objects.get(id=product_id)

        item = WishlistItem.objects.filter(user=request.user, product=product).first()
        if item:
            item.delete()
            return Response(
                {
                    'product_id': str(product.id),
                    'wished': False,
                    'message': 'Product removed from wishlist',
                },
                status=status.HTTP_200_OK
            )
        else:
            WishlistItem.objects.create(user=request.user, product=product)
            return Response(
                {
                    'product_id': str(product.id),
                    'wished': True,
                    'message': 'Product added to wishlist',
                },
                status=status.HTTP_200_OK
            )


class WishlistItemDeleteView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Remove product from wishlist",
        description="Remove a specific product directly from the user's wishlist.",
        responses={204: OpenApiResponse(description="Product removed from wishlist")}
    )
    def delete(self, request, product_id):
        try:
            item = WishlistItem.objects.get(user=request.user, product_id=product_id)
            item.delete()
        except WishlistItem.DoesNotExist:
            pass  # Idempotent deletion

        return Response(status=status.HTTP_204_NO_CONTENT)


class WishlistMoveToCartView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Move product from wishlist to cart",
        description="Atomically transfer a product from the user's wishlist into their active cart.",
        request=WishlistMoveToCartSerializer,
        responses={
            200: OpenApiResponse(description="Moved item to cart successfully"),
            400: OpenApiResponse(description="Stock exceeded or out of stock"),
        }
    )
    def post(self, request):
        serializer = WishlistMoveToCartSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        product = Product.objects.get(id=product_id)

        if product.stock <= 0:
            return Response(
                {'error': 'Product is out of stock.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            cart, _ = Cart.objects.get_or_create(user=request.user)
            cart_item = CartItem.objects.filter(cart=cart, product=product).first()

            if cart_item:
                total_qty = cart_item.quantity + quantity
                if total_qty > product.stock:
                    return Response(
                        {
                            'error': f"Requested quantity exceeds available stock (Only {product.stock} left in stock)."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                cart_item.quantity = total_qty
                cart_item.save()
            else:
                if quantity > product.stock:
                    return Response(
                        {
                            'error': f"Requested quantity exceeds available stock (Only {product.stock} left in stock)."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                CartItem.objects.create(
                    cart=cart,
                    product=product,
                    quantity=quantity
                )

            # Remove from wishlist
            WishlistItem.objects.filter(user=request.user, product=product).delete()

        return Response(
            {'message': 'Moved item to cart successfully'},
            status=status.HTTP_200_OK
        )


class WishlistMergeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Merge guest wishlist",
        description="Synchronize guest wishlist product IDs from local storage into the user's account upon authentication.",
        request=WishlistMergeSerializer,
        responses={200: OpenApiResponse(description="Updated array of bookmarked product IDs")}
    )
    def post(self, request):
        serializer = WishlistMergeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        product_ids = serializer.validated_data['product_ids']

        with transaction.atomic():
            for pid in product_ids:
                try:
                    product = Product.objects.get(id=pid, is_active=True)
                    WishlistItem.objects.get_or_create(user=request.user, product=product)
                except (Product.DoesNotExist, ValueError):
                    continue

        current_product_ids = list(
            WishlistItem.objects.filter(user=request.user)
            .values_list('product_id', flat=True)
        )

        return Response(
            {'product_ids': [str(pid) for pid in current_product_ids]},
            status=status.HTTP_200_OK
        )
