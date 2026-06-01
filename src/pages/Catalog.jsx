import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { useApp } from '../context/AppContext';

const CATEGORY_MAP = [
  { id: 'All', label: '✨ Все підряд' },
  { id: 'Smartphones', label: '📱 Смартфони' },
  { id: 'Laptops', label: '💻 Ноутбуки' },
  { id: 'Audio', label: '🎧 Навушники' },
  { id: 'Gadgets', label: '⌚ Гаджети' },
  { id: 'Consoles', label: '🎮 Консолі' },
];

export default function Catalog() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ініціалізація стейтів з sessionStorage
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('cat_searchQuery') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => sessionStorage.getItem('cat_selectedCategory') || 'All');
  const [selectedBrand, setSelectedBrand] = useState(() => sessionStorage.getItem('cat_selectedBrand') || 'All');
  const [minPrice, setMinPrice] = useState(() => sessionStorage.getItem('cat_minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(() => sessionStorage.getItem('cat_maxPrice') || '');
  const [sortBy, setSortBy] = useState(() => sessionStorage.getItem('cat_sortBy') || 'newest');
  
  const [showFilterMenu, setShowFilterMenu] = useState(() => sessionStorage.getItem('cat_showFilterMenu') === 'true');

  const { favorites, toggleFavorite, compareList, toggleCompare } = useApp();

  // Синхронізація стейтів із sessionStorage 
  useEffect(() => { sessionStorage.setItem('cat_searchQuery', searchQuery); }, [searchQuery]);
  useEffect(() => { sessionStorage.setItem('cat_selectedCategory', selectedCategory); }, [selectedCategory]);
  useEffect(() => { sessionStorage.setItem('cat_selectedBrand', selectedBrand); }, [selectedBrand]);
  useEffect(() => { sessionStorage.setItem('cat_minPrice', minPrice); }, [minPrice]);
  useEffect(() => { sessionStorage.setItem('cat_maxPrice', maxPrice); }, [maxPrice]);
  useEffect(() => { sessionStorage.setItem('cat_sortBy', sortBy); }, [sortBy]);
  useEffect(() => { sessionStorage.setItem('cat_showFilterMenu', showFilterMenu); }, [showFilterMenu]);

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

  // Підхоплення кліків категорій та складних банерів з головної сторінки
  useEffect(() => {
    if (location.state) {
      if (location.state.filterCategory) {
        setSelectedCategory(location.state.filterCategory);
      }
      if (location.state.filterBrand) {
        setSelectedBrand(location.state.filterBrand);
      }
      if (location.state.filterBrand || location.state.filterCategory) {
        setShowFilterMenu(true); 
      }
    }
  }, [location.state]);

  // Розумний фільтр брендів
  const availableBrands = ['All', ...new Set(
    products
      .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
      .map(p => p.brand)
      .filter(Boolean)
  )];

  // 🔥 ФІКС «ПАМ'ЯТІ»: Скидаємо бренд тільки якщо товари вже завантажені, щоб не затирати sessionStorage при старті
  useEffect(() => {
    if (products.length > 0 && selectedBrand !== 'All' && !availableBrands.includes(selectedBrand)) {
      setSelectedBrand('All');
    }
  }, [selectedCategory, products, availableBrands]);

  // Фільтрація
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    const matchesMinPrice = minPrice === '' || Number(p.price) >= Number(minPrice);
    const matchesMaxPrice = maxPrice === '' || Number(p.price) <= Number(maxPrice);
    
    return matchesSearch && matchesCategory && matchesBrand && matchesMinPrice && matchesMaxPrice;
  });

  // Сортування
  const sortedProducts = filteredProducts.sort((a, b) => {
    if (sortBy === 'cheap') return a.price - b.price;
    if (sortBy === 'expensive') return b.price - a.price;
    if (sortBy === 'newest') {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
      
      {/* ПАНЕЛЬ УПРАВЛІННЯ */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="w-full sm:w-auto flex items-center gap-2 flex-1 max-w-md">
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔎 Швидкий пошук девайса за назвою..." 
            className="w-full px-4 py-2.5 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl focus:border-blue-500 outline-none text-gray-900 dark:text-white"
          />
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${
              showFilterMenu ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-900 text-white dark:bg-white dark:text-black'
            }`}
          >
            🎛️ Фільтри {showFilterMenu ? '▲' : '▼'}
          </button>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 justify-end shrink-0">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Сортувати:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl outline-none text-gray-900 dark:text-white cursor-pointer focus:border-blue-500"
          >
            <option value="newest">🆕 Спочатку найновіші</option>
            <option value="cheap">📉 Спочатку дешевші</option>
            <option value="expensive">📈 Спочатку дорожчі</option>
          </select>
        </div>
      </div>

      {/* РОЗУМНЕ МЕНЮ ФІЛЬТРІВ */}
      {showFilterMenu && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Оберіть бренд</label>
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-2.5 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl outline-none text-gray-900 dark:text-white cursor-pointer"
              >
                {availableBrands.map(b => (
                  <option key={b} value={b}>{b === 'All' ? '📌 Всі доступні марки' : b}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Діапазон ціни (грн)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  placeholder="Від: 0" 
                  className="w-full px-4 py-2.5 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl outline-none text-gray-900 dark:text-white"
                />
                <span className="text-gray-400 font-bold">—</span>
                <input 
                  type="number" 
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  placeholder="До: 150 000" 
                  className="w-full px-4 py-2.5 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Категорія пристрою</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_MAP.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedBrand('All');
                setMinPrice('');
                setMaxPrice('');
                setSearchQuery('');
              }}
              className="text-xs font-black uppercase text-rose-600 hover:underline cursor-pointer"
            >
              Скинути параметри фільтрації ×
            </button>
          </div>
        </div>
      )}

      {/* СІТКА КАТАЛОГУ */}
      {sortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map(product => {
            const isFavorite = favorites?.some(f => String(f.id) === String(product.id));
            const isInCompare = compareList?.some(c => String(c.id) === String(product.id));

            const productImages = product?.images || [];
            const firstImageObj = productImages[0];
            const imageUrl = typeof firstImageObj === 'object' ? firstImageObj?.url : firstImageObj;
            const finalSrc = imageUrl || (typeof product?.image === 'string' && product.image.startsWith('http') ? product.image : null);

            return (
              <div key={product.id} className="group bg-white p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
                
                {/* Панель кнопок */}
                <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(product)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                      isFavorite ? 'bg-red-600 border-red-700 text-white shadow-xs' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-red-600'
                    }`}
                  >
                    {isFavorite ? '❤️' : '🤍'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompare(product)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                      isInCompare ? 'bg-blue-600 border-blue-700 text-white shadow-xs' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-blue-600'
                    }`}
                  >
                    {isInCompare ? '🔹' : '🔄'}
                  </button>
                </div>

                <Link to={`/product/${product.id}`} className="block flex flex-col justify-between h-full group/link">
                  
                  <div className="w-full aspect-square relative overflow-hidden bg-gray-50 dark:bg-gray-950 rounded-2xl p-4 mb-4 flex items-center justify-center">
                    {finalSrc ? (
                      <img src={finalSrc} alt={product.title} className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 text-2xl rounded-2xl">📦</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest block">{product.brand || 'Premium'}</span>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate group-hover/link:text-blue-600 transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-lg font-black text-gray-900 dark:text-white font-sans">{product.price?.toLocaleString()}</span>
                      <span className="text-xs font-bold text-gray-400">грн</span>
                    </div>
                  </div>

                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center py-20 text-gray-400 font-medium bg-white dark:bg-gray-900 rounded-3xl border border-dashed">Пристроїв за вказаними фільтрами не виявлено на складі.</p>
      )}
    </div>
  );
}