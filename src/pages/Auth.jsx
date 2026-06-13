import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useApp } from '../context/AppContext';

export default function Auth() {
  const [mode, setMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();
  const { showToast } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        if (typeof showToast === 'function') showToast('👋 З поверненням!');
        navigate('/profile'); // ПІСЛЯ ВХОДУ ВЕДЕМО В ПРОФІЛЬ
      } else if (mode === 'register') {
        if (password !== confirmPassword) throw new Error('Паролі не збігаються!');
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'customer',
          createdAt: new Date().toISOString()
        });

        setMessage('🎉 Акаунт успішно створено!');
        if (typeof showToast === 'function') showToast('🚀 Кабінет активовано!');
        setTimeout(() => navigate('/profile'), 1000); // ПІСЛЯ РЕЄСТРАЦІЇ ТЕЖ У ПРОФІЛЬ
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage('📧 Інструкцію для скидання надіслано на вашу пошту.');
      }
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('❌ Неправильний email або пароль.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('❌ Цей email вже використовується.');
      } else if (err.code === 'auth/weak-password') {
        setError('❌ Пароль має бути не менше 6 символів.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4 py-16">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/60 space-y-6">
        
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight">
            {mode === 'login' && 'Вхід до Bitecore'}
            {mode === 'register' && 'Реєстрація акаунту'}
            {mode === 'reset' && 'Відновлення пароля'}
          </h1>
        </div>

        {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl">{error}</div>}
        {message && <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-1.5">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-black uppercase text-gray-400 tracking-wider">Пароль</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('reset')} className="text-xs text-blue-600 hover:underline cursor-pointer">Забули?</button>
                )}
              </div>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 tracking-wider mb-1.5">Підтвердження пароля</label>
              <input
                type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 text-sm focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
          >
            {loading ? 'Завантаження...' : (mode === 'login' ? 'Увійти' : mode === 'register' ? 'Зареєструватися' : 'Надіслати')}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 text-sm">
          {mode === 'login' && (
            <p className="text-gray-500">Немає акаунту? <button onClick={() => setMode('register')} className="text-blue-600 font-bold hover:underline cursor-pointer">Створити</button></p>
          )}
          {mode === 'register' && (
            <p className="text-gray-500">Вже є профіль? <button onClick={() => setMode('login')} className="text-blue-600 font-bold hover:underline cursor-pointer">Увійти</button></p>
          )}
        </div>

      </div>
    </div>
  );
}