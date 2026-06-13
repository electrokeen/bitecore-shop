import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { useApp } from '../context/AppContext';

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState(14400); 

  // Підключаємо функції та масиви стану з глобального контексту (додали showToast)
  const { cart, addToCart, removeFromCart, favorites, toggleFavorite, compareList, toggleCompare, showToast } = useApp();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setProducts(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getProductImageSrc = (product) => {
    const productImages = product?.images || [];
    const firstImageObj = productImages[0];
    const imageUrl = typeof firstImageObj === 'object' ? firstImageObj?.url : firstImageObj;
    return imageUrl || (typeof product?.image === 'string' && product.image.startsWith('http') ? product.image : null);
  };

  // Фільтрація потоків даних зі складу
  const hotProducts = products.slice(0, 4); 
  const newProducts = products.slice(-5).reverse(); 

  const dellXpsSale = {
    id: 'dell-xps-sale-id', 
    title: 'Dell XPS 13 Plus 9320',
    brand: 'Dell',
    price: 54999, 
    oldPrice: 68000,
    image: '💻', 
    images: [],
    colors: ['Platinum'],
    storageOptions: ['512GB']
  };

  // 🔥 ОНОВЛЕНІ ХЕНДЛЕРИ: Тепер працюють виключно через гарний локальний Toast сайту
  const handleFavClick = (product, isFav) => {
    toggleFavorite(product);
  };

  const handleCompareClick = (product, isInCompare) => {
    toggleCompare(product);
  };

  const handleCartAction = (product, isInCart) => {
    if (isInCart) {
      const activeItem = cart.find(c => String(c.id) === String(product.id));
      removeFromCart(product.id, activeItem?.color, activeItem?.storage);
    } else {
      addToCart({ 
        ...product, 
        id: String(product.id),
        quantity: 1, 
        color: product.colors?.[0] || 'Стандарт', 
        storage: product.variants?.[0]?.storage || 'Base' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 pb-16">
      
      {/* 1. СЛАЙДЕР БАНЕРІВ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative group">
        <div className="relative h-[340px] sm:h-[380px] rounded-[32px] overflow-hidden shadow-md">
          
          {/* Слайд 1: MacBook Pro & Air */}
          <div className={`absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-zinc-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-center transition-opacity duration-700 ${currentSlide === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <div className="max-w-xl space-y-4">
              <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 font-black text-[10px] uppercase tracking-widest rounded-full border border-blue-500/20">
                Офіційна поставка
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none">
                Нова лінійка <br />
                <span className="text-blue-400">
                  MacBook Pro & Air
                </span>
              </h1>
              <p className="text-xs text-slate-400 max-w-sm font-medium leading-relaxed">
                Повне оновлення апаратних конфігурацій. Підвищена енергоефективність, розширені можливості архітектури та максимальна автономність для складних обчислювальних завдань.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/catalog', { state: { filterCategory: 'Laptops', filterBrand: 'Apple' } })}
                  className="px-5 py-2.5 bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
                >
                  Перейти до конфігуратора ➔
                </button>
              </div>
            </div>
          </div>

          {/* Слайд 2: Оптимальний Trade-In */}
          <div className={`absolute inset-0 bg-gradient-to-br from-zinc-900 via-slate-900 to-neutral-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-center text-center transition-opacity duration-700 ${currentSlide === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <div className="max-w-xl space-y-4 flex flex-col items-center">
              <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 font-black text-[10px] uppercase tracking-widest rounded-full border border-emerald-500/20">
                Програма модернізації
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none">
                Оптимальний Trade-In <br />
                <span className="text-emerald-400">
                  Оновлення техніки
                </span>
              </h1>
              <p className="text-xs text-slate-400 max-w-sm font-medium leading-relaxed">
                Здайте свій поточний пристрій або консоль минулого покоління та отримайте розрахунок залишкової вартості як знижку на придбання нових девайсів складу.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => navigate('/trade-in')} 
                  className="px-5 py-2.5 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
                >
                  Розрахувати вартість ➔
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. БЛОК КАТЕГОРІЙ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Категорії товарів</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { id: 'Smartphones', label: 'Смартфони', icon: '📱' },
            { id: 'Laptops', label: 'Ноутбуки', icon: '💻' },
            { id: 'Audio', label: 'Навушники', icon: '🎧' },
            { id: 'Gadgets', label: 'Гаджети', icon: '⌚' },
            { id: 'Consoles', label: 'Консолі', icon: '🎮' },
            { id: 'All', label: 'Усі категорії', icon: '✨' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate('/catalog', { state: { filterCategory: cat.id } })}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 hover:border-blue-500 group cursor-pointer"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-[11px] font-black uppercase tracking-tight text-gray-700">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. БЛОК ГАРЯЧА АКЦІЯ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-xs">
          
          <div className="space-y-2">
            <span className="px-2.5 py-1 bg-red-600 text-white font-black text-[9px] uppercase tracking-widest rounded-md">
              Строк дії пропозиції обмежено
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">До завершення акції:</h2>
            <div className="text-3xl font-mono font-black tracking-wider text-red-600 bg-red-50 inline-block px-4 py-2 rounded-xl border border-red-200">
              {formatTime(timeLeft)}
            </div>
          </div>

          <Link to={`/product/${dellXpsSale.id}`} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-blue-500 transition-colors block group">
            <div className="text-3xl bg-white p-3 rounded-xl shrink-0 border shadow-xs">💻</div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest block">Спеціальна ціна</span>
              <h3 className="font-black text-sm uppercase truncate text-gray-900 group-hover:text-blue-600 transition-colors">{dellXpsSale.title}</h3>
              <p className="text-[10px] font-medium text-gray-400 mt-0.5">Ultrabook / Core i7 / 16GB / 512GB</p>
            </div>
          </Link>

          <div className="flex items-center md:justify-end gap-4 justify-between border-t md:border-t-0 pt-4 md:pt-0 border-dashed border-gray-200">
            <div className="text-left md:text-right">
              <span className="text-xs text-gray-400 font-bold line-through block">{dellXpsSale.oldPrice.toLocaleString()} грн</span>
              <span className="text-xl font-black text-red-600 font-sans">{dellXpsSale.price.toLocaleString()} <span className="text-xs font-bold">грн</span></span>
            </div>
            
            {/* 🔥 ФІКС АКЦІЙНОЇ КНОПКИ: Видалили alert */}
            <button
              type="button"
              onClick={() => {
                const isInCart = cart?.some(c => String(c.id) === String(dellXpsSale.id));
                if (isInCart) {
                  removeFromCart(dellXpsSale.id, 'Platinum', '512GB');
                } else {
                  addToCart({ ...dellXpsSale, id: String(dellXpsSale.id), quantity: 1, color: 'Platinum', storage: '512GB' });
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${cart?.some(c => String(c.id) === String(dellXpsSale.id)) ? 'bg-amber-500 text-white border-amber-600' : 'bg-gray-900 text-white border-transparent'}`}
            >
              {cart?.some(c => String(c.id) === String(dellXpsSale.id)) ? 'Прибрати ✓' : 'Купити'}
            </button>
          </div>

        </div>
      </div>

      {/* 4. ПОПУЛЯРНІ ТОВАРИ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 space-y-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Популярні товари</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Позиції складу з найвищим показником оборотності та попиту</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {hotProducts.map((product) => {
            const isFavorite = favorites?.some(f => String(f.id) === String(product.id));
            const isInCompare = compareList?.some(c => String(c.id) === String(product.id));
            const isInCart = cart?.some(c => String(c.id) === String(product.id));
            const finalSrc = getProductImageSrc(product);

            return (
              <div key={product.id} className="group bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
                
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/80 backdrop-blur-xs p-1 rounded-xl border border-gray-100 shadow-xs">
                  <button
                    onClick={() => handleFavClick(product, isFavorite)}
                    className={`p-2 rounded-lg text-xs transition-all cursor-pointer hover:scale-110 active:scale-90 ${isFavorite ? 'bg-red-50' : 'bg-transparent text-gray-400'}`}
                    title={isFavorite ? "Прибрати з обраного" : "Додати в обране"}
                  >
                    {isFavorite ? '❤️' : '🤍'}
                  </button>
                  <button
                    onClick={() => handleCompareClick(product, isInCompare)}
                    className={`p-2 rounded-lg text-xs transition-all cursor-pointer hover:scale-110 active:scale-90 ${isInCompare ? 'bg-blue-50' : 'bg-transparent text-gray-400'}`}
                    title={isInCompare ? "Прибрати з порівняння" : "Додати до порівняння"}
                  >
                    {isInCompare ? '🔵' : '🔄'}
                  </button>
                </div>

                <Link to={`/product/${product.id}`} className="w-full aspect-square relative overflow-hidden bg-gray-50 rounded-2xl p-4 mb-4 flex items-center justify-center block">
                  {finalSrc ? (
                    <img src={finalSrc} alt={product.title} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-2xl rounded-xl">📦</div>
                  )}
                </Link>

                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest block">{product.brand || 'Apple'}</span>
                  
                  <Link to={`/product/${product.id}`} className="text-sm font-black text-gray-900 uppercase truncate block hover:text-blue-600 transition-colors">
                    {product.title}
                  </Link>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <span className="text-sm font-black text-gray-900 font-sans">{product.price?.toLocaleString()} <span className="text-xs font-bold text-gray-400">грн</span></span>
                    <button
                      type="button"
                      onClick={() => handleCartAction(product, isInCart)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${isInCart ? 'bg-amber-500 text-white border-amber-600' : 'bg-gray-900 text-white border-transparent'}`}
                    >
                      {isInCart ? 'Прибрати ✓' : 'Купити'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. НОВІ НАДХОДЖЕННЯ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Нові надходження</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Останні додані матеріальні активи та нові товарні номенклатури складу</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {newProducts.map((product) => {
            const isInCart = cart?.some(c => String(c.id) === String(product.id));
            const finalSrc = getProductImageSrc(product);

            return (
              <div key={product.id} className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between transition-all">
                
                <Link to={`/product/${product.id}`} className="w-full aspect-square bg-gray-50 rounded-xl p-2 mb-3 flex items-center justify-center block overflow-hidden">
                  {finalSrc ? (
                    <img src={finalSrc} alt={product.title} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl bg-gray-100 text-gray-400 rounded-lg">📦</div>
                  )}
                </Link>

                <div className="space-y-1">
                  <Link to={`/product/${product.id}`} className="text-xs font-black uppercase truncate text-gray-900 block hover:text-blue-600 transition-colors">
                    {product.title}
                  </Link>
                  <p className="text-xs font-black text-blue-600 font-sans">{product.price?.toLocaleString()} грн</p>
                  
                  <button
                    type="button"
                    onClick={() => handleCartAction(product, isInCart)}
                    className={`w-full mt-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${isInCart ? 'bg-amber-500 text-white border-amber-600' : 'bg-gray-900 text-white border-transparent'}`}
                  >
                    {isInCart ? 'Прибрати ✓' : 'Купити'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-6 flex justify-center">
          <Link to="/catalog" className="px-8 py-3 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-mdід">
            Перейти до повного каталогу товарів ({products.length})
          </Link>
        </div>
      </div>

    </div>
  );
}