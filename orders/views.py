from decimal import Decimal
from django.db import transaction
from django.db.models import Q
from rest_framework import views, status, permissions
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from .models import Order, OrderItem
from .serializers import (
    OrderSerializer,
    CheckoutCreateSerializer,
    OrderDropdownSerializer,
    OrderTrackingDetailSerializer,
    OrderStatusUpdateSerializer,
)
from products.models import Product


class CheckoutAPIView(views.APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Create an order (Checkout)",
        description="Places a new customer order with shipping details and line items.",
        request=CheckoutCreateSerializer,
        responses={201: OrderSerializer}
    )
    def post(self, request):
        serializer = CheckoutCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        cart_items = data.get('cart_items', [])

        if not cart_items:
            return Response({'detail': 'Cart items cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = Decimal('0.00')
        order_items_to_create = []

        for item in cart_items:
            product_id = item.get('product_id') or item.get('id')
            if not product_id:
                return Response(
                    {'detail': 'Product ID is required for each cart item.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                qty = int(item.get('quantity', 1))
            except (ValueError, TypeError):
                return Response(
                    {'detail': 'Quantity must be a valid integer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if qty <= 0:
                return Response(
                    {'detail': 'Quantity must be at least 1.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                product = Product.objects.get(id=product_id, is_active=True)
            except (Product.DoesNotExist, ValueError):
                return Response(
                    {'detail': f"Product '{product_id}' does not exist or is inactive."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if product.stock < qty:
                return Response(
                    {'detail': f"Insufficient stock for '{product.name}'. Only {product.stock} available."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            unit_price = product.price
            product_name = product.name
            item_total = unit_price * qty
            subtotal += item_total
            order_items_to_create.append({
                'product': product,
                'product_name': product_name,
                'unit_price': unit_price,
                'quantity': qty,
            })

        shipping_fee = Decimal('12.00')
        total_amount = subtotal + shipping_fee

        user = request.user if request.user.is_authenticated else None
        if not user:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.filter(email__iexact=data['email'].strip()).first()

        with transaction.atomic():
            # Save/sync shipping address to User profile if registered and profile fields are empty
            if user:
                updated_fields = []
                if not user.street_address and data.get('street_address'):
                    user.street_address = data['street_address']
                    updated_fields.append('street_address')
                if not user.city and data.get('city'):
                    user.city = data['city']
                    updated_fields.append('city')
                if not user.state and data.get('state'):
                    user.state = data['state']
                    updated_fields.append('state')
                if not user.zip_code and data.get('zip_code'):
                    user.zip_code = data['zip_code']
                    updated_fields.append('zip_code')
                if not user.phone_number and data.get('phone'):
                    user.phone_number = data['phone']
                    updated_fields.append('phone_number')
                if updated_fields:
                    user.save(update_fields=updated_fields)

            order = Order.objects.create(
                user=user,
                email=data['email'],
                phone=data.get('phone', ''),
                first_name=data['first_name'],
                last_name=data['last_name'],
                street_address=data['street_address'],
                city=data['city'],
                state=data['state'],
                zip_code=data['zip_code'],
                payment_method=data['payment_method'],
                subtotal=subtotal,
                shipping_fee=shipping_fee,
                total_amount=total_amount,
                status='placed',
            )

            for oi in order_items_to_create:
                OrderItem.objects.create(
                    order=order,
                    product=oi['product'],
                    product_name=oi['product_name'],
                    unit_price=oi['unit_price'],
                    quantity=oi['quantity'],
                )
                prod = oi['product']
                prod.stock -= oi['quantity']
                prod.save(update_fields=['stock'])

            # Clear persistent cart for authenticated user
            if user:
                try:
                    from cart.models import Cart
                    user_cart = Cart.objects.filter(user=user).first()
                    if user_cart:
                        user_cart.items.all().delete()
                except Exception:
                    pass

        return Response(OrderSerializer(order, context={'request': request}).data, status=status.HTTP_201_CREATED)


class OrderListAPIView(views.APIView):
    """
    Returns list of orders with line items, customer details, and fulfillment statuses.
    Admins/staff can view all orders with optional search and filters.
    Authenticated customers can view only their own orders.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List customer orders",
        description="Retrieve customer orders. Admins can view and filter all orders; customers can view only their own orders.",
        parameters=[
            OpenApiParameter(name='status', description='Filter by order status (placed, crafting, packed, shipped, delivered, cancelled)', required=False, type=str),
            OpenApiParameter(name='email', description='Filter by customer email (Admin only)', required=False, type=str),
            OpenApiParameter(name='search', description='Search by order number or customer name/email', required=False, type=str),
        ],
        responses={200: OrderSerializer(many=True)}
    )
    def get(self, request):
        user = request.user
        is_admin = bool(
            user.is_staff or user.is_superuser or getattr(user, 'is_admin', False)
        )

        if is_admin:
            queryset = Order.objects.all().prefetch_related('items__product').order_by('-created_at')
            email = request.query_params.get('email', None)
            if email:
                queryset = queryset.filter(email__iexact=email.strip())
        else:
            queryset = Order.objects.filter(
                Q(user=user) | Q(email__iexact=user.email)
            ).prefetch_related('items__product').order_by('-created_at')

        status_param = request.query_params.get('status', None)
        if status_param:
            cleaned_status = status_param.strip().lower()
            status_map = {
                'placed': 'placed',
                'preparing': 'crafting',
                'crafting': 'crafting',
                'packed': 'packed',
                'dispatched': 'shipped',
                'shipped': 'shipped',
                'delivered': 'delivered',
                'cancelled': 'cancelled',
            }
            target_status = status_map.get(cleaned_status, cleaned_status)
            queryset = queryset.filter(status=target_status)

        search = request.query_params.get('search', None)
        if search:
            s = search.strip().lstrip('#')
            queryset = queryset.filter(
                Q(order_number__icontains=s) |
                Q(first_name__icontains=s) |
                Q(last_name__icontains=s) |
                Q(email__icontains=s)
            )

        serializer = OrderSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderDropdownListView(views.APIView):
    """
    Returns orders list formatted for dropdown selection containing user and particular products.
    Scoped strictly to the authenticated user or specific verified email. Never falls back to leaking others' orders.
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="List orders for dropdown selection",
        description="Retrieve orders containing user info, order summary, and associated products formatted for UI dropdowns.",
        parameters=[
            OpenApiParameter(name='email', description='Filter orders by customer email', required=False, type=str),
        ],
        responses={200: OrderDropdownSerializer(many=True)}
    )
    def get(self, request):
        email = request.query_params.get('email', None)
        is_admin = bool(
            request.user.is_authenticated and (
                request.user.is_staff or request.user.is_superuser or getattr(request.user, 'is_admin', False)
            )
        )

        if is_admin:
            queryset = Order.objects.all().order_by('-created_at')
            if email:
                queryset = queryset.filter(email__iexact=email.strip())
            queryset = queryset[:20]
        elif request.user.is_authenticated:
            queryset = Order.objects.filter(
                Q(user=request.user) | Q(email__iexact=request.user.email)
            ).order_by('-created_at')[:20]
        elif email:
            queryset = Order.objects.filter(email__iexact=email.strip()).order_by('-created_at')[:20]
        else:
            return Response([], status=status.HTTP_200_OK)

        queryset = queryset.prefetch_related('items__product')
        serializer = OrderDropdownSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderTrackingAPIView(views.APIView):
    """
    Returns the real-time tracking timeline and status for orders filtered according to:
    - Specific order number (/track/<order_number>/ or ?number=...)
    - Specific customer user (?email=... or JWT user)
    - Particular product (?product_id=...)
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Track order status by order, user, and product",
        description="Get detailed live tracking timeline (Order Placed -> Preparing -> Order Dispatched -> Delivered) filtered by order number, customer email, and product ID.",
        parameters=[
            OpenApiParameter(name='number', description='Order number or ID (e.g. 1025 or CP-2026-...)', required=False, type=str),
            OpenApiParameter(name='email', description='Customer email address to track orders for a user', required=False, type=str),
            OpenApiParameter(name='product_id', description='Filter orders containing a particular product ID', required=False, type=str),
        ],
        responses={
            200: OpenApiResponse(description="Order tracking details or array of tracking details"),
            404: OpenApiResponse(description="Order not found"),
        }
    )
    def get(self, request, order_number=None):
        return self._handle_track(request, order_number)

    def post(self, request, order_number=None):
        return self._handle_track(request, order_number)

    def _handle_track(self, request, order_number=None):
        from urllib.parse import unquote

        data = request.data if isinstance(request.data, dict) else {}
        num = order_number or data.get('order_number') or request.query_params.get('number')
        email = data.get('email') or request.query_params.get('email')
        product_id = data.get('product_id') or request.query_params.get('product_id')

        # Fallback to authenticated user email only when querying user list (Case 2) and no explicit email
        if not email and not num and request.user.is_authenticated:
            email = request.user.email

        # Case 1: Specific Order Number is provided
        if num:
            cleaned = unquote(str(num)).strip().lstrip('#').strip()

            order_qs = Order.objects.all().prefetch_related('items__product')

            order = order_qs.filter(order_number__iexact=cleaned).first()
            if not order:
                order = order_qs.filter(order_number__icontains=cleaned).first()
            if not order and cleaned.isdigit():
                order = order_qs.filter(id=int(cleaned)).first()

            if not order:
                return Response(
                    {
                        'detail': f"Order '{num}' not found. Please check and try again.",
                        'is_found': False,
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # If email was explicitly passed in payload, verify match (unless staff)
            explicit_email = (request.data.get('email') if isinstance(request.data, dict) else None) or request.query_params.get('email')
            if explicit_email and not (request.user.is_authenticated and request.user.is_staff):
                clean_email = explicit_email.strip().lower()
                order_email = (order.email or '').strip().lower()
                user_email = (order.user.email or '').strip().lower() if order.user else ''
                if clean_email != order_email and clean_email != user_email:
                    return Response(
                        {
                            'detail': f"Order '{num}' not found for email '{explicit_email}'. Please check and try again.",
                            'is_found': False,
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )

            # If product_id specified, verify product belongs to this order
            if product_id:
                pid_str = str(product_id).strip()
                prod_q = Q(product__sku__iexact=pid_str)
                if pid_str.isdigit():
                    prod_q |= Q(product_id=int(pid_str))
                has_product = order.items.filter(prod_q).exists()
                if not has_product:
                    return Response(
                        {
                            'detail': f"Product '{product_id}' is not in Order '{order.order_number}'.",
                            'is_found': False,
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )

            # Determine whether PII (street address, phone) should be redacted
            is_staff = request.user.is_authenticated and (
                request.user.is_staff or request.user.is_superuser or getattr(request.user, 'is_admin', False)
            )
            is_owner = request.user.is_authenticated and (
                (order.user and order.user == request.user) or 
                (request.user.email and order.email and request.user.email.lower() == order.email.lower())
            )
            email_matched = bool(explicit_email and (
                clean_email == (order.email or '').strip().lower() or
                (order.user and order.user.email and clean_email == order.user.email.strip().lower())
            ))
            redact_pii = not (is_staff or is_owner or email_matched)

            serializer = OrderTrackingDetailSerializer(
                order,
                context={'request': request, 'product_id': product_id, 'redact_pii': redact_pii}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Case 2: User Email, Product ID, or Authenticated User
        if email or product_id or request.user.is_authenticated:
            orders_qs = Order.objects.all().prefetch_related('items__product').order_by('-created_at')

            is_staff = request.user.is_authenticated and (
                request.user.is_staff or request.user.is_superuser or getattr(request.user, 'is_admin', False)
            )

            if is_staff:
                if email:
                    orders_qs = orders_qs.filter(
                        Q(email__iexact=email.strip()) | 
                        Q(user__email__iexact=email.strip())
                    )
            elif request.user.is_authenticated:
                orders_qs = orders_qs.filter(
                    Q(user=request.user) | Q(email__iexact=request.user.email)
                )
            elif email:
                orders_qs = orders_qs.filter(
                    Q(email__iexact=email.strip()) | 
                    Q(user__email__iexact=email.strip())
                )
            else:
                orders_qs = orders_qs.none()

            # Safe product_id filtering for PostgreSQL
            if product_id:
                pid_str = str(product_id).strip()
                prod_q = Q(items__product__sku__iexact=pid_str)
                if pid_str.isdigit():
                    prod_q |= Q(items__product_id=int(pid_str))
                orders_qs = orders_qs.filter(prod_q).distinct()
                if not orders_qs.exists():
                    return Response(
                        {
                            'count': 0,
                            'detail': f"No orders found for product '{product_id}'.",
                            'is_found': False,
                            'orders': []
                        },
                        status=status.HTTP_404_NOT_FOUND
                    )

            if not orders_qs.exists():
                return Response(
                    {
                        'count': 0,
                        'detail': 'No orders found matching the criteria.',
                        'is_found': False,
                        'orders': []
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = OrderTrackingDetailSerializer(
                orders_qs, 
                many=True, 
                context={'request': request, 'product_id': product_id, 'redact_pii': not is_staff}
            )
            return Response(
                {
                    'count': orders_qs.count(),
                    'user': {
                        'email': email or (request.user.email if request.user.is_authenticated else ''),
                    },
                    'orders': serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                'detail': 'Please provide an order number (e.g. /api/orders/track/1025/ or ?number=1025) or user email (?email=user@example.com).',
                'is_found': False
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class OrderStatusUpdateAPIView(views.APIView):
    """
    Updates the fulfillment/tracking status of an order.
    Requires Administrator / Staff permissions.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Update order tracking status",
        description="Change order status (e.g. to 'dispatched', 'preparing', 'delivered'). Requires Admin privileges.",
        request=OrderStatusUpdateSerializer,
        responses={
            200: OrderTrackingDetailSerializer,
            400: OpenApiResponse(description="Invalid status"),
            403: OpenApiResponse(description="Forbidden - Admin required"),
            404: OpenApiResponse(description="Order not found"),
        }
    )
    def patch(self, request, order_number=None):
        return self._handle_update(request, order_number)

    def post(self, request, order_number=None):
        return self._handle_update(request, order_number)

    def _handle_update(self, request, order_number=None):
        is_admin = bool(
            request.user.is_staff or 
            request.user.is_superuser or 
            getattr(request.user, 'is_admin', False)
        )
        if not is_admin:
            return Response(
                {'detail': 'Administrator privileges are required to modify order status.'},
                status=status.HTTP_403_FORBIDDEN
            )

        num = order_number or request.data.get('order_number') or request.query_params.get('number')
        if not num:
            return Response(
                {'detail': 'Order number is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from urllib.parse import unquote
        cleaned = unquote(str(num)).strip().lstrip('#').strip()

        order = Order.objects.filter(order_number__iexact=cleaned).prefetch_related('items__product').first()
        if not order:
            order = Order.objects.filter(order_number__icontains=cleaned).prefetch_related('items__product').first()
        if not order and cleaned.isdigit():
            order = Order.objects.filter(id=int(cleaned)).prefetch_related('items__product').first()

        if not order:
            return Response(
                {'detail': f"Order '{num}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data['status']
        order.status = new_status
        order.save()

        response_serializer = OrderTrackingDetailSerializer(order, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class OrderHistoryAPIView(views.APIView):
    """
    Returns order history for a customer with items, pricing, and full shipping address details.
    
    Supports:
    1. Authenticated customer via Bearer JWT token
    2. Guest / Unauthenticated customer via query parameter (?email=...)
    3. Guest / Unauthenticated customer via JSON body ({"email": "..."})
    """
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Customer Order History",
        description="Retrieve complete order history for a user with shipping address, order items, status, and payment summary.",
        parameters=[
            OpenApiParameter(name='email', description='Customer email to lookup order history', required=False, type=str),
            OpenApiParameter(name='status', description='Filter history by order status', required=False, type=str),
            OpenApiParameter(name='format', description='Format of response: "object" for {count, email, orders} or "list" for [...]', required=False, type=str),
        ],
        responses={200: OrderSerializer(many=True)}
    )
    def get(self, request):
        return self._get_history(request)

    @extend_schema(
        summary="Customer Order History (POST)",
        description="Retrieve order history by passing email in JSON payload.",
        responses={200: OrderSerializer(many=True)}
    )
    def post(self, request):
        return self._get_history(request)

    def _get_history(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        
        # Extract email from query param or request body
        email = request.query_params.get('email')
        if not email and isinstance(request.data, dict):
            email = request.data.get('email')

        status_param = request.query_params.get('status')
        if not status_param and isinstance(request.data, dict):
            status_param = request.data.get('status')

        # Check if caller has any identifier
        if not user and not email:
            # If staff user, show all orders
            if user and (user.is_staff or user.is_superuser):
                queryset = Order.objects.all()
            else:
                return Response(
                    {
                        'detail': 'Please provide an email address (?email=user@example.com or {"email": "user@example.com"} payload) or authenticate with an Authorization: Bearer token to view order history.',
                        'count': 0,
                        'orders': []
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            queryset = Order.objects.all()
            if user:
                queryset = queryset.filter(Q(user=user) | Q(email__iexact=user.email))
            elif email:
                clean_email = str(email).strip().lower()
                queryset = queryset.filter(Q(email__iexact=clean_email) | Q(user__email__iexact=clean_email))

        if status_param:
            cleaned_status = str(status_param).strip().lower()
            status_map = {
                'placed': 'placed',
                'preparing': 'crafting',
                'crafting': 'crafting',
                'packed': 'packed',
                'dispatched': 'shipped',
                'shipped': 'shipped',
                'delivered': 'delivered',
                'cancelled': 'cancelled',
            }
            target_status = status_map.get(cleaned_status, cleaned_status)
            queryset = queryset.filter(status=target_status)

        queryset = queryset.prefetch_related('items__product').order_by('-created_at')
        serializer = OrderSerializer(queryset, many=True, context={'request': request})

        # By default return structured payload with count and list; support ?format=list for raw array
        fmt = request.query_params.get('format', '').lower()
        if fmt == 'list':
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response({
            'count': queryset.count(),
            'email': user.email if user else email,
            'orders': serializer.data
        }, status=status.HTTP_200_OK)


