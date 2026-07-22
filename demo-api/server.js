const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Helper for chaos testing delays
const randomDelay = (min = 500, max = 3000) => {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
};

// 1. Auth: Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    res.json({ token: 'mock-jwt-token-12345', userId: 1 });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// 2. Auth: Logout
app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// 3. User Profile
app.get('/api/user/profile', (req, res) => {
  res.json({ id: 1, username: 'admin', email: 'admin@demo.com', role: 'admin' });
});

// 4. Update Profile
app.put('/api/user/profile', (req, res) => {
  res.json({ message: 'Profile updated', data: req.body });
});

// 5. Dashboard Stats
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalSales: 15420,
    activeUsers: 342,
    newOrders: 12,
    conversionRate: 3.2
  });
});

// 6. Products List
app.get('/api/products', (req, res) => {
  const { search } = req.query;
  let products = [
    { id: 1, name: 'Wireless Headphones', price: 99.99, category: 'Electronics' },
    { id: 2, name: 'Running Shoes', price: 59.99, category: 'Sports' },
    { id: 3, name: 'Coffee Mug', price: 12.99, category: 'Home' },
    { id: 4, name: 'Mechanical Keyboard', price: 149.99, category: 'Electronics' }
  ];
  
  if (search) {
    products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }
  res.json(products);
});

// 7. Product Detail
app.get('/api/products/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'Detailed Product Name', price: 99.99, description: 'Very detailed description here.' });
});

// 8. Categories
app.get('/api/categories', (req, res) => {
  res.json(['Electronics', 'Sports', 'Home', 'Apparel']);
});

// 9. Search (Global)
app.get('/api/search', (req, res) => {
  res.json({
    results: [
      { type: 'product', id: 1, name: 'Headphones' },
      { type: 'user', id: 2, name: 'John Doe' }
    ]
  });
});

// 10. Shopping Cart (Get)
app.get('/api/cart', (req, res) => {
  res.json({ items: [{ productId: 1, quantity: 2, price: 99.99 }], total: 199.98 });
});

// 11. Shopping Cart (Add)
app.post('/api/cart', (req, res) => {
  res.json({ message: 'Item added to cart', cartId: 'cart-123', item: req.body });
});

// 12. Shopping Cart (Remove)
app.delete('/api/cart/:id', (req, res) => {
  res.json({ message: 'Item removed from cart' });
});

// 13. Checkout
app.post('/api/cart/checkout', (req, res) => {
  res.json({ orderId: 'ORD-98765', status: 'Processing' });
});

// 14. Orders List
app.get('/api/orders', (req, res) => {
  res.json([
    { id: 'ORD-98765', date: '2026-07-22', total: 199.98, status: 'Shipped' },
    { id: 'ORD-12345', date: '2026-07-20', total: 49.99, status: 'Delivered' }
  ]);
});

// 15. Order Detail
app.get('/api/orders/:id', (req, res) => {
  res.json({ id: req.params.id, date: '2026-07-22', total: 199.98, status: 'Shipped', items: [] });
});

// 16. Notifications (Get)
app.get('/api/notifications', (req, res) => {
  res.json([
    { id: 1, text: 'Your order has shipped!', read: false },
    { id: 2, text: 'Welcome to the platform.', read: true }
  ]);
});

// 17. Notifications (Mark Read)
app.put('/api/notifications/read', (req, res) => {
  res.json({ message: 'Notifications marked as read' });
});

// 18. Payments Methods
app.get('/api/payments/methods', (req, res) => {
  res.json([{ id: 'pm_1', type: 'Credit Card', last4: '4242' }]);
});

// 19. Add Payment Method
app.post('/api/payments/methods', (req, res) => {
  res.json({ id: 'pm_2', type: 'Credit Card', last4: '1234' });
});

// 20. Analytics (Views)
app.get('/api/analytics/views', (req, res) => {
  res.json({ data: [100, 200, 150, 300, 250, 400, 350] });
});

// 21. Analytics (Sales)
app.get('/api/analytics/sales', (req, res) => {
  res.json({ data: [1000, 2000, 1500, 3000, 2500, 4000, 3500] });
});

// --- Chaos Testing & Mountebank Demo Endpoints ---

// 22. Chaos: Fixed Delay
app.get('/api/chaos/delay', async (req, res) => {
  await randomDelay(2000, 2000);
  res.json({ message: 'This response was delayed by 2 seconds.' });
});

// 23. Chaos: Random Error (50% chance of 500)
app.get('/api/chaos/flaky', (req, res) => {
  if (Math.random() > 0.5) {
    res.status(500).json({ error: 'Random server error occurred!' });
  } else {
    res.json({ message: 'Success! You were lucky this time.' });
  }
});

// 24. Chaos: Always 404
app.get('/api/chaos/notfound', (req, res) => {
  res.status(404).json({ error: 'Resource not found' });
});

app.listen(PORT, () => {
  console.log(`Demo API Server running on http://localhost:${PORT}`);
});
