import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase/config'; 
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { cart, favorites, toggleFavorite, cancelOrder, showToast, user: activeUser, userRole } = useApp();
  const [orders, setOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Стейт для збереження всіх актуальних фото з бази
  const navigate = useNavigate();

  const isAdmin = userRole === 'admin';

  // 1. Завантажуємо всі товари, щоб мати доступ до їхніх реальних картинок з Storage
  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
      setAllProducts(items);
    });
    return () => unsubscribeProducts();
  }, []);

  // 2. Завантажуємо замовлення користувача
  useEffect(() => {
    if (activeUser) {
      const q = query(collection(db, 'orders'), where('userId', '==', activeUser.uid));
      const unsubscribeOrders = onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
        setOrders(items);
      }, (error) => { console.error("Помилка завантаження замовлень:", error); });
      return () => unsubscribeOrders();
    }
  }, [activeUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (typeof showToast === 'function') showToast('🔓 Ви успішно вийшли з акаунта');
      navigate('/');
    } catch (error) { console.error("Помилка виходу:", error); }
  };

  if (!activeUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <span className="text-6xl">🔒</span>
        <h1 className="text-xl font-black tracking-tight">Доступ обмежено</h1>
        <p className="text-gray-400 text-sm">Увійдіть в акаунт, щоб переглянути свої замовлення.</p>
        <div className="pt-2">
          <Link to="/auth" className="inline-block px-6 py-3 bg-blue-600 text-white font-black text-xs uppercase rounded-xl">Увійти</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 min-h-screen text-gray-900 dark:text-white transition-colors">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">👤 Особистий кабінет</h1>
          <p className="text-xs text-gray-400 mt-0.5">Керування замовленнями та особистими налаштуваннями профілю</p>
        </div>
        
        {isAdmin && (
          <Link to="/admin" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all">
            ⚙️ Панель адміна
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 text-center space-y-5 shadow-xs">
          <div className="h-20 w-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-black text-3xl mx-auto uppercase select-none shadow-md">
            {activeUser.email ? activeUser.email[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-full">{activeUser.email}</h3>
            <p className="text-[11px] text-gray-400 font-medium mt-1">Клієнт платформи Bitecore</p>
          </div>
          <div className="pt-4 border-t border-gray-50 dark:border-gray-700 space-y-2 text-xs font-bold text-gray-500 dark:text-gray-400 text-left">
            <div className="flex justify-between">
              <span>🛒 Товарів у кошику:</span>
              <span className="text-blue-600 dark:text-blue-400 font-black">{(cart || []).reduce((s, i) => s + i.quantity, 0)} шт</span>
            </div>
            <div className="flex justify-between">
              <span>📦 Оформлених замовлень:</span>
              <span className="text-emerald-500 font-black">{orders.length} чеків</span>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full mt-2 py-2.5 bg-gray-50 hover:bg-rose-50 dark:bg-gray-900 dark:hover:bg-rose-950/20 text-gray-500 hover:text-rose-600 dark:text-gray-400 font-bold text-xs rounded-xl transition-colors cursor-pointer">Вийти з акаунта</button>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="space-y-4">
            <h2 className="text-base font-black uppercase text-gray-400 tracking-wider">📦 Історія моїх замовлень ({orders.length})</h2>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 dark:border-gray-700 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-gray-900 dark:text-white">ID: {order.id.slice(0, 12)}...</span>
                          <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${order.status === 'Скасовано' ? 'bg-red-50 text-red-600 dark:bg-red-950/30' : order.status === 'Виконано' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>{order.status || 'Обробка'}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">Оформлено: {order.createdAt ? new Date(order.createdAt).toLocaleString('uk-UA') : 'Щойно'}</p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Разом</p>
                          <p className="text-base font-black text-blue-600 dark:text-blue-500">{order.totalPrice?.toLocaleString()} грн</p>
                        </div>
                        {(order.status === "Нове замовлення" || order.status === "В обробці" || !order.status) && typeof cancelOrder === 'function' && (
                          <button onClick={() => { if (window.confirm("⚠️ Скасувати замовлення?")) cancelOrder(order.id); }} className="px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 font-black text-[10px] uppercase rounded-lg">✕ Скасувати замовлення</button>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {order.items?.map((item, idx) => {
                        const originalProduct = allProducts.find(p => String(p.id) === String(item.id));
                        const productImages = originalProduct?.images || [];
                        const firstImageObj = productImages[0];
                        const storageUrl = typeof firstImageObj === 'object' ? firstImageObj?.url : firstImageObj;
                        const finalUrl = (item.image && String(item.image).startsWith('http')) ? item.image : storageUrl;

                        return (
                          <Link to={`/product/${item.id}`} key={idx} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-4 text-xs group/item cursor-pointer block hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-xl px-2 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 dark:border-gray-700">
                                {finalUrl && String(finalUrl).startsWith('http') ? (
                                  <img src={finalUrl} alt={item.title} className="w-full h-full object-contain p-1" />
                                ) : (
                                  <span className="text-2xl select-none">{item.image || '📦'}</span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white group-hover/item:text-blue-600 transition-colors">{item.title}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">🎨 Колір: {item.color} | 💾 Пам'ять: {item.storage}</p>
                              </div>
                            </div>
                            <div className="text-right font-black text-gray-900 dark:text-white"><p>{item.quantity} шт. x {item.price?.toLocaleString()} грн</p></div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : ( <div className="p-10 bg-white dark:bg-gray-800 border border-dashed text-center text-xs text-gray-400">🛒 У вашому профілі поки немає куплених товарів.</div> )}
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-black uppercase text-gray-400 tracking-wider">❤️ Мій список бажань ({(favorites || []).length})</h2>
            {(favorites || []).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favorites.map(prod => {
                  const originalProduct = allProducts.find(p => String(p.id) === String(prod.id));
                  const productImages = originalProduct?.images || [];
                  const firstImageObj = productImages[0];
                  const storageUrl = typeof firstImageObj === 'object' ? firstImageObj?.url : firstImageObj;
                  const finalUrl = (prod.image && String(prod.image).startsWith('http')) ? prod.image : storageUrl;

                  return (
                    <div key={prod.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex justify-between items-center shadow-xs">
                      <div className="flex items-center gap-3 truncate">
                        <div className="h-12 w-12 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 dark:border-gray-600">
                          {finalUrl && String(finalUrl).startsWith('http') ? (
                            <img src={finalUrl} alt={prod.title} className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="text-2xl select-none">{prod.image || '📦'}</span>
                          )}
                        </div>
                        <div className="truncate">
                          <span className="text-[8px] font-black uppercase text-gray-400 block">{prod.brand}</span>
                          <Link to={`/product/${prod.id}`} className="font-bold text-xs text-gray-900 dark:text-white hover:text-blue-600 truncate block">{prod.title}</Link>
                          <p className="text-xs font-black text-gray-900 dark:text-white mt-0.5">{prod.price?.toLocaleString()} грн</p>
                        </div>
                      </div>
                      <button onClick={() => toggleFavorite(prod)} className="text-gray-300 hover:text-rose-500 font-bold text-sm p-2 cursor-pointer">✕</button>
                    </div>
                  );
                })}
              </div>
            ) : ( <div className="p-8 bg-white dark:bg-gray-800 border border-dashed text-center text-xs text-gray-400">Список бажань порожній.</div> )}
          </div>
        </div>
      </div>
    </div>
  );
}