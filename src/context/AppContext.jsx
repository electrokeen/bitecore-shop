import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase/config'; 
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [compareList, setCompareList] = useState([]); 
  const [user, setUser] = useState(null);
  
  const [userRole, setUserRole] = useState('user'); 
  const [authLoading, setAuthLoading] = useState(true);

  // 🔥 СТЕТ ДЛЯ КРАСИВОГО ХМАРНОГО ТОАСТА
  const [toast, setToast] = useState({ visible: false, message: '' });

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('bitecore_theme');
    return savedTheme === 'dark';
  });

  // Функція для запуску красивого сповіщення в кутку сайту
  const showToast = (message) => {
    setToast({ visible: true, message });
  };

  // Автоматичне закриття плашки через 3 секунди
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast({ visible: false, message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  useEffect(() => {
    let unsubscribeCart = () => {};
    let unsubscribeFavs = () => {};
    let unsubscribeRole = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        unsubscribeRole = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role || 'user');
          } else {
            setUserRole('user');
          }
          setAuthLoading(false);
        });

        unsubscribeCart = onSnapshot(doc(db, 'carts', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) setCart(docSnap.data().items || []);
          else setCart([]);
        });

        unsubscribeFavs = onSnapshot(doc(db, 'favorites', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) setFavorites(docSnap.data().items || []);
          else setFavorites([]);
        });

      } else {
        setUserRole('user');
        setCart([]);
        setFavorites([]);
        setAuthLoading(false);
        unsubscribeCart();
        unsubscribeFavs();
        unsubscribeRole();
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeCart();
      unsubscribeFavs();
      unsubscribeRole();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('bitecore_theme', darkMode ? 'dark' : 'light');
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(prev => !prev);

  const addToCart = async (p) => {
    if (!user) {
      showToast('🔒 Увійдіть в акаунт, щоб користуватися кошиком!');
      return;
    }
    
    let u = [...cart];
    const e = u.find(c => String(c.id) === String(p.id) && c.color === p.color && c.storage === p.storage);
    
    if (e) {
      u = u.map(c => String(c.id) === String(p.id) && c.color === p.color && c.storage === p.storage ? { ...c, quantity: (c.quantity || 1) + 1 } : c);
    } else {
      u.push({ ...p, quantity: 1 });
    }
    
    setCart(u);
    await setDoc(doc(db, 'carts', user.uid), { items: u }, { merge: true });
    showToast('🛒 Товар успішно додано до вашого кошика!');
  };

  const removeFromCart = async (id, c, s) => {
    if (!user) return;
    const u = cart.filter(item => !(String(item.id) === String(id) && item.color === c && item.storage === s));
    setCart(u);
    await setDoc(doc(db, 'carts', user.uid), { items: u }, { merge: true });
    showToast('🗑️ Товар видалено з кошика');
  };

  const clearCart = async () => { 
    if (user) {
      setCart([]);
      await setDoc(doc(db, 'carts', user.uid), { items: [] }, { merge: true }); 
    }
  };

  const toggleFavorite = async (p) => {
    if (!user || !p?.id) {
      showToast('🔒 Авторизуйтесь для збереження в обране!');
      return;
    }
    let f = [...favorites];
    const isFav = f.some(i => String(i.id) === String(p.id));
    if (isFav) {
      f = f.filter(i => String(i.id) !== String(p.id));
      showToast('🤍 Видалено з обраного');
    } else {
      f.push(p);
      showToast('❤️ Додано в обране!');
    }
    setFavorites(f);
    await setDoc(doc(db, 'favorites', user.uid), { items: f }, { merge: true });
  };

  const toggleCompare = (p) => {
    if (!p?.id) return;
    const isComp = compareList.some(i => String(i.id) === String(p.id));
    if (isComp) {
      setCompareList(prev => prev.filter(i => String(i.id) !== String(p.id)));
      showToast('🔄 Видалено з порівняння');
    } else {
      if (compareList.length >= 4) {
        showToast('⚠️ Максимум 4 девайси для порівняння!');
        return;
      }
      setCompareList(prev => [...prev, p]);
      showToast('📊 Додано до списку порівняння!');
    }
  };

  return (
    <AppContext.Provider value={{
      cart, addToCart, removeFromCart, clearCart,
      favorites, toggleFavorite, compareList, toggleCompare,
      user, userRole, authLoading, darkMode, toggleTheme, showToast
    }}>
      {children}

      {/* 🔥 КРАСИВИЙ АДАПТИВНИЙ UI КОМПОНЕНТ ДЛЯ ПЛАШОК ОБРАНОГО ТА КОШИКА */}
      {toast.visible && (
        <div className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-sm z-50 bg-gray-900/95 text-white backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-fadeIn transition-all duration-300">
          <span className="text-xs font-black uppercase tracking-wider block w-full text-center sm:text-left">
            {toast.message}
          </span>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }