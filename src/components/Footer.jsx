import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Блок бренду */}
          <div className="space-y-3">
            <span className="text-lg font-black tracking-wider text-blue-600 dark:text-blue-500 uppercase">
              ⚡ Bitecore
            </span>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              Сучасний маркетплейс флагманської техніки та гаджетів майбутнього. Хмарна інтеграція та матричний аналіз заліза в реальному часі.
            </p>
          </div>

          {/* Швидка навігація */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Навігація</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-600 dark:text-gray-400">
              <Link to="/" className="hover:text-blue-600 transition-colors">Головна</Link>
              <Link to="/catalog" className="hover:text-blue-600 transition-colors">Каталог</Link>
              <Link to="/cart" className="hover:text-blue-600 transition-colors">Кошик</Link>
              <Link to="/compare" className="hover:text-blue-600 transition-colors">Порівняння</Link>
            </div>
          </div>

          {/* Копірайт та ТЗ */}
          <div className="space-y-3 text-left md:text-right flex flex-col md:items-end justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Статус системи</h4>
              <p className="text-[10px] font-mono font-bold text-emerald-500 uppercase bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded w-fit md:ml-auto">
                ● Cloud Firestore Online
              </p>
            </div>
            <p className="text-[11px] font-bold text-gray-400">
              &copy; {new Date().getFullYear()} Bitecore. Усі права захищено.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}