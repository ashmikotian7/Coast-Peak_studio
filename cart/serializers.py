from decimal import Decimal
from rest_framework import serializers
from products.models import Product
from .models import Cart, CartItem


class CartProductSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    category_slug = serializers.CharField(source='category.slug', read_only=True, default='')
    price = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'price',
            'image',
            'category_slug',
            'stock',
            'is_in_stock',
        ]

    def get_id(self, obj):
        return str(obj.id)

    def get_price(self, obj):
        return float(obj.price)

    def get_image(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_is_in_stock(self, obj):
        return bool(obj.is_active and obj.stock > 0)


class CartItemSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)
    item_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id',
            'quantity',
            'item_total',
            'product',
            'created_at',
            'updated_at',
        ]

    def get_item_total(self, obj):
        return float(obj.item_total)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            'id',
            'total_items',
            'subtotal',
            'items',
            'created_at',
            'updated_at',
        ]

    def get_subtotal(self, obj):
        return float(obj.subtotal)


class CartItemAddSerializer(serializers.Serializer):
    product_id = serializers.CharField(required=True)
    quantity = serializers.IntegerField(required=False, default=1, min_value=1)

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value)
        except (Product.DoesNotExist, ValueError):
            raise serializers.ValidationError("Product not found.")

        if not product.is_active:
            raise serializers.ValidationError("Product is not currently available.")

        return value


class CartItemUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(required=True, min_value=0)


class MergeItemSerializer(serializers.Serializer):
    product_id = serializers.CharField(required=True)
    quantity = serializers.IntegerField(required=False, default=1, min_value=1)


class CartMergeSerializer(serializers.Serializer):
    items = serializers.ListField(
        child=MergeItemSerializer(),
        required=True,
        allow_empty=True
    )
