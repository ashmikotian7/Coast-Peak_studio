from django.db.models import Q
from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'tagline']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    category_slug = serializers.ReadOnlyField(source='category.slug')
    sku = serializers.CharField(required=False, allow_blank=True)
    tag = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    image = serializers.ImageField(required=False, allow_null=True)
    stock = serializers.IntegerField(required=False, default=0)
    is_active = serializers.BooleanField(required=False, default=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'sku',
            'name',
            'price',
            'category',
            'category_name',
            'category_slug',
            'image',
            'tag',
            'description',
            'stock',
            'is_active',
            'created_at',
            'updated_at'
        ]

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        # Handle Category lookup if passed as name or slug (e.g. "Rings" or "rings")
        category_val = data.get('category')
        if category_val is not None:
            if isinstance(category_val, str) and not str(category_val).isdigit():
                clean_str = str(category_val).strip()
                clean_slug = clean_str.lower().replace(' ', '-')
                category_obj = Category.objects.filter(
                    Q(slug__iexact=clean_slug) | Q(name__iexact=clean_str)
                ).first()
                if not category_obj:
                    category_obj, _ = Category.objects.get_or_create(
                        slug=clean_slug,
                        defaults={
                            'name': clean_str.capitalize(),
                            'tagline': f'{clean_str.capitalize()} Collection'
                        }
                    )
                data['category'] = category_obj.id

        # Normalize price: remove currency symbols and ensure max digits <= 10 (max 8 before decimal)
        price_val = data.get('price')
        if price_val is not None:
            if isinstance(price_val, str):
                price_val = price_val.replace('$', '').replace('₹', '').replace(',', '').strip()
            try:
                price_float = float(price_val)
                # Cap at 99999999.99 to prevent DecimalField(max_digits=10, decimal_places=2) overflow
                if price_float > 99999999.99:
                    price_float = 99999999.99
                data['price'] = f"{price_float:.2f}"
            except (ValueError, TypeError):
                pass

        # Normalize Tag (handle "— None —", "none", empty strings)
        tag_val = data.get('tag')
        if tag_val in ['— None —', '— none —', 'None', 'none', '', None]:
            data['tag'] = None

        return super().to_internal_value(data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image:
            if request:
                representation['image'] = request.build_absolute_uri(instance.image.url)
            else:
                representation['image'] = instance.image.url
        return representation
