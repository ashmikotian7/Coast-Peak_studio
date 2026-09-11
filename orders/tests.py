from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from products.models import Category, Product
from orders.models import Order, OrderItem

User = get_user_model()


class OrderTrackingAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email='alice@example.com',
            password='Password123!',
            full_name='Alice Smith'
        )

        self.category = Category.objects.create(name='Rings', slug='rings')
        self.product = Product.objects.create(
            name='Celeste Solitaire Ring',
            price=Decimal('180.00'),
            category=self.category,
            stock=10,
            is_active=True
        )

        # Create Order #1025 for Alice
        self.order = Order.objects.create(
            user=self.user,
            order_number='CP-2026-1025',
            email='alice@example.com',
            phone='+1 555-0192',
            first_name='Alice',
            last_name='Smith',
            street_address='456 Sapphire Lane',
            city='Portland',
            state='OR',
            zip_code='97201',
            payment_method='card',
            subtotal=Decimal('360.00'),
            shipping_fee=Decimal('12.00'),
            total_amount=Decimal('372.00'),
            status='shipped',  # Order Dispatched
        )

        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            product_name='Celeste Solitaire Ring',
            unit_price=Decimal('180.00'),
            quantity=2,
        )

    def test_orders_dropdown_api(self):
        # Unauthenticated with email filter
        res = self.client.get('/api/orders/dropdown/?email=alice@example.com')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        order_data = res.data[0]
        self.assertEqual(order_data['order_number'], 'CP-2026-1025')
        self.assertEqual(order_data['status'], 'shipped')
        self.assertEqual(order_data['status_display'], 'Order Dispatched')
        self.assertIn('2 items', order_data['label'])
        self.assertEqual(order_data['user']['name'], 'Alice Smith')
        self.assertEqual(len(order_data['products']), 1)
        self.assertEqual(order_data['products'][0]['name'], 'Celeste Solitaire Ring')
        self.assertEqual(order_data['products'][0]['quantity'], 2)

    def test_orders_dropdown_authenticated_user(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get('/api/orders/dropdown/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['order_number'], 'CP-2026-1025')

    def test_order_tracking_status_api(self):
        # Test lookup by full order number
        res = self.client.get(f'/api/orders/track/{self.order.order_number}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['order_number'], 'CP-2026-1025')
        self.assertEqual(res.data['current_status'], 'shipped')
        self.assertEqual(res.data['current_status_display'], 'Order Dispatched')

        # Check timeline steps matching requirements:
        # ✓ Order Placed (completed)
        # ✓ Preparing Order (completed)
        # ● Order Dispatched (current)
        # ○ Delivered (upcoming)
        timeline = res.data['timeline']
        self.assertGreaterEqual(len(timeline), 3)

        self.assertEqual(timeline[0]['title'], 'Order Placed')
        self.assertEqual(timeline[0]['state'], 'completed')
        self.assertEqual(timeline[0]['icon'], '✓')

        self.assertEqual(timeline[1]['title'], 'Preparing Order')
        self.assertEqual(timeline[1]['state'], 'completed')
        self.assertEqual(timeline[1]['icon'], '✓')

        self.assertIn(timeline[2]['title'], ['Order Dispatched', 'Order Sent'])
        self.assertEqual(timeline[2]['state'], 'current')
        self.assertEqual(timeline[2]['icon'], '●')

        # Check user details & address
        user_info = res.data['user']
        self.assertEqual(user_info['name'], 'Alice Smith')
        self.assertEqual(user_info['shipping_address']['city'], 'Portland')

        # Check products
        products = res.data['products']
        self.assertEqual(len(products), 1)
        self.assertEqual(products[0]['name'], 'Celeste Solitaire Ring')
        self.assertEqual(products[0]['quantity'], 2)

    def test_order_tracking_by_partial_or_hash_number(self):
        # Query with %231025 (#1025 URL encoded)
        res = self.client.get('/api/orders/track/%231025/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['order_number'], 'CP-2026-1025')

        # Query param ?number=1025
        res2 = self.client.get('/api/orders/track/?number=1025')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['order_number'], 'CP-2026-1025')

    def test_order_tracking_not_found(self):
        res = self.client.get('/api/orders/track/999999/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(res.data['is_found'])

    def test_order_status_update(self):
        # Update status to delivered
        res = self.client.patch(f'/api/orders/track/{self.order.order_number}/status/', {'status': 'delivered'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['current_status'], 'delivered')
        self.assertEqual(res.data['current_status_display'], 'Delivered')

        # Check all steps are now completed
        for step in res.data['timeline']:
            self.assertEqual(step['state'], 'completed')
            self.assertEqual(step['icon'], '✓')

        # Update status using alias 'preparing' (which maps to crafting)
        res2 = self.client.patch(f'/api/orders/track/{self.order.order_number}/status/', {'status': 'preparing'})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data['current_status'], 'crafting')
        self.assertEqual(res2.data['current_status_display'], 'Preparing Order')

    def test_order_status_update_invalid(self):
        res = self.client.patch(f'/api/orders/track/{self.order.order_number}/status/', {'status': 'flying'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', res.data)

    def test_all_orders_list_api(self):
        res = self.client.get('/api/orders/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        order_item = res.data[0]
        self.assertEqual(order_item['order_number'], 'CP-2026-1025')
        self.assertEqual(order_item['customer_name'], 'Alice Smith')
        self.assertEqual(order_item['status'], 'shipped')
        self.assertEqual(order_item['status_display'], 'Order Dispatched')
        self.assertEqual(len(order_item['items']), 1)
        self.assertEqual(order_item['items'][0]['product_name'], 'Celeste Solitaire Ring')
        self.assertEqual(order_item['items'][0]['item_total'], 360.0)

        # Test filter by status
        res_filter = self.client.get('/api/orders/?status=shipped')
        self.assertEqual(res_filter.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_filter.data), 1)

        res_filter_empty = self.client.get('/api/orders/?status=delivered')
        self.assertEqual(res_filter_empty.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_filter_empty.data), 0)

        # Test filter by search
        res_search = self.client.get('/api/orders/?search=1025')
        self.assertEqual(res_search.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_search.data), 1)

    def test_track_order_by_user_and_product(self):
        # 1. Track by email
        res_email = self.client.get('/api/orders/track-status/?email=alice@example.com')
        self.assertEqual(res_email.status_code, status.HTTP_200_OK)
        self.assertEqual(res_email.data['count'], 1)
        self.assertEqual(res_email.data['orders'][0]['order_number'], 'CP-2026-1025')

        # 2. Track by email and product_id
        res_user_prod = self.client.get(f'/api/orders/track-status/?email=alice@example.com&product_id={self.product.id}')
        self.assertEqual(res_user_prod.status_code, status.HTTP_200_OK)
        self.assertEqual(res_user_prod.data['count'], 1)
        self.assertEqual(res_user_prod.data['orders'][0]['current_status'], 'shipped')

        # 3. Track with non-matching product_id
        res_invalid_prod = self.client.get('/api/orders/track-status/?email=alice@example.com&product_id=9999')
        self.assertEqual(res_invalid_prod.status_code, status.HTTP_404_NOT_FOUND)

        # 4. POST track-status
        res_post = self.client.post('/api/orders/track-status/', {
            'email': 'alice@example.com',
            'product_id': self.product.id,
            'order_number': '1025'
        })
        self.assertEqual(res_post.status_code, status.HTTP_200_OK)
        self.assertEqual(res_post.data['order_number'], 'CP-2026-1025')
        self.assertEqual(res_post.data['current_status'], 'shipped')

    def test_order_history_api(self):
        # 1. Unauthenticated GET with ?email=
        res_get = self.client.get('/api/orders/history/?email=alice@example.com')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(res_get.data['count'], 1)
        first_order = res_get.data['orders'][0]
        self.assertEqual(first_order['order_number'], 'CP-2026-1025')
        self.assertEqual(first_order['shipping_address']['street_address'], '456 Sapphire Lane')
        self.assertEqual(first_order['shipping_address']['city'], 'Portland')
        self.assertEqual(first_order['shipping_address']['state'], 'OR')
        self.assertEqual(first_order['shipping_address']['zip_code'], '97201')
        self.assertEqual(first_order['street_address'], '456 Sapphire Lane')

        # 2. POST with JSON body
        res_post = self.client.post('/api/orders/history/', {'email': 'alice@example.com'}, format='json')
        self.assertEqual(res_post.status_code, status.HTTP_200_OK)
        self.assertEqual(res_post.data['count'], 1)

        # 3. Authenticated request without email param
        self.client.force_authenticate(user=self.user)
        res_auth = self.client.get('/api/orders/history/')
        self.assertEqual(res_auth.status_code, status.HTTP_200_OK)
        self.assertEqual(res_auth.data['count'], 1)
        self.client.force_authenticate(user=None)

        # 4. Missing email & unauthenticated -> 400 Bad Request
        res_missing = self.client.get('/api/orders/history/')
        self.assertEqual(res_missing.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_shipping_address_normalization_and_sync(self):
        # Create user without address
        bob = User.objects.create_user(
            email='bob@example.com',
            password='Password123!',
            full_name='Bob Jones'
        )
        self.assertIsNone(bob.street_address)

        checkout_payload = {
            'email': 'bob@example.com',
            'first_name': 'Bob',
            'last_name': 'Jones',
            'shipping_address': {
                'street': '789 Diamond Blvd',
                'city': 'Austin',
                'state': 'TX',
                'zip': '78701',
                'phone': '+1 555-4321'
            },
            'payment_method': 'card',
            'cart_items': [
                {
                    'product_id': self.product.id,
                    'quantity': 1
                }
            ]
        }

        res = self.client.post('/api/orders/checkout/', checkout_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['street_address'], '789 Diamond Blvd')
        self.assertEqual(res.data['city'], 'Austin')
        self.assertEqual(res.data['state'], 'TX')
        self.assertEqual(res.data['zip_code'], '78701')

        # Verify synced to User table
        bob.refresh_from_db()
        self.assertEqual(bob.street_address, '789 Diamond Blvd')
        self.assertEqual(bob.city, 'Austin')
        self.assertEqual(bob.state, 'TX')
        self.assertEqual(bob.zip_code, '78701')
        self.assertEqual(bob.phone_number, '+1 555-4321')

