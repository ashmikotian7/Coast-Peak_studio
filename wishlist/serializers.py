from rest_framework import serializers
from products.models import Product
from .models import WishlistItem


class WishlistProductSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    category_slug = serializers.CharField(source='category.slug', read_only=True, default='')
    price = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'price',
            'image',
            'category_slug',
            'stock',
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


class WishlistItemSerializer(serializers.ModelSerializer):
    product = WishlistProductSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = [
            'id',
            'added_at',
            'product',
        ]


class WishlistToggleSerializer(serializers.Serializer):
    product_id = serializers.CharField(required=True)

    def validate_product_id(self, value):
        try:
            Product.objects.get(id=value)
        except (Product.DoesNotExist, ValueError):
            raise serializers.ValidationError("Product not found.")
        return value


class WishlistMoveToCartSerializer(serializers.Serializer):
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


class WishlistMergeSerializer(serializers.Serializer):
    product_ids = serializers.ListField(
        child=serializers.CharField(),
        required=True,
        allow_empty=True
    )
