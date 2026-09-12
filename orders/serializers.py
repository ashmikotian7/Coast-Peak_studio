from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product

STATUS_DISPLAY_MAP = {
    'placed': 'Order Placed',
    'crafting': 'Preparing Order',
    'preparing': 'Preparing Order',
    'packed': 'Packed in Velvet',
    'shipped': 'Order Dispatched',
    'dispatched': 'Order Dispatched',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
}


def build_order_timeline(status_val: str):
    stage_map = {
        'placed': 0,
        'crafting': 1,
        'preparing': 1,
        'packed': 1,
        'shipped': 2,
        'sent': 2,
        'dispatched': 2,
        'delivered': 2,
    }

    current_idx = stage_map.get(status_val, 0)
    is_cancelled = (status_val == 'cancelled')

    stages = [
        {
            'key': 'placed',
            'title': 'Order Placed',
            'description': 'Your order has been received and confirmed.',
        },
        {
            'key': 'preparing',
            'title': 'Preparing Order',
            'description': 'The atelier is preparing and hand-finishing your piece.',
        },
        {
            'key': 'sent',
            'title': 'Order Sent',
            'description': 'Your order has been sent and is in transit.',
        },
    ]

    timeline = []
    for idx, stage in enumerate(stages):
        if is_cancelled:
            state = 'cancelled' if idx == 0 else 'upcoming'
            icon = '✕' if idx == 0 else '○'
        elif status_val == 'delivered':
            state = 'completed'
            icon = '✓'
        elif idx < current_idx:
            state = 'completed'
            icon = '✓'
        elif idx == current_idx:
            state = 'current'
            icon = '●'
        else:
            state = 'upcoming'
            icon = '○'

        timeline.append({
            'key': stage['key'],
            'title': stage['title'],
            'description': stage['description'],
            'state': state,
            'icon': icon,
        })

    return timeline


class OrderItemSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    item_total = serializers.SerializerMethodField()
    product_id = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'product_name', 'unit_price', 'quantity', 'item_total', 'image']

    def get_product_id(self, obj):
        return obj.product.id if obj.product else None

    def get_item_total(self, obj):
        return float(obj.unit_price * obj.quantity)

    def get_image(self, obj):
        if obj.product and obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None


class OrderProductDetailSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    name = serializers.CharField(source='product_name')
    price = serializers.SerializerMethodField()
    item_total = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'price', 'quantity', 'item_total', 'image']

    def get_id(self, obj):
        return str(obj.product.id) if obj.product else str(obj.id)

    def get_price(self, obj):
        return float(obj.unit_price)

    def get_item_total(self, obj):
        return float(obj.unit_price * obj.quantity)

    def get_image(self, obj):
        if obj.product and obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None


class OrderDropdownSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    products = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'label',
            'status',
            'status_display',
            'created_at',
            'total_amount',
            'user',
            'products',
        ]

    def get_label(self, obj):
        total_items = sum(item.quantity for item in obj.items.all())
        return f"Order #{obj.order_number} — {total_items} item{'s' if total_items != 1 else ''} (${float(obj.total_amount):.2f})"

    def get_status_display(self, obj):
        return STATUS_DISPLAY_MAP.get(obj.status, obj.status.title())

    def get_total_amount(self, obj):
        return float(obj.total_amount)

    def get_user(self, obj):
        return {
            'name': f"{obj.first_name} {obj.last_name}".strip(),
            'email': obj.email,
            'phone': obj.phone or '',
        }

    def get_products(self, obj):
        request = self.context.get('request')
        return OrderProductDetailSerializer(obj.items.all(), many=True, context={'request': request}).data


class OrderTrackingDetailSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='id')
    current_status = serializers.CharField(source='status')
    current_status_display = serializers.SerializerMethodField()
    is_cancelled = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()
    products = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'order_number',
            'order_id',
            'current_status',
            'current_status_display',
            'created_at',
            'updated_at',
            'is_cancelled',
            'user',
            'timeline',
            'products',
            'summary',
        ]

    def get_current_status_display(self, obj):
        return STATUS_DISPLAY_MAP.get(obj.status, obj.status.title())

    def get_is_cancelled(self, obj):
        return obj.status == 'cancelled'

    def get_user(self, obj):
        return {
            'name': f"{obj.first_name} {obj.last_name}".strip(),
            'email': obj.email,
            'phone': obj.phone or '',
            'shipping_address': {
                'street': obj.street_address,
                'city': obj.city,
                'state': obj.state,
                'zip_code': obj.zip_code,
            }
        }

    def get_timeline(self, obj):
        return build_order_timeline(obj.status)

    def get_products(self, obj):
        request = self.context.get('request')
        return OrderProductDetailSerializer(obj.items.all(), many=True, context={'request': request}).data

    def get_summary(self, obj):
        payment_display = dict(Order.PAYMENT_METHOD_CHOICES).get(obj.payment_method, obj.payment_method)
        total_items = sum(item.quantity for item in obj.items.all())
        return {
            'subtotal': float(obj.subtotal),
            'shipping_fee': float(obj.shipping_fee),
            'total_amount': float(obj.total_amount),
            'payment_method': payment_display,
            'total_items': total_items,
        }


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    shipping_address = serializers.SerializerMethodField()
    payment_method_display = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'email',
            'phone',
            'first_name',
            'last_name',
            'customer_name',
            'shipping_address',
            'street_address',
            'city',
            'state',
            'zip_code',
            'payment_method',
            'payment_method_display',
            'subtotal',
            'shipping_fee',
            'total_amount',
            'status',
            'status_display',
            'total_items',
            'created_at',
            'updated_at',
            'items',
        ]
        read_only_fields = ['order_number', 'status', 'created_at', 'updated_at']

    def get_status_display(self, obj):
        return STATUS_DISPLAY_MAP.get(obj.status, obj.status.title())

    def get_customer_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_shipping_address(self, obj):
        return {
            'street_address': obj.street_address,
            'city': obj.city,
            'state': obj.state,
            'zip_code': obj.zip_code,
            'phone': obj.phone or '',
        }

    def get_payment_method_display(self, obj):
        return dict(Order.PAYMENT_METHOD_CHOICES).get(obj.payment_method, obj.payment_method)


class CheckoutCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    street_address = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    state = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    zip_code = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    payment_method = serializers.ChoiceField(choices=['card', 'upi', 'cod', 'razorpay'], default='card')
    cart_items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)

        # 1. Check for nested shipping_address or shippingAddress object
        shipping_obj = mutable_data.get('shipping_address') or mutable_data.get('shippingAddress')
        if isinstance(shipping_obj, dict):
            if not mutable_data.get('street_address'):
                mutable_data['street_address'] = shipping_obj.get('street_address') or shipping_obj.get('street') or shipping_obj.get('address') or ''
            if not mutable_data.get('city'):
                mutable_data['city'] = shipping_obj.get('city') or ''
            if not mutable_data.get('state'):
                mutable_data['state'] = shipping_obj.get('state') or ''
            if not mutable_data.get('zip_code'):
                mutable_data['zip_code'] = shipping_obj.get('zip_code') or shipping_obj.get('zip') or shipping_obj.get('postal_code') or shipping_obj.get('pincode') or ''
            if not mutable_data.get('phone') and shipping_obj.get('phone'):
                mutable_data['phone'] = shipping_obj.get('phone')

        # 2. Map flat aliases (address -> street_address, zip/postal_code -> zip_code)
        if not mutable_data.get('street_address'):
            mutable_data['street_address'] = mutable_data.get('address') or mutable_data.get('street') or mutable_data.get('address1') or ''

        if not mutable_data.get('zip_code'):
            mutable_data['zip_code'] = mutable_data.get('zip') or mutable_data.get('postal_code') or mutable_data.get('postalCode') or mutable_data.get('pincode') or ''

        if not mutable_data.get('phone'):
            mutable_data['phone'] = mutable_data.get('phone_number') or mutable_data.get('phoneNumber') or ''

        # 3. Handle full_name / name splitting if first_name not present
        if not mutable_data.get('first_name'):
            full_name = mutable_data.get('full_name') or mutable_data.get('name') or ''
            parts = full_name.strip().split(' ', 1)
            mutable_data['first_name'] = parts[0] if parts else 'Valued'
            if len(parts) > 1 and not mutable_data.get('last_name'):
                mutable_data['last_name'] = parts[1]

        if not mutable_data.get('last_name'):
            mutable_data['last_name'] = mutable_data.get('first_name', 'Customer')

        # 4. Handle items / cart_items aliases
        if 'cart_items' not in mutable_data and 'items' in mutable_data:
            mutable_data['cart_items'] = mutable_data['items']

        # 5. Normalize payment_method (support razorpay, online, upi, cod)
        pm = str(mutable_data.get('payment_method', 'card')).lower().strip()
        if pm in ['razorpay', 'online', 'card', 'credit_card', 'debit_card', 'stripe']:
            mutable_data['payment_method'] = 'card'
        elif pm in ['upi', 'gpay', 'phonepe', 'paytm']:
            mutable_data['payment_method'] = 'upi'
        elif pm in ['cod', 'cash']:
            mutable_data['payment_method'] = 'cod'
        else:
            mutable_data['payment_method'] = 'card'

        return super().to_internal_value(mutable_data)


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.CharField(required=True)

    def validate_status(self, value):
        cleaned = value.strip().lower()
        status_map = {
            'placed': 'placed',
            'order placed': 'placed',
            'preparing': 'crafting',
            'preparing order': 'crafting',
            'crafting': 'crafting',
            'crafting & finishing': 'crafting',
            'packed': 'packed',
            'packed in velvet': 'packed',
            'shipped': 'shipped',
            'order sent': 'shipped',
            'sent': 'shipped',
            'dispatched': 'shipped',
            'order dispatched': 'shipped',
            'on its way': 'shipped',
            'delivered': 'delivered',
            'cancelled': 'cancelled',
            'canceled': 'cancelled',
        }
        if cleaned not in status_map:
            raise serializers.ValidationError(
                f"Invalid status '{value}'. Allowed: placed, preparing, packed, dispatched (shipped), delivered, cancelled."
            )
        return status_map[cleaned]
