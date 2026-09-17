import base64
import uuid
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    tagline = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Product(models.Model):
    TAG_CHOICES = [
        ('new', 'New'),
        ('bestseller', 'Bestseller'),
        ('limited', 'Limited'),
    ]

    sku = models.CharField(max_length=50, unique=True, blank=True)
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    image_base64 = models.TextField(blank=True, null=True)
    tag = models.CharField(max_length=20, choices=TAG_CHOICES, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.sku:
            prefix = self.category.slug[:4].upper() if self.category and self.category.slug else "PRD"
            self.sku = f"CP-{prefix}-{uuid.uuid4().hex[:6].upper()}"

        # Persist uploaded image as base64 into PostgreSQL so it NEVER vanishes on container restarts
        if self.image and not self.image_base64:
            try:
                if hasattr(self.image, 'seek'):
                    self.image.seek(0)
                content = self.image.read()
                if hasattr(self.image, 'seek'):
                    self.image.seek(0)
                if content:
                    ext = (self.image.name.split('.')[-1] if '.' in self.image.name else 'jpeg').lower()
                    mime_type = 'image/png' if ext == 'png' else 'image/webp' if ext == 'webp' else 'image/jpeg'
                    encoded = base64.b64encode(content).decode('utf-8')
                    self.image_base64 = f"data:{mime_type};base64,{encoded}"
            except Exception as e:
                print("Error encoding image to base64:", e)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
