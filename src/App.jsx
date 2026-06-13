import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Імпорт компонентів та сторінок архітектури Bitecore
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Admin from './pages/Admin';
import Login from './pages/Auth'; 
import Profile from './pages/Profile';
import TradeIn from './pages/TradeIn';
import CartPage from './pages/Cart'; 
import ComparePage from './pages/Compare'; 
import ProductPage from './pages/ProductPage'; 
import Checkout from './pages/Checkout'; // Підключаємо сторінку оформлення

// Захист профілю (перевіряє наявність будь-якої авторизації)
function ProtectedRoute({ children }) {
  const { user, authLoading } = useApp();
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

// 🔥 СУВОРИЙ ЗАХИСТ АДМІНКИ (Блокує сторонніх користувачів на базі ролі з бази даних)
function AdminRoute({ children }) {
  const { user, userRole, authLoading } = useApp();

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  }

  // Перевіряємо динамічну роль, яку підтягнув AppContext
  if (!user || userRole !== 'admin') {
    alert('🔒 Доступ обмежено: У вашого акаунта немає прав адміністратора!');
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
        
        <Navbar />

        <Routes>
          {/* Публічні відкриті сторінки */}
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/auth" element={<Login />} />
          <Route path="/trade-in" element={<TradeIn />} /> 
          <Route path="/cart" element={<CartPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/product/:id" element={<ProductPage />} />

          {/* 🔥 ЗАХИЩЕНИЙ РОУТ ОФОРМЛЕННЯ (Доступний тільки авторизованим) */}
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

          {/* Захищений роут адмін-панелі управління складом */}
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          
          {/* Захищений роут особистого кабінету клієнта */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </div>
    </AppProvider>
  );
}