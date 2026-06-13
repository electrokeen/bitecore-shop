import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { db } from '../firebase/config';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';

export default function Checkout() {
  const { cart, clearCart, user } = useApp();
  const navigate = useNavigate();

  // Стейти для форми логістики та оплати
  const [deliveryMethod, setDeliveryMethod] = useState('Нова Пошта');
  const [paymentMethod, setPaymentMethod] = useState('Оплата при отриманні');
  const [city, setCity] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!user) return alert('Потрібна авторизація для оформлення замовлення!');
    if (cart.length === 0) return alert('Ваш кошик порожній!');

    try {
      // 1. Формуємо повну накладну замовлення
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        items: cart.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          color: item.color || 'Стандарт',
          storage: item.storage || 'Стандарт',
          image: item.image || '📦'
        })),
        totalPrice,
        status: 'Нове замовлення',
        createdAt: Date.now(), // Фіксація точного часу для сортування в Linux
        delivery: {
          method: deliveryMethod,
          city,
          warehouse,
          fullName,
          phone
        },
        payment: paymentMethod
      };

      // 2. Надсилаємо чек у Cloud Firestore
      await addDoc(collection(db, 'orders'), orderData);

      // 3. 🔥 АВТОМАТИЧНЕ СПИСАННЯ ЗІ СКЛАДУ (Мінус товар в базі)
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        try {
          await updateDoc(productRef, {
            stock: increment(-item.quantity) // Зменшуємо залишок на складі
          });
        } catch (err) {
          console.error(`Не вдалося оновити залишок складу для ID ${item.id}:`, err);
        }
      }

      // 4. Очищення хмарного кошика користувача та редирект в кабінет
      await clearCart();
      alert('🎉 Замовлення прийнято в обробку! Перенаправлення до особистого кабінету...');
      navigate('/profile');

    } catch (error) {
      console.error('Помилка при створенні замовлення:', error);
      alert('Сталася помилка при обробці транзакції.');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <span className="text-5xl">🛒</span>
        <h2 className="text-xl font-black uppercase tracking-tight">Кошик порожній</h2>
        <p className="text-xs text-gray-400">Додайте матеріальні активи з каталогу для оформлення.</p>
        <button onClick={() => navigate('/catalog')} className="px-5 py-2.5 bg-blue-600 text-white font-black text-xs uppercase rounded-xl cursor-pointer">До каталогу</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-gray-900 dark:text-white transition-colors">
      <h1 className="text-2xl font-black uppercase tracking-tight mb-8">📦 Оформлення замовлення</h1>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ЛІВИЙ БЛОК: ФОРМА ДАНИХ ОДЕРЖУВАЧА */}
        <div className="lg:col-span-2 space-y-6 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-400">1. Інформація про отримувача</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">ПІБ Отримувача</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Іванов Іван Іванович" className="w-full px-4 py-2.5 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl focus:border-blue-500 outline-none text-gray-900 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Контактний телефон</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+380" className="w-full px-4 py-2.5 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl focus:border-blue-500 outline-none text-gray-900 dark:text-white" />
            </div>
          </div>

          <h2 className="text-sm font-black uppercase tracking-wider text-gray-400 pt-4 border-t border-gray-50 dark:border-gray-800">2. Служба доставки</h2>
          <div className="flex gap-4">
            {['Нова Пошта', 'Укрпошта'].map(method => (
              <button key={method} type="button" onClick={() => setDeliveryMethod(method)} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl border transition-all cursor-pointer ${deliveryMethod === method ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent'}`}>
                {method === 'Нова Пошта' ? '🔴 Нова Пошта' : '🟡 Укрпошта'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Місто доставки</label>
              <input type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="Київ" className="w-full px-4 py-2.5 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl focus:border-blue-500 outline-none text-gray-900 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Номер відділення або Поштомату</label>
              <input type="text" required value={warehouse} onChange={e => setWarehouse(e.target.value)} placeholder="Відділення №5 / Поштомат" className="w-full px-4 py-2.5 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl focus:border-blue-500 outline-none text-gray-900 dark:text-white" />
            </div>
          </div>

          <h2 className="text-sm font-black uppercase tracking-wider text-gray-400 pt-4 border-t border-gray-50 dark:border-gray-800">3. Спосіб розрахунку</h2>
          <div className="flex gap-4">
            {['Оплата при отриманні', 'Повна оплата карткою'].map(method => (
              <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`flex-1 py-3 text-xs font-black uppercase rounded-xl border transition-all cursor-pointer ${paymentMethod === method ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent'}`}>
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* ПРАВИЙ БЛОК: СТИСЛИЙ ЧЕК КОРЗИНИ */}
        <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-400">Складська специфікація</h2>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-60 overflow-y-auto pr-2">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0 text-xs">
                <div>
                  <p className="font-bold truncate max-w-[180px]">{item.title}</p>
                  <p className="text-[10px] text-gray-400">Конфіг: {item.quantity} шт | {item.color} | {item.storage}</p>
                </div>
                <span className="font-black text-gray-900 dark:text-white">{(item.price * item.quantity).toLocaleString()} грн</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
              <span>Доставка активів:</span>
              <span className="text-emerald-500">За тарифами перевізника</span>
            </div>
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-xs font-black uppercase">Разом до сплати:</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{totalPrice.toLocaleString()} грн</span>
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer active:scale-95 border border-transparent">
            🛒 Підтвердити та замовити
          </button>
        </div>

      </form>
    </div>
  );
}