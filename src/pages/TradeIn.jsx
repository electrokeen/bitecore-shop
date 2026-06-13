import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function TradeIn() {
  const { currentUser, showToast } = useApp();
  const navigate = useNavigate();

  const [oldDevice, setOldDevice] = useState('');
  const [deviceCondition, setDeviceCondition] = useState('Good');
  const [contact, setContact] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!oldDevice || !contact) {
      alert("Будь ласка, заповніть обов'язкові поля: модель пристрою та контактні дані!");
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, 'tradeInRequests'), {
        userId: currentUser ? currentUser.uid : 'guest',
        userEmail: currentUser ? currentUser.email : 'Гість платформи',
        oldDevice,
        deviceCondition,
        contact,
        comment,
        status: 'Нова заявка',
        createdAt: new Date().toISOString()
      });

      showToast('🎉 Заявку на Трейд-ін успішно надіслано менеджерам!');
      navigate('/');
    } catch (error) {
      console.error("Помилка надсилання заявки Трейд-ін:", error);
      alert("Не вдалося надіслати заявку.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">♻️ Програма Трейд-ін у Bitecore</h1>
        <p className="text-xs text-gray-400 mt-1">Вкажіть конфігурацію вашого старого гаджета, щоб отримати оцінку та обміняти його на нові пристрої Apple.</p>
      </div>

      <form onSubmit={handleSubmitRequest} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Який пристрій ви хочете здати? *</label>
          <input 
            type="text" 
            required
            value={oldDevice} 
            onChange={(e) => setOldDevice(e.target.value)} 
            placeholder="Напр: iPhone 13 Pro 128GB Graphite" 
            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-900 dark:text-white dark:border-gray-700 focus:outline-none" 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Ваш телефон або нік у Telegram *</label>
          <input 
            type="text" 
            required
            value={contact} 
            onChange={(e) => setContact(e.target.value)} 
            placeholder="Напр: +380991234567 або @telegram_username" 
            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-900 dark:text-white dark:border-gray-700 focus:outline-none" 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Стан пристрою</label>
          <select 
            value={deviceCondition} 
            onChange={(e) => setDeviceCondition(e.target.value)}
            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-900 dark:text-white dark:border-gray-700 focus:outline-none"
          >
            <option value="Excellent">💎 Ідеальний (Без подряпин, оригінал)</option>
            <option value="Good">👍 Хороший (Є незначні сліди використання)</option>
            <option value="Working">🔧 Робочий (Має подряпини, сколи або мінявся АКБ)</option>
            <option value="For Parts">🛠️ На запчастини / Під ремонт</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Додаткові коментарі</label>
          <textarea 
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            rows="3"
            placeholder="Мінялися деталі, який відсоток місткості батареї тощо..." 
            className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-900 dark:text-white dark:border-gray-700 resize-none focus:outline-none"
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.99] text-center"
        >
          {submitting ? 'Надсилання специфікацій...' : 'Надіслати заявку на прорахунок ➔'}
        </button>

      </form>
    </div>
  );
}