import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useApp } from '../context/AppContext';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, showToast, user } = useApp();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Стейти для обраних конфігурацій клієнта
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedRam, setSelectedRam] = useState(null);

  // Стейт для індексу активного фото в галереї мініатюр
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Стейт для швидкого замовлення (One-click buy)
  const [showOneClickModal, setShowOneClickModal] = useState(false);
  const [fastName, setFastName] = useState('');
  const [fastPhone, setFastPhone] = useState('');
  const [fastLoading, setFastLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);

          // Виставляємо початкові конфігурації за замовчуванням
          if (data.colors && data.colors.length > 0) {
            setSelectedColor(data.colors[0]);
          }
          if (data.variants && data.variants.length > 0) {
            setSelectedStorage(data.variants[0]);
          }
          if (data.ramVariants && data.ramVariants.length > 0) {
            setSelectedRam(data.ramVariants[0]);
          }
        } else {
          if (typeof showToast === 'function') showToast('❌ Товар не знайдено в базі даних');
          navigate('/catalog');
        }
      } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('❌ Помилка завантаження даних девайса');
      } finally {
        loading && setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  // Коли користувач змінює колір девайса — скидаємо індекс галереї на перше фото
  useEffect(() => {
    setActiveImageIdx(0);
  }, [selectedColor]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) return null;

  // ЛОГІКА СМАРТ-ГАЛЕРЕЇ ДЛЯ ОБРОБКИ ОБ'ЄКТІВ З STORAGE:
  const allImages = (product.images || []).map(img => {
    if (typeof img === 'string') return { url: img, color: 'Всі' };
    return img;
  });

  const activeImages = allImages.filter(img => {
    return img.color === 'Всі' || img.color?.toLowerCase() === selectedColor?.toLowerCase();
  });

  const mainImageUrl = activeImages[activeImageIdx]?.url || allImages[0]?.url || 'https://placehold.co/600?text=No+Image';

  // Динамічний розрахунок фінальної вартості з урахуванням обраного заліза (SSD / RAM)
  const calculateTotalPrice = () => {
    let finalPrice = product.price || 0;
    if (selectedStorage) finalPrice += selectedStorage.priceModifier || 0;
    if (selectedRam) finalPrice += selectedRam.priceModifier || 0;
    return finalPrice;
  };

  const handleAddToCart = () => {
    if (!user) {
      if (typeof showToast === 'function') {
        showToast('🔒 Увійдіть в акаунт, щоб додавати товары в кошик!');
      }
      return;
    }

    const cartItem = {
      id: product.id || id,
      title: product.title,
      price: calculateTotalPrice(),
      color: selectedColor || 'Стандарт',
      storage: selectedStorage ? selectedStorage.storage : 'Base',
      ram: selectedRam ? selectedRam.ram : null,
      image: mainImageUrl 
    };

    addToCart(cartItem);
  };

  const handleOneClickBuy = async (e) => {
    e.preventDefault();
    if (!fastName.trim() || !fastPhone.trim()) {
      if (typeof showToast === 'function') showToast('⚠️ Заповніть контактні дані логування!');
      return;
    }

    setFastLoading(true);
    try {
      const fastOrder = {
        customerName: fastName.trim(),
        customerPhone: fastPhone.trim(),
        deliveryMethod: 'Швидке замовлення в 1 клік',
        createdAt: serverTimestamp(),
        totalPrice: calculateTotalPrice(),
        items: [{
          title: product.title,
          color: selectedColor || 'Не обрано',
          storage: selectedStorage ? selectedStorage.storage : 'Base',
          ram: selectedRam ? selectedRam.ram : 'Base'
        }]
      };

      await addDoc(collection(db, 'orders'), fastOrder);
      if (typeof showToast === 'function') showToast('🚀 Замовлення прийнято! Менеджер зателефонує.');
      setShowOneClickModal(false);
      setFastName('');
      setFastPhone('');
    } catch (err) {
      console.error(err);
      if (typeof showToast === 'function') showToast('❌ Помилка фіксації експрес-замовлення');
    } finally {
      setFastLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* ЛІВА ЧАСТИНА: ГАЛЕРЕЯ */}
        <div className="space-y-4">
          <div className="w-full aspect-square bg-white dark:bg-gray-900 rounded-3xl flex items-center justify-center p-8 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
            <img src={mainImageUrl} alt={product.title} className="w-full h-full object-contain object-center transition-all duration-300 transform hover:scale-105" />
            {product.stock === 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider rounded-md">Немає в наявності</span>
            )}
          </div>

          {activeImages.length > 1 && (
            <div className="flex flex-wrap gap-3 pt-1">
              {activeImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-20 rounded-2xl border p-2 bg-white dark:bg-gray-900 transition-all ${
                    idx === activeImageIdx 
                      ? 'border-blue-600 ring-4 ring-blue-50 dark:ring-blue-950/50' 
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-contain rounded-lg" onError={(e) => { e.target.src = 'https://placehold.co/100?text=Bitecore'; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ПРАВА ЧАСТИНА */}
        <div className="space-y-8 bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest">{product.brand || 'Premium Lot'}</span>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mt-1 uppercase tracking-tight">{product.title}</h1>
            <p className="text-xs text-gray-400 mt-2 font-medium leading-relaxed">{product.description || 'Опис даного девайса наразі заповнюється нашими технічними спеціалістами.'}</p>
          </div>

          <div className="pt-2 pb-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Загальна вартість:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black tracking-tight text-gray-900 dark:text-white font-sans">{calculateTotalPrice().toLocaleString()}</span>
                <span className="text-lg font-bold text-gray-500 dark:text-gray-400">грн</span>
              </div>
            </div>
          </div>

          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">🎨 Оберіть колір корпусу:</label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`px-4 py-2.5 text-xs font-black rounded-xl uppercase border transition-all ${
                      selectedColor === c 
                        ? 'bg-gray-900 text-white border-transparent dark:bg-white dark:text-black shadow-md' 
                        : 'bg-gray-50 text-gray-800 border-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">💾 Об'єм вбудованої пам'яті:</label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedStorage(v)}
                    className={`p-3 text-left rounded-xl border flex flex-col justify-between gap-1 transition-all ${
                      selectedStorage?.storage === v.storage
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500'
                        : 'border-gray-100 bg-gray-50 dark:border-transparent dark:bg-gray-800/60 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs font-black text-gray-900 dark:text-white">{v.storage}</span>
                    <span className="text-[9px] text-gray-400 font-bold">
                      {v.priceModifier > 0 ? `+${v.priceModifier.toLocaleString()} грн` : 'Базова пам\'ять'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 🔥 ФІКС БАГУ: ДОДАНО БЛОК ТЕХНІЧНИХ ХАРАКТЕРИСТИК (SPECS) */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">⚙️ Технічні характеристики:</label>
              <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 space-y-2.5">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-xs border-b border-gray-100/70 dark:border-gray-800/50 last:border-0 pb-2 last:pb-0">
                    <span className="font-bold text-gray-400 uppercase tracking-wide text-[10px]">{key}</span>
                    <span className="font-black text-gray-800 dark:text-gray-200">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
            <button 
              type="button" 
              onClick={handleAddToCart}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
            >
              🛒 Додати в кошик
            </button>
            <button 
              type="button" 
              onClick={() => setShowOneClickModal(true)}
              className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all cursor-pointer"
            >
              ⚡ Швидке замовлення
            </button>
          </div>
        </div>

      </div>

      {/* МОДАЛЬНЕ ВІКНО ШВИДКОГО ЗАМОВЛЕННЯ */}
      {showOneClickModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-black uppercase text-gray-900 dark:text-white">🚀 Експрес-Оформлення</h3>
              <button type="button" onClick={() => setShowOneClickModal(false)} className="text-xl text-gray-400 hover:text-gray-600 font-bold cursor-pointer">×</button>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Залиште свої контакти. Наш менеджер складу миттєво зарезервує девайс під вас і зателефонує для підтвердження доставки.</p>
            
            <form onSubmit={handleOneClickBuy} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Ваше Ім'я *</label>
                <input type="text" value={fastName} onChange={e => setFastName(e.target.value)} placeholder="Іван" className="w-full px-4 py-3 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Номер телефону *</label>
                <input type="tel" value={fastPhone} onChange={e => setFastPhone(e.target.value)} placeholder="+380" className="w-full px-4 py-3 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl text-gray-900 dark:text-white outline-none focus:border-blue-500" required />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={fastLoading} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md cursor-pointer transition-colors">
                  {fastLoading ? 'Синхронізація з базою...' : 'Підтвердити замовлення ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}