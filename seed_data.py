import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from products.models import Category, Product

categories_data = [
    {"name": "Earrings", "slug": "earrings", "tagline": "Whispers for the ear"},
    {"name": "Necklaces", "slug": "necklaces", "tagline": "Worn close to the heart"},
    {"name": "Rings", "slug": "rings", "tagline": "Promises in crystal"},
    {"name": "Bracelets", "slug": "bracelets", "tagline": "Heirlooms in motion"},
]

category_objs = {}
for cat in categories_data:
    obj, created = Category.objects.get_or_create(
        slug=cat["slug"],
        defaults={"name": cat["name"], "tagline": cat["tagline"]}
    )
    category_objs[cat["slug"]] = obj

products_data = [
    {
        "sku": "SK-EAR-001",
        "name": "Amethyst Whisper Drops",
        "price": 248.00,
        "category_slug": "earrings",
        "tag": "bestseller",
        "description": "Hand-set teardrop amethyst crystals cradled in a hypoallergenic alloy.",
        "stock": 7,
    },
    {
        "sku": "SK-NECK-001",
        "name": "Violet Teardrop Pendant",
        "price": 186.00,
        "category_slug": "necklaces",
        "tag": "new",
        "description": "A single faceted crystal teardrop suspended on a delicate woven chain.",
        "stock": 12,
    },
    {
        "sku": "SK-RING-001",
        "name": "Lavender Stack Trio",
        "price": 312.00,
        "category_slug": "rings",
        "tag": "limited",
        "description": "Three stackable bands, each crowned with a hand-cut lavender crystal.",
        "stock": 3,
    },
    {
        "sku": "SK-BRAC-001",
        "name": "Heritage Floral Cuff",
        "price": 524.00,
        "category_slug": "bracelets",
        "tag": "bestseller",
        "description": "An engraved alloy cuff inspired by old-world florals.",
        "stock": 5,
    },
]

for prod in products_data:
    cat = category_objs[prod["category_slug"]]
    Product.objects.get_or_create(
        sku=prod["sku"],
        defaults={
            "name": prod["name"],
            "price": prod["price"],
            "category": cat,
            "tag": prod["tag"],
            "description": prod["description"],
            "stock": prod["stock"],
        }
    )

print("Database successfully seeded with initial categories and products!")
