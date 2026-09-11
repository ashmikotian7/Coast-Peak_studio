from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from products.models import Category, Product
from cart.models import Cart
from wishlist.models import WishlistItem

User = get_user_model()


class WishlistAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='wishshopper@example.com',
            password='Password123!',
            full_name='Wish Shopper'
        )
        self.other_user = User.objects.create_user(
            email='otherwish@example.com',
            password='Password123!',
            full_name='Other Wish'
        )

        self.category = Category.objects.create(name='Pendants', slug='pendants')
        self.product1 = Product.objects.create(
            name='Violet Teardrop Pendant',
            price=Decimal('186.00'),
            category=self.category,
            stock=10,
            is_active=True
        )
        self.product2 = Product.objects.create(
            name='Lavender Stack Trio',
            price=Decimal('312.00'),
            category=self.category,
            stock=3,
            is_active=True
        )
        self.out_of_stock_product = Product.objects.create(
            name='Antique Locket',
            price=Decimal('250.00'),
            category=self.category,
            stock=0,
            is_active=True
        )

    def test_unauthenticated_access_denied(self):
        res = self.client.get('/api/wishlist/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        res = self.client.post('/api/wishlist/toggle/', {'product_id': str(self.product1.id)})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_empty_wishlist(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get('/api/wishlist/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 0)
        self.assertEqual(res.data['items'], [])
        self.assertEqual(res.data['product_ids'], [])

    def test_toggle_wishlist_add_and_remove(self):
        self.client.force_authenticate(user=self.user)

        # First toggle: adds item
        res = self.client.post('/api/wishlist/toggle/', {'product_id': str(self.product1.id)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['wished'])
        self.assertEqual(res.data['product_id'], str(self.product1.id))

        # Check GET /api/wishlist/
        get_res = self.client.get('/api/wishlist/')
        self.assertEqual(get_res.data['count'], 1)
        self.assertEqual(get_res.data['product_ids'], [str(self.product1.id)])
        self.assertEqual(get_res.data['items'][0]['product']['name'], 'Violet Teardrop Pendant')

        # Second toggle: removes item
        res2 = self.client.post('/api/wishlist/toggle/', {'product_id': str(self.product1.id)})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertFalse(res2.data['wished'])

        get_res2 = self.client.get('/api/wishlist/')
        self.assertEqual(get_res2.data['count'], 0)
        self.assertEqual(get_res2.data['product_ids'], [])

    def test_delete_wishlist_item(self):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/wishlist/toggle/', {'product_id': str(self.product1.id)})

        res = self.client.delete(f'/api/wishlist/items/{self.product1.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        get_res = self.client.get('/api/wishlist/')
        self.assertEqual(get_res.data['count'], 0)

    def test_move_to_cart(self):
        self.client.force_authenticate(user=self.user)
        # Add to wishlist first
        self.client.post('/api/wishlist/toggle/', {'product_id': str(self.product1.id)})

        # Move to cart
        payload = {'product_id': str(self.product1.id), 'quantity': 2}
        res = self.client.post('/api/wishlist/move-to-cart/', payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['message'], 'Moved item to cart successfully')

        # Verify wishlist is empty
        wish_res = self.client.get('/api/wishlist/')
        self.assertEqual(wish_res.data['count'], 0)

        # Verify item is in cart
        cart_res = self.client.get('/api/cart/')
        self.assertEqual(cart_res.data['total_items'], 2)
        self.assertEqual(cart_res.data['items'][0]['product']['name'], 'Violet Teardrop Pendant')

    def test_move_out_of_stock_to_cart_fails(self):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/wishlist/toggle/', {'product_id': str(self.out_of_stock_product.id)})

        res = self.client.post(
            '/api/wishlist/move-to-cart/',
            {'product_id': str(self.out_of_stock_product.id), 'quantity': 1}
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('out of stock', res.data['error'].lower())

    def test_wishlist_merge(self):
        self.client.force_authenticate(user=self.user)
        # Pre-add product1
        self.client.post('/api/wishlist/toggle/', {'product_id': str(self.product1.id)})

        # Merge guest items: product2 and product1 (already wished)
        payload = {
            'product_ids': [str(self.product1.id), str(self.product2.id), '99999']  # 99999 is invalid, should be skipped
        }
        res = self.client.post('/api/wishlist/merge/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn(str(self.product1.id), res.data['product_ids'])
        self.assertIn(str(self.product2.id), res.data['product_ids'])
        self.assertEqual(len(res.data['product_ids']), 2)

    def test_user_data_isolation(self):
        # User 1 adds product 1
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/wishlist/toggle/', {'product_id': str(self.product1.id)})

        # User 2 sees empty wishlist
        self.client.force_authenticate(user=self.other_user)
        res = self.client.get('/api/wishlist/')
        self.assertEqual(res.data['count'], 0)
        self.assertEqual(res.data['product_ids'], [])
