from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from products.models import Category, Product


class ProductTagAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Rings', slug='rings')

        self.p_new = Product.objects.create(
            name='New Ring',
            price=Decimal('100.00'),
            category=self.category,
            tag='new',
            stock=5,
            is_active=True
        )
        self.p_best = Product.objects.create(
            name='Bestseller Ring',
            price=Decimal('150.00'),
            category=self.category,
            tag='bestseller',
            stock=10,
            is_active=True
        )
        self.p_limited = Product.objects.create(
            name='Limited Ring',
            price=Decimal('200.00'),
            category=self.category,
            tag='limited',
            stock=2,
            is_active=True
        )
        self.p_none = Product.objects.create(
            name='Standard Ring',
            price=Decimal('80.00'),
            category=self.category,
            tag=None,
            stock=5,
            is_active=True
        )

    def test_get_new_products(self):
        res = self.client.get('/api/products/new/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], 'New Ring')
        self.assertEqual(res.data[0]['tag'], 'new')

    def test_get_bestseller_products(self):
        res = self.client.get('/api/products/bestsellers/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], 'Bestseller Ring')
        self.assertEqual(res.data[0]['tag'], 'bestseller')

        # Also test /api/products/bestseller/ alias
        res_alias = self.client.get('/api/products/bestseller/')
        self.assertEqual(res_alias.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_alias.data), 1)

    def test_get_limited_products(self):
        res = self.client.get('/api/products/limited/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], 'Limited Ring')
        self.assertEqual(res.data[0]['tag'], 'limited')

    def test_get_dynamic_tag(self):
        res = self.client.get('/api/products/tags/best-sellers/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], 'Bestseller Ring')

    def test_get_grouped_by_tag(self):
        res = self.client.get('/api/products/by-tag/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('new', res.data)
        self.assertIn('bestsellers', res.data)
        self.assertIn('limited', res.data)
        self.assertEqual(len(res.data['new']), 1)
        self.assertEqual(len(res.data['bestsellers']), 1)
        self.assertEqual(len(res.data['limited']), 1)
