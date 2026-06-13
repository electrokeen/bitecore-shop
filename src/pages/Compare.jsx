import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const SPEC_LABELS = {
  processor: "🧠 Процесор / Чіпсет",
  display: "📺 Дисплей / Екран",
  ram: "⚡ Оперативна пам'ять (RAM)",
  camera: "📸 Системи камер",
  gpu: "🎮 Гра Графічний чіп (GPU)",
  type: "🎧 Форм-фактор / Тип",
  connection: "📶 Бездротове підключення",
  battery: "🔋 Акумулятор / Автономність",
  anc: "🔇 Шумозаглушення (ANC)",
  material: "🛡️ Матеріал корпусу",
  waterResistance: "💧 Вологозахист",
  maxResolution: "🖥️ Макс. роздільна здатність",
  package: "📦 Комплектація поставки",
  power: "🔌 Потужність живлення (W)",
  ports: "🔌 Інтерфейси / Роз'єми",
  capacity: "🔋 Номінальна ємність"
};

export default function Compare() {
  const { compareList, toggleCompare, addToCart, showToast } = useApp();

  const getActiveSpecKeys = () => {
    const keys = new Set();
    compareList.forEach(prod => {
      if (prod.specs) {
        Object.keys(prod.specs).forEach(key => {
          const val = prod.specs[key];
          if (val && val !== 'Н/В' && val !== 'Не вказано' && val !== '—') {
            keys.add(key);
          }
        });
      }
    });
    return Array.from(keys);
  };

  const activeSpecKeys = getActiveSpecKeys();

  if (compareList.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <span className="text-6xl">📊</span>
        <h1 className="text-xl font-black tracking-tight">Список порівняння порожній</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Додайте девайси до порівняння, щоб зіставити їхні характеристики.
        </p>
        <div className="pt-2">
          <Link to="/catalog" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all">
            Відкрити каталог 📦
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">📊 Порівняння товарів</h1>
        <p className="text-xs text-gray-400 mt-0.5">Порівняння технічних характеристик та можливостей обраних пристроїв ({compareList.length})</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left table-fixed min-w-[700px]">
            
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                <th className="p-5 w-64 text-xs font-black uppercase text-gray-400 tracking-wider align-middle">
                  Параметри моделі
                </th>
                {compareList.map((prod) => (
                  <th key={prod.id} className="p-5 relative group min-w-[220px] align-top">
                    
                    <button
                      onClick={() => { toggleCompare(prod); }}
                      className="absolute top-3 right-3 text-gray-400 hover:text-rose-500 text-sm font-bold cursor-pointer transition-colors p-1"
                      title="Прибрати з порівняння"
                    >
                      ✕
                    </button>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3">
                        
                        {/* 🔥 РОЗУМНИЙ ФІКС ФОТО: Захист від текстових емодзі, беремо URL з масиву images */}
                        <div className="h-14 w-14 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 dark:border-gray-600">
                          {(() => {
                            const prodImages = prod.images || [];
                            const firstImageObj = prodImages[0];
                            const backupUrl = typeof firstImageObj === 'object' ? firstImageObj?.url : firstImageObj;
                            const finalUrl = (prod.image && String(prod.image).startsWith('http')) ? prod.image : backupUrl;

                            return (finalUrl && String(finalUrl).startsWith('http')) ? (
                              <img src={finalUrl} alt={prod.title} className="w-full h-full object-contain p-1" />
                            ) : (
                              <span className="text-2xl select-none">{prod.image || '📦'}</span>
                            );
                          })()}
                        </div>
                        
                        <div className="truncate">
                          <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">{prod.brand}</span>
                          <Link to={`/product/${prod.id}`} className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight block hover:text-blue-600 transition-colors">
                            {prod.title}
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Ціна</span>
                          <span className="font-black text-sm text-gray-900 dark:text-white">{prod.price?.toLocaleString()} грн</span>
                        </div>
                        <button
                          onClick={() => {
                            addToCart(prod);
                            if (typeof showToast === 'function') showToast(`🛒 ${prod.title} додано до кошика!`);
                          }}
                          disabled={!prod.stock}
                          className={`px-3 py-1.5 font-bold text-[10px] rounded-lg shadow-sm transition-all active:scale-95 ${prod.stock > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 cursor-not-allowed shadow-none'}`}
                        >
                          {prod.stock > 0 ? 'Купити' : 'Очікується'}
                        </button>
                      </div>
                    </div>

                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-xs font-medium">
              
              <tr>
                <td className="p-4 bg-gray-50/30 dark:bg-gray-900/10 font-black text-gray-400 uppercase tracking-wide text-[10px]">
                  🎨 Доступні кольори
                </td>
                {compareList.map(prod => (
                  <td key={prod.id} className="p-4 text-gray-700 dark:text-gray-300 font-bold leading-relaxed">
                    {prod.colors ? prod.colors.join(', ') : 'Стандартний'}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 bg-gray-50/30 dark:bg-gray-900/10 font-black text-gray-400 uppercase tracking-wide text-[10px]">
                  💾 Конфігурації
                </td>
                {compareList.map(prod => {
                  const hasRealVariants = prod.variants && prod.variants.length > 0 && !prod.variants.every(v => v.storage === 'Standard');
                  return (
                    <td key={prod.id} className="p-4 text-blue-600 dark:text-blue-400 font-mono font-bold leading-relaxed">
                      {hasRealVariants ? prod.variants.map(v => v.storage).join(' | ') : 'Базова'}
                    </td>
                  );
                })}
              </tr>

              {activeSpecKeys.map((key) => (
                <tr key={key} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/10 transition-colors">
                  <td className="p-4 bg-gray-50/30 dark:bg-gray-900/10 font-black text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wide">
                    {SPEC_LABELS[key] || `⚙️ ${key}`}
                  </td>
                  {compareList.map((prod) => {
                    const specValue = prod.specs ? prod.specs[key] : null;
                    const isValid = specValue && specValue !== 'Н/В' && specValue !== 'Не вказано' && specValue !== '—';
                    return (
                      <td key={prod.id} className="p-4 text-gray-950 dark:text-white font-bold leading-relaxed">
                        {isValid ? specValue : <span className="text-gray-300 dark:text-gray-600 font-normal">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr>
                <td className="p-4 bg-gray-50/30 dark:bg-gray-900/10 font-black text-gray-400 uppercase tracking-wide text-[10px]">
                  📦 Наявність
                </td>
                {compareList.map(prod => (
                  <td key={prod.id} className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${prod.stock > 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 text-rose-600'}`}>
                      {prod.stock > 0 ? `В наявності` : 'Під замовлення'}
                    </span>
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}