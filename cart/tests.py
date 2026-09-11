from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from products.models import Category, Product
from cart.models import Cart, CartItem

User = get_user_model()


class CartAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='shopper@example.com',
            password='Password123!',
            full_name='Shopper One'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            password='Password123!',
            full_name='Other User'
        )

        self.category = Category.objects.create(name='Rings', slug='rings')
        self.product1 = Product.objects.create(
            name='Celeste Solitaire Ring',
            price=Decimal('180.00'),
            category=self.category,
            stock=5,
            is_active=True
        )
        self.product2 = Product.objects.create(
            name='Aura Drop Earrings',
            price=Decimal('120.00'),
            category=self.category,
            stock=2,
            is_active=True
        )
        self.out_of_stock_product = Product.objects.create(
            name='Vintage Brooch',
            price=Decimal('90.00'),
            category=self.category,
            stock=0,
            is_active=True
        )

    def test_unauthenticated_access_denied(self):
        res = self.client.get('/api/cart/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        res = self.client.post('/api/cart/items/', {'product_id': str(self.product1.id), 'quantity': 1})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_empty_cart(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get('/api/cart/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_items'], 0)
        self.assertEqual(res.data['subtotal'], 0.0)
        self.assertEqual(len(res.data['items']), 0)

    def test_add_item_to_cart(self):
        self.client.force_authenticate(user=self.user)
        payload = {'product_id': str(self.product1.id), 'quantity': 2}
        res = self.client.post('/api/cart/items/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['quantity'], 2)
        self.assertEqual(res.data['product_id'], str(self.product1.id))

        # Check cart contents
        res = self.client.get('/api/cart/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total_items'], 2)
        self.assertEqual(res.data['subtotal'], 360.0)
        self.assertEqual(len(res.data['items']), 1)
        self.assertEqual(res.data['items'][0]['product']['name'], 'Celeste Solitaire Ring')
        self.assertEqual(res.data['items'][0]['item_total'], 360.0)

    def test_add_same_item_increments_quantity(self):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/cart/items/', {'product_id': str(self.product1.id), 'quantity': 2})
        res = self.client.post('/api/cart/items/', {'product_id': str(self.product1.id), 'quantity': 1})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['quantity'], 3)

        res = self.client.get('/api/cart/')
        self.assertEqual(res.data['total_items'], 3)

    def test_add_item_stock_validation(self):
        self.client.force_authenticate(user=self.user)

        # Out of stock
        res = self.client.post('/api/cart/items/', {'product_id': str(self.out_of_stock_product.id), 'quantity': 1})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('out of stock', res.data['error'].lower())

        # Exceeds available stock
        res = self.client.post('/api/cart/items/', {'product_id': str(self.product2.id), 'quantity': 3})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('exceeds available stock', res.data['error'].lower())

        # Existing + new exceeds stock
        self.client.post('/api/cart/items/', {'product_id': str(self.product2.id), 'quantity': 2})
        res = self.client.post('/api/cart/items/', {'product_id': str(self.product2.id), 'quantity': 1})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_item_quantity(self):
        self.client.force_authenticate(user=self.user)
        add_res = self.client.post('/api/cart/items/', {'product_id': str(self.product1.id), 'quantity': 1})
        item_id = add_res.data['id']

        # Increase
        res = self.client.patch(f'/api/cart/items/{item_id}/', {'quantity': 4})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['quantity'], 4)
        self.assertEqual(res.data['item_total'], 720.0)

        # Exceeds stock (product1 stock is 5)
        res = self.client.patch(f'/api/cart/items/{item_id}/', {'quantity': 6})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Quantity 0 removes item
        res = self.client.patch(f'/api/cart/items/{item_id}/', {'quantity': 0})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['quantity'], 0)

        cart_res = self.client.get('/api/cart/')
        self.assertEqual(cart_res.data['total_items'], 0)

    def test_delete_cart_item(self):
        self.client.force_authenticate(user=self.user)
        add_res = self.client.post('/api/cart/items/', {'product_id': str(self.product1.id), 'quantity': 1})
        item_id = add_res.data['id']

        res = self.client.delete(f'/api/cart/items/{item_id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        cart_res = self.client.get('/api/cart/')
        self.assertEqual(cart_res.data['total_items'], 0)

    def test_user_cannot_modify_other_user_cart_item(self):
        self.client.force_authenticate(user=self.user)
        add_res = self.client.post('/api/cart/items/', {'product_id': str(self.product1.id), 'quantity': 1})
        item_id = add_res.data['id']

        # Other user attempts patch and delete
        self.client.force_authenticate(user=self.other_user)
        res = self.client.patch(f'/api/cart/items/{item_id}/', {'quantity': 2})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        res = self.client.delete(f'/api/cart/items/{item_id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_clear_cart(self):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/cart/items/', {'product_id': str(self.product1.id), 'quantity': 2})
        self.client.post('/api/cart/items/', {'product_id': str(self.product2.id), 'quantity': 1})

        res = self.client.delete('/api/cart/clear/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['message'], 'Cart cleared successfully')

        cart_res = self.client.get('/api/cart/')
        self.assertEqual(cart_res.data['total_items'], 0)

    def test_cart_merge(self):
        self.client.force_authenticate(user=self.user)
        # Pre-existing item in DB cart
        self.client.post('/api/cart/items/', {'product_id': str(self.product1.id), 'quantity': 2})

        # Merge payload with item1 (increase to 5 max) and item2 (stock 2)
        payload = {
            'items': [
                {'product_id': str(self.product1.id), 'quantity': 4},  # total 6, should cap at 5
                {'product_id': str(self.product2.id), 'quantity': 2},  # new item
                {'product_id': str(self.out_of_stock_product.id), 'quantity': 1},  # out of stock, should skip
            ]
        }
        res = self.client.post('/api/cart/merge/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # product1 capped at 5, product2 is 2 -> total_items = 7
        self.assertEqual(res.data['total_items'], 7)
        self.assertEqual(len(res.data['items']), 2)
