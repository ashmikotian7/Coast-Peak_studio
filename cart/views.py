from decimal import Decimal
from django.db import transaction
from rest_framework import views, status, permissions
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse
from products.models import Product
from .models import Cart, CartItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    CartItemAddSerializer,
    CartItemUpdateSerializer,
    CartMergeSerializer,
)


class CartDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Retrieve user cart",
        description="Retrieve the authenticated user's active cart with computed totals and item statuses.",
        responses={200: CartSerializer}
    )
    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CartItemAddView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Add item to cart",
        description="Add a product or increment its quantity in the user's cart, enforcing inventory stock limits.",
        request=CartItemAddSerializer,
        responses={
            201: OpenApiResponse(description="Item successfully added or incremented"),
            400: OpenApiResponse(description="Stock exceeded or invalid product"),
        }
    )
    def post(self, request):
        serializer = CartItemAddSerializer(data=request.data)
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
                cart_item = CartItem.objects.create(
                    cart=cart,
                    product=product,
                    quantity=quantity
                )

        return Response(
            {
                'id': cart_item.id,
                'product_id': str(product.id),
                'quantity': cart_item.quantity,
                'message': 'Item added to cart',
            },
            status=status.HTTP_201_CREATED
        )


class CartItemDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Update cart item quantity",
        description="Set the quantity of a cart item. If quantity is 0, the item is removed.",
        request=CartItemUpdateSerializer,
        responses={
            200: OpenApiResponse(description="Quantity updated or item removed"),
            400: OpenApiResponse(description="Stock exceeded"),
            404: OpenApiResponse(description="Item not found"),
        }
    )
    def patch(self, request, pk):
        serializer = CartItemUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        quantity = serializer.validated_data['quantity']

        try:
            cart_item = CartItem.objects.select_related('product', 'cart').get(
                id=pk,
                cart__user=request.user
            )
        except CartItem.DoesNotExist:
            return Response(
                {'detail': 'Cart item not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if quantity == 0:
            item_id = cart_item.id
            cart_item.delete()
            return Response(
                {
                    'id': item_id,
                    'quantity': 0,
                    'item_total': 0.00,
                    'message': 'Item removed from cart'
                },
                status=status.HTTP_200_OK
            )

        if quantity > cart_item.product.stock:
            return Response(
                {
                    'error': f"Requested quantity exceeds available stock (Only {cart_item.product.stock} left in stock)."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = quantity
        cart_item.save()

        return Response(
            {
                'id': cart_item.id,
                'quantity': cart_item.quantity,
                'item_total': float(cart_item.item_total)
            },
            status=status.HTTP_200_OK
        )

    @extend_schema(
        summary="Remove item from cart",
        description="Permanently remove an item from the user's cart.",
        responses={
            204: OpenApiResponse(description="Item removed successfully"),
            404: OpenApiResponse(description="Item not found"),
        }
    )
    def delete(self, request, pk):
        try:
            cart_item = CartItem.objects.get(id=pk, cart__user=request.user)
        except CartItem.DoesNotExist:
            return Response(
                {'detail': 'Cart item not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartClearView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Clear user cart",
        description="Empty all items currently in the user's cart.",
        responses={200: OpenApiResponse(description="Cart cleared successfully")}
    )
    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        return Response(
            {'message': 'Cart cleared successfully'},
            status=status.HTTP_200_OK
        )


class CartMergeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Merge guest cart items",
        description="Migrate local storage guest items into the user's persistent cart upon login or signup.",
        request=CartMergeSerializer,
        responses={200: CartSerializer}
    )
    def post(self, request):
        serializer = CartMergeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        items_data = serializer.validated_data['items']

        with transaction.atomic():
            cart, _ = Cart.objects.get_or_create(user=request.user)

            for item_data in items_data:
                product_id = item_data['product_id']
                qty = item_data['quantity']

                try:
                    product = Product.objects.get(id=product_id, is_active=True)
                except (Product.DoesNotExist, ValueError):
                    continue

                if product.stock <= 0:
                    continue

                cart_item = CartItem.objects.filter(cart=cart, product=product).first()
                if cart_item:
                    new_qty = min(cart_item.quantity + qty, product.stock)
                    if new_qty > 0:
                        cart_item.quantity = new_qty
                        cart_item.save()
                else:
                    new_qty = min(qty, product.stock)
                    if new_qty > 0:
                        CartItem.objects.create(
                            cart=cart,
                            product=product,
                            quantity=new_qty
                        )

        # Refresh cart and return full representation
        cart.refresh_from_db()
        return Response(
            CartSerializer(cart, context={'request': request}).data,
            status=status.HTTP_200_OK
        )
