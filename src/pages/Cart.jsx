import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useApp();

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 bg-gray-50 dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
      <div className="flex justify-between items-baseline border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight">🛒 Ваш кошик ({cart.length})</h1>
        {cart.length > 0 && (
          <button 
            onClick={clearCart} 
            className="text-xs font-black uppercase text-rose-600 hover:underline cursor-pointer"
          >
            Очистити все ×
          </button>
        )}
      </div>

      {cart.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* СПИСОК ТОВАРІВ У КОРЗИНІ */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, idx) => {
              return (
                <div 
                  key={idx} 
                  className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs relative group"
                >
                  {/* 🔥 РОЗУМНИЙ ФІКС ФОТО: Підхоплюємо URL з масиву images, якщо в image прийшов емодзі */}
                  <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-950 p-1 shrink-0 border border-gray-100 dark:border-gray-800 overflow-hidden flex items-center justify-center">
                    {(() => {
                      const itemImages = item.images || [];
                      const firstImageObj = itemImages[0];
                      const backupUrl = typeof firstImageObj === 'object' ? firstImageObj?.url : firstImageObj;
                      const finalUrl = (item.image && String(item.image).startsWith('http')) ? item.image : backupUrl;

                      return (finalUrl && String(finalUrl).startsWith('http')) ? (
                        <img src={finalUrl} alt={item.title} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <span className="text-2xl select-none">{item.image || '📦'}</span>
                      );
                    })()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-gray-900 dark:text-white truncate uppercase leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate">
                      🎨 Колір: {item.color || 'Базовий'} · 💾 SSD: {item.storage || 'Base'} {item.ram ? `· ⚡ RAM: ${item.ram}` : ''}
                    </p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-black text-sm font-sans text-gray-900 dark:text-white">
                        {item.price?.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">грн</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id, item.color, item.storage)}
                    className="p-2 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                    title="Вилучити"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          {/* БЛОК ЧЕКУ */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest border-b border-gray-50 dark:border-gray-800 pb-2">Разом до сплати</h2>
            <div className="flex justify-between items-baseline py-2">
              <span className="text-xs text-gray-500 font-bold">Сума замовлення:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-sans text-gray-900 dark:text-white">
                  {calculateTotal().toLocaleString()}
                </span>
                <span className="text-xs font-bold text-gray-400">грн</span>
              </div>
            </div>
            
            <Link 
              to="/checkout" 
              className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-center font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-colors"
            >
              Перейти до оформлення ➔
            </Link>
          </div>

        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl space-y-4">
          <p className="text-3xl">🛒</p>
          <p className="text-sm font-medium text-gray-400">Ваш кошик порожній. Час додати туди топовий MacBook!</p>
          <Link to="/catalog" className="inline-block px-6 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-black font-black text-xs uppercase tracking-wider rounded-xl">
            Повернутися до каталогу
          </Link>
        </div>
      )}
    </div>
  );
}