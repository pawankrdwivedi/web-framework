import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { fetchApi } from './api';
import './index.css';

const Navbar = () => (
  <nav className="navbar">
    <div className="nav-links font-bold text-2xl">
      <Link to="/" style={{ color: 'var(--primary)' }}>QE Demo Store</Link>
    </div>
    <div className="nav-links">
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/products">Products</Link>
      <Link to="/search">Search</Link>
      <Link to="/cart">Cart</Link>
      <Link to="/orders">Orders</Link>
      <Link to="/payments">Payments</Link>
      <Link to="/analytics">Analytics</Link>
      <Link to="/profile">Profile</Link>
      <Link to="/notifications">Notifications</Link>
      <Link to="/login" className="btn" style={{ color: 'white' }}>Login</Link>
    </div>
  </nav>
);

const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h2 className="text-3xl mb-4 text-center">Sign In</h2>
      {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleLogin}>
        <input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" className="btn" style={{ width: '100%' }}>Login</button>
      </form>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetchApi('/dashboard/stats').then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-3xl mb-4 font-bold">Dashboard</h2>
      <div className="grid-cols-4">
        <div className="glass-card text-center">
          <h3 className="text-muted">Total Sales</h3>
          <p className="text-3xl font-bold mt-4">${stats.totalSales}</p>
        </div>
        <div className="glass-card text-center">
          <h3 className="text-muted">Active Users</h3>
          <p className="text-3xl font-bold mt-4">{stats.activeUsers}</p>
        </div>
        <div className="glass-card text-center">
          <h3 className="text-muted">New Orders</h3>
          <p className="text-3xl font-bold mt-4">{stats.newOrders}</p>
        </div>
        <div className="glass-card text-center">
          <h3 className="text-muted">Conversion Rate</h3>
          <p className="text-3xl font-bold mt-4">{stats.conversionRate}%</p>
        </div>
      </div>
      
      <h3 className="text-2xl mt-4 mb-2">Chaos Testing Simulator</h3>
      <div className="flex gap-4">
        <button className="btn" onClick={() => fetchApi('/chaos/delay').then(alert).catch(e => alert(e.message))}>Test Delay (2s)</button>
        <button className="btn btn-danger" onClick={() => fetchApi('/chaos/flaky').then(alert).catch(e => alert(e.message))}>Test Flaky Endpoint</button>
      </div>
    </div>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetchApi('/products').then(setProducts).catch(console.error);
  }, []);

  return (
    <div>
      <h2 className="text-3xl mb-4 font-bold">Products</h2>
      <div className="grid-cols-3">
        {products.map(p => (
          <div key={p.id} className="glass-card flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-1">{p.name}</h3>
              <p className="text-muted mb-4">{p.category}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">${p.price}</span>
              <button className="btn">Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Cart = () => {
  const [cart, setCart] = useState(null);
  useEffect(() => {
    fetchApi('/cart').then(setCart).catch(console.error);
  }, []);

  if (!cart) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-3xl mb-4 font-bold">Shopping Cart</h2>
      <div className="glass-card">
        {cart.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 className="text-2xl">Product ID: {item.productId}</h3>
              <p className="text-muted">Qty: {item.quantity}</p>
            </div>
            <p className="text-2xl font-bold">${item.price}</p>
          </div>
        ))}
        <div className="flex justify-between items-center mt-4">
          <h3 className="text-2xl font-bold">Total: ${cart.total}</h3>
          <button className="btn">Checkout</button>
        </div>
      </div>
    </div>
  );
};

// Simplified placeholders for remaining components to keep the file manageable
const GenericView = ({ title, endpoint }) => {
  const [data, setData] = useState(null);
  useEffect(() => { fetchApi(endpoint).then(setData).catch(console.error); }, [endpoint]);
  return (
    <div className="glass-card">
      <h2 className="text-3xl mb-4 font-bold">{title}</h2>
      <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/search" element={<GenericView title="Search" endpoint="/search" />} />
            <Route path="/orders" element={<GenericView title="Orders" endpoint="/orders" />} />
            <Route path="/payments" element={<GenericView title="Payments" endpoint="/payments/methods" />} />
            <Route path="/analytics" element={<GenericView title="Analytics" endpoint="/analytics/views" />} />
            <Route path="/profile" element={<GenericView title="Profile" endpoint="/user/profile" />} />
            <Route path="/notifications" element={<GenericView title="Notifications" endpoint="/notifications" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
