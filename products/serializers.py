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
            if isinstance(category_val, str) and not category_val.isdigit():
                category_obj = Category.objects.filter(
                    Q(slug__iexact=category_val.strip()) | Q(name__iexact=category_val.strip())
                ).first()
                if category_obj:
                    data['category'] = category_obj.id

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

