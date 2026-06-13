import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { cart, user: currentUser } = useApp();
  const userRole = currentUser && currentUser.email === 'kartochka@com' ? 'admin' : 'user';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* ✨ НОВИЙ СТИЛЬНИЙ ЛОГОТИП */}
          <div className="flex items-center gap-8">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-black tracking-widest text-gray-900 flex items-center gap-2 select-none">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
              BITECORE <span className="text-[9px] font-bold text-blue-600 border border-blue-200 px-1 rounded">STORE</span>
            </Link>

            <div className="hidden md:flex items-center gap-5 text-xs font-black uppercase tracking-wider">
              <NavLink to="/" className={({ isActive }) => isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}>Головна</NavLink>
              <NavLink to="/catalog" className={({ isActive }) => isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}>Каталог</NavLink>
              <NavLink to="/compare" className={({ isActive }) => isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}>Порівняння</NavLink>
              <NavLink to="/trade-in" className={({ isActive }) => isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}>Трейд-ін</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Кнопку теми повністю прибрано */}

            <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-sm relative flex items-center justify-center">
              🛒
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white font-mono font-black text-[9px] h-4 w-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {totalCartItems}
                </span>
              )}
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-2">
                {userRole === 'admin' && (
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="hidden lg:inline-block px-3 py-1.5 bg-amber-500 text-white font-black text-[10px] uppercase rounded-lg">Admin</Link>
                )}
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="h-8 w-8 bg-blue-600 text-white font-black rounded-xl flex items-center justify-center text-xs uppercase select-none">
                  {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                </Link>
              </div>
            ) : (
              <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="inline-block px-4 py-2 bg-gray-900 text-white font-black text-xs uppercase rounded-xl shadow-xs">
                Увійти
              </Link>
            )}

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-700">
              <div className="w-5 h-5 flex flex-col justify-between items-center relative">
                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>

          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 shadow-xl">
          <div className="px-4 space-y-2 flex flex-col text-xs font-black uppercase tracking-widest">
            <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `p-3 rounded-xl ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>Головна</NavLink>
            <NavLink to="/catalog" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `p-3 rounded-xl ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>Каталог</NavLink>
            <NavLink to="/compare" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `p-3 rounded-xl ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>Порівняння</NavLink>
            <NavLink to="/trade-in" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `p-3 rounded-xl ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>Трейд-ін</NavLink>
          </div>
        </div>
      )}
    </nav>
  );
}