from django.db.models import Q
from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'tagline']


class CategorySlugOrPkRelatedField(serializers.PrimaryKeyRelatedField):
    """
    Accepts category by integer ID, string ID, slug (e.g. 'rings'), or name (e.g. 'Rings').
    Auto-creates the Category if it does not already exist in the database.
    """
    def to_internal_value(self, data):
        if isinstance(data, (list, tuple)) and len(data) > 0:
            data = data[0]
        
        # If passed as string and not purely numeric ID
        if isinstance(data, str) and not data.isdigit():
            clean_str = data.strip()
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
            return category_obj

        # If passed as numeric ID string or int
        try:
            return super().to_internal_value(data)
        except Exception:
            # Fallback attempt by slug or name
            clean_str = str(data).strip()
            clean_slug = clean_str.lower().replace(' ', '-')
            category_obj = Category.objects.filter(
                Q(slug__iexact=clean_slug) | Q(name__iexact=clean_str)
            ).first()
            if category_obj:
                return category_obj
            category_obj, _ = Category.objects.get_or_create(
                slug=clean_slug,
                defaults={
                    'name': clean_str.capitalize(),
                    'tagline': f'{clean_str.capitalize()} Collection'
                }
            )
            return category_obj


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySlugOrPkRelatedField(queryset=Category.objects.all())
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
        # Convert QueryDict or dict safely
        if hasattr(data, 'dict'):
            clean_data = data.dict()
        elif hasattr(data, 'copy'):
            clean_data = dict(data)
            # Flatten 1-element lists from QueryDict
            for k, v in clean_data.items():
                if isinstance(v, list) and len(v) == 1 and k != 'images':
                    clean_data[k] = v[0]
        else:
            clean_data = dict(data)

        # Normalize price: clean currency symbols and commas, cap to fit DecimalField(10, 2)
        price_val = clean_data.get('price')
        if isinstance(price_val, list) and len(price_val) > 0:
            price_val = price_val[0]
        if price_val is not None:
            if isinstance(price_val, str):
                price_val = price_val.replace('$', '').replace('₹', '').replace(',', '').strip()
            try:
                price_float = float(price_val)
                if price_float > 99999999.99:
                    price_float = 99999999.99
                clean_data['price'] = f"{price_float:.2f}"
            except (ValueError, TypeError):
                pass

        # Normalize Tag (handle "— None —", "none", empty strings)
        tag_val = clean_data.get('tag')
        if isinstance(tag_val, list) and len(tag_val) > 0:
            tag_val = tag_val[0]
        if tag_val in ['— None —', '— none —', 'None', 'none', '', None]:
            clean_data['tag'] = None

        return super().to_internal_value(clean_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image:
            if request:
                representation['image'] = request.build_absolute_uri(instance.image.url)
            else:
                representation['image'] = instance.image.url
        return representation
