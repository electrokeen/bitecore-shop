import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase/config';
import { collection, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useApp } from '../context/AppContext';

export default function Admin() {
  const { showToast } = useApp();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tradeInAppeals, setTradeInAppeals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Стейт для відстеження товару та замовлення
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // 🔥 Для розгорнутого перегляду пошти отримувача

  // Головні стейти картки товару
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [category, setCategory] = useState('Smartphones');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [existingImages, setExistingImages] = useState([]); 

  // Стейт для фотолабораторії
  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [uploadProgress, setUploadProgress] = useState(0);

  // Конфігурації заліза
  const [colors, setColors] = useState(['Space Gray', 'Silver', 'Midnight']);
  const [newColor, setNewColor] = useState('');
  
  const [variants, setVariants] = useState([
    { storage: '128GB', priceModifier: 0 },
    { storage: '256GB', priceModifier: 4000 }
  ]);
  const [newStorage, setNewStorage] = useState('');
  const [newStorageModifier, setNewStorageModifier] = useState('');

  const [ramVariants, setRamVariants] = useState([
    { ram: '8GB', priceModifier: 0 },
    { ram: '16GB', priceModifier: 8000 }
  ]);
  const [newRam, setNewRam] = useState('');
  const [newRamModifier, setNewRamModifier] = useState('');

  const [specs, setSpecs] = useState({});

  const SPECS_TEMPLATES = {
    Smartphones: { 'Екран': '6.7" Super Retina XDR', 'Процесор': 'Apple A17 Pro', 'Камера': '48MP + 12MP', 'Акумулятор (%)': '100%', 'Стан корпусу': 'Ідеал (А+)' },
    Laptops: { 'Процесор': 'Apple M3 Max', 'Екран': '14.2" Liquid Retina XDR', 'Відеокарта': '14-core GPU', 'Батарея (Цикли)': '12 циклів', 'Стан/Комплект': 'Б/В, коробка, оригінальний блок' },
    Audio: { 'Тип навушників': 'Повнорозмірні / Вакуумні', 'Шумозаглушення': 'Активне (ANC)', 'Час роботи': 'до 20 годин', 'Комплектація': 'Лише навушники / Повний комплект', 'Стан амбушур': 'Нові / Оригінальні (Ідеал)' },
    Gadgets: { 'Розмір корпусу': '45mm', 'Тип зв\'язку': 'GPS + Cellular', 'Здоров\'я акумулятора': '94%', 'Ремінець': 'Оригінальний силікон', 'Стан': 'Мікроподряпини на склі' },
    Consoles: { 'Ревізія/Модель': 'PlayStation 5 Slim', 'Прошивка': 'Офіційна (Актуальна)', 'Комплект геймпадів': '1 шт (DualSense)', 'Стан оптичного приводу': 'Працює ідеально', 'Нюанси': 'Без дефектів, не шумить' },
    Accessories: { 'Тип аксесуара': 'Чохол / MagSafe Charger / Кабель', 'Матеріал': 'FineWoven / Силікон', 'Сумісність': 'iPhone 15 Series', 'Стан пакування': 'Відкрита коробка / Без блістера' }
  };

  useEffect(() => {
    if (SPECS_TEMPLATES[category] && !editingProductId) {
      setSpecs(SPECS_TEMPLATES[category]);
    }
  }, [category, editingProductId]);

  // Реальний стрім з Firestore
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
      setProducts(items);
    });

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
      
      // Сортування хронології замовлень
      const sortedItems = items.sort((a, b) => {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return timeB - timeA; // Нові замовлення зверху (працює на мілісекундах Date.now())
      });
      setOrders(sortedItems);
    });

    const unsubTradeIn = onSnapshot(collection(db, 'tradeInRequests'), (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
      setTradeInAppeals(items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubTradeIn();
    };
  }, []);

  // Логіка файлів
  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const filesWithPreview = filesArray.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        color: 'Всі'
      }));
      setSelectedFiles(prev => [...prev, ...filesWithPreview]);
    }
  };

  const handleFileColorChange = (index, colorValue) => {
    setSelectedFiles(prev => prev.map((item, i) => i === index ? { ...item, color: colorValue } : item));
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilePromise = (fileObj) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `products/${Date.now()}_${fileObj.file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, fileObj.file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => { reject(error); }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL, color: fileObj.color });
        }
      );
    });
  };

  // Керування модифікаціями
  const addColorTag = () => {
    if (newColor.trim() && !colors.includes(newColor.trim())) {
      setColors([...colors, newColor.trim()]);
      setNewColor('');
    }
  };
  const removeColorTag = (idx) => setColors(colors.filter((_, i) => i !== idx));

  const addStorageVariant = () => {
    if (newStorage.trim()) {
      setVariants([...variants, { storage: newStorage.trim(), priceModifier: Number(newStorageModifier) || 0 }]);
      setNewStorage('');
      setNewStorageModifier('');
    }
  };
  const removeStorageVariant = (idx) => setVariants(variants.filter((_, i) => i !== idx));

  const addRamVariant = () => {
    if (newRam.trim()) {
      setRamVariants([...ramVariants, { ram: newRam.trim(), priceModifier: Number(newRamModifier) || 0 }]);
      setNewRam('');
      setNewRamModifier('');
    }
  };
  const removeRamVariant = (idx) => setRamVariants(ramVariants.filter((_, i) => i !== idx));

  const handleSpecChange = (key, val) => {
    setSpecs(prev => ({ ...prev, [key]: val }));
  };

  const handleStartEdit = (product) => {
    setEditingProductId(product.id);
    setTitle(product.title || '');
    setBrand(product.brand || 'Apple');
    setCategory(product.category || 'Smartphones');
    setPrice(product.price || '');
    setStock(product.stock || '');
    setDescription(product.description || '');
    setColors(product.colors || []);
    setVariants(product.variants || []);
    setRamVariants(product.ramVariants || []);
    setSpecs(product.specs || {});
    
    const formattedImages = (product.images || []).map(img => {
      if (typeof img === 'string') return { url: img, color: 'Всі' };
      return img;
    });
    setExistingImages(formattedImages);
    setSelectedFiles([]);
    setUploadProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setTitle(''); setPrice(''); setStock(''); setDescription('');
    setColors(['Space Gray', 'Silver', 'Midnight']);
    setNewColor('');
    setVariants([{ storage: '128GB', priceModifier: 0 }, { storage: '256GB', priceModifier: 4000 }]);
    setRamVariants([{ ram: '8GB', priceModifier: 0 }, { ram: '16GB', priceModifier: 8000 }]);
    setSpecs({});
    setExistingImages([]);
    setSelectedFiles([]);
    setUploadProgress(0);
  };

  const handleRemoveExistingImage = async (imgUrl) => {
    if (window.confirm('Видалити це зображення з картки товару?')) {
      const updatedImages = existingImages.filter(img => img.url !== imgUrl);
      setExistingImages(updatedImages);
      try {
        await updateDoc(doc(db, 'products', editingProductId), { images: updatedImages });
        showToast('📷 Фото вилучено з бази!');
      } catch (err) { console.error(err); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price || !stock) {
      showToast('⚠️ Заповніть обов\'язкові поля!');
      return;
    }

    setLoading(true);
    try {
      let uploadedImagesObjects = [];
      if (selectedFiles.length > 0) {
        uploadedImagesObjects = await Promise.all(
          selectedFiles.map(fileObj => uploadFilePromise(fileObj))
        );
      }

      const productPayload = {
        title: title.trim(),
        brand: brand.trim(),
        category: category.trim(),
        price: Number(price),
        stock: Number(stock),
        description: description.trim(),
        colors: colors,
        variants: variants,
        ramVariants: category === 'Laptops' || category === 'Smartphones' ? ramVariants : [],
        specs: specs,
      };

      if (editingProductId) {
        const finalImages = [...existingImages, ...uploadedImagesObjects];
        await updateDoc(doc(db, 'products', editingProductId), {
          ...productPayload,
          images: finalImages
        });
        showToast('🔄 Дані девайса оновлено!');
        handleCancelEdit();
      } else {
        await addDoc(collection(db, 'products'), {
          ...productPayload,
          images: uploadedImagesObjects,
          createdAt: serverTimestamp()
        });
        showToast('🚀 Новий девайс додано!');
        setTitle(''); setPrice(''); setStock(''); setDescription('');
        setSelectedFiles([]); setUploadProgress(0);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Помилка синхронізації');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Видалити пристрій зі складу?')) {
      await deleteDoc(doc(db, 'products', id));
      showToast('🗑️ Вилучено.');
      if (editingProductId === id) handleCancelEdit();
    }
  };

  const handleDeleteItem = async (colName, id) => {
    if (window.confirm('Очистити цей запис з історії системи?')) {
      await deleteDoc(doc(db, colName, id));
      showToast('🗑️ Запис видалено.');
      if (selectedOrder?.id === id) setSelectedOrder(null);
    }
  };

  const handleUpdateOrderStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      showToast('Статус замовлення оновлено!');
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) { showToast('❌ Помилка зміни статусу'); }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'tradeInRequests', id), { status: newStatus });
      showToast('Статус Trade-In оновлено!');
    } catch (err) { console.error(err); }
  };

  // Сортування потоків замовлень за новими типами доставки
  const standardOrders = orders.filter(o => o.delivery && o.delivery.method); 
  const expressOrders = orders.filter(o => !o.delivery); // Старі замовлення в 1 клік, де немає об'єкта delivery

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors text-gray-900 dark:text-white">
      
      {/* ХЕДЕР АДМІНКИ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">🎛️ Смарт-Термінал Складу</h1>
          <p className="text-xs text-gray-400 mt-1">Керування залишками заліза, фотолабораторією та логістикою посилок</p>
        </div>
        {editingProductId && (
          <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl">Скасувати редагування ×</button>
        )}
      </div>

      {/* ВЕРХНЯ СЕКЦІЯ: ФОРМА ЗАЛІЗА + СУМАРНИЙ СКЛАД */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-6">
          <h2 className="text-xs font-black uppercase text-blue-600 tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">1. Основні параметри лоту</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Категорія техніки</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 rounded-xl border border-transparent outline-none cursor-pointer">
                <option value="Smartphones">📱 Смартфони (iPhone / Pixel)</option>
                <option value="Laptops">💻 Ноутбуки (MacBook / PC)</option>
                <option value="Audio">🎧 Навушники (AirPods / Max)</option>
                <option value="Gadgets">⌚ Гаджети (Apple Watch)</option>
                <option value="Consoles">🎮 Консолі (Switch / PS5)</option>
                <option value="Accessories">🔋 Аксесуари (Чохли)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Назва моделі *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="iPhone 15 Pro Max" className="w-full px-4 py-3 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl focus:border-blue-500 outline-none" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400">Бренд</label>
              <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="w-full px-4 py-3 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400">Базова ціна (грн) *</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="42000" className="w-full px-4 py-3 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl" required />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400">Кількість на складі *</label>
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="1" className="w-full px-4 py-3 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl" required />
            </div>
          </div>

          <h2 className="text-xs font-black uppercase text-blue-600 tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2 pt-2">2. Кольори заліза</h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input type="text" value={newColor} onChange={e => setNewColor(e.target.value)} placeholder="Natural Titanium" className="flex-1 px-4 py-2.5 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl" />
              <button type="button" onClick={addColorTag} className="px-4 py-2.5 bg-gray-900 dark:bg-gray-700 text-white font-black text-xs rounded-xl">Додати колір</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c, idx) => (
                <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-xs font-bold rounded-lg border dark:border-gray-700">
                  {c} <button type="button" onClick={() => removeColorTag(idx)} className="text-red-500 font-black">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* ФОТОЛАБОРАТОРІЯ */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <label className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">📸 Смарт-Фотолабораторія (Синхронізація медіафайлів)</label>
            
            {editingProductId && existingImages.length > 0 && (
              <div className="space-y-2 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-[9px] text-gray-400 font-black uppercase">Малюнки лоту в базі:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {existingImages.map((img, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border bg-white dark:bg-gray-900 p-1 flex flex-col justify-between group">
                      <div className="w-full aspect-square relative overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
                        <img src={img.url} alt="existing" className="w-full h-full object-contain" />
                        <button type="button" onClick={() => handleRemoveExistingImage(img.url)} className="absolute inset-0 bg-rose-600/90 text-white font-black text-[9px] uppercase opacity-0 group-hover:opacity-100 transition-opacity">Видалити</button>
                      </div>
                      <span className="text-[9px] text-center font-black mt-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md block text-blue-600 truncate px-1">🎨 {img.color || 'Всі'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[9px] text-gray-400 font-black uppercase pt-1">Завантажити нові фото:</p>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
            
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-blue-600 h-1.5 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 animate-fadeIn">
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-wider">Прив'яжіть колір до нових фото:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedFiles.map((fileObj, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 rounded-xl">
                      <img src={fileObj.previewUrl} alt="preview" className="w-12 h-12 rounded-lg object-cover shrink-0 border" />
                      <div className="flex-1 min-w-0">
                        <select value={fileObj.color} onChange={(e) => handleFileColorChange(idx, e.target.value)} className="w-full text-[11px] font-bold py-1 px-2 bg-gray-50 dark:bg-gray-800 border rounded-md outline-none text-gray-900 dark:text-white">
                          <option value="Всі">✨ Для всіх кольорів</option>
                          {colors.map(c => <option key={c} value={c}>🎨 Колір: {c}</option>)}
                        </select>
                      </div>
                      <button type="button" onClick={() => removeSelectedFile(idx)} className="text-gray-400 hover:text-red-500 font-black text-sm px-2">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400">Опис лоту</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows="2" placeholder="Стан пристрою, комплектація..." className="w-full px-4 py-3 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl text-gray-900 dark:text-white resize-none" />
          </div>

          <h2 className="text-xs font-black uppercase text-blue-600 tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2 pt-2">3. Конфігурації заліза</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-black uppercase text-gray-500">Постійна пам'ять (Drive / SSD)</p>
              <div className="flex gap-2">
                <input type="text" value={newStorage} onChange={e => setNewStorage(e.target.value)} placeholder="512GB" className="w-2/3 px-3 py-2 text-xs font-bold bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl" />
                <input type="number" value={newStorageModifier} onChange={e => setNewStorageModifier(e.target.value)} placeholder="+0" className="w-1/3 px-3 py-2 text-xs font-bold bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl" />
              </div>
              <button type="button" onClick={addStorageVariant} className="w-full py-2 bg-blue-600 text-white font-black text-[10px] uppercase rounded-lg">+ Варіант Диска</button>
              <div className="space-y-1.5 pt-1">
                {variants.map((v, i) => (
                  <div key={i} className="flex justify-between text-xs bg-white dark:bg-gray-800 p-2 rounded-lg border dark:border-gray-700 font-bold">
                    <span>💾 {v.storage}</span> <span className="text-gray-400">+{v.priceModifier} грн <button type="button" onClick={() => removeStorageVariant(i)} className="text-red-500 ml-2">×</button></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-black uppercase text-gray-500">Оперативна пам'ять (RAM)</p>
              <div className="flex gap-2">
                <input type="text" value={newRam} onChange={e => setNewRam(e.target.value)} placeholder="16GB" className="w-2/3 px-3 py-2 text-xs font-bold bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl" />
                <input type="number" value={newRamModifier} onChange={e => setNewRamModifier(e.target.value)} placeholder="+0" className="w-1/3 px-3 py-2 text-xs font-bold bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl" />
              </div>
              <button type="button" onClick={addRamVariant} className="w-full py-2 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-lg">+ Варіант ОЗУ</button>
              <div className="space-y-1.5 pt-1">
                {ramVariants.map((r, i) => (
                  <div key={i} className="flex justify-between text-xs bg-white dark:bg-gray-800 p-2 rounded-lg border dark:border-gray-700 font-bold">
                    <span>⚡ RAM: {r.ram}</span> <span className="text-gray-400">+{r.priceModifier} грн <button type="button" onClick={() => removeRamVariant(i)} className="text-red-500 ml-2">×</button></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-xs font-black uppercase text-blue-600 tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2 pt-2">4. Технічний паспорт (Категорія: {category})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(specs).map(key => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">{key}</label>
                <input type="text" value={specs[key]} onChange={e => handleSpecChange(key, e.target.value)} className="w-full px-4 py-2.5 text-xs font-bold bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl text-gray-900 dark:text-white" />
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md">
            {loading ? 'Збереження...' : editingProductId ? '🔄 Оновити дані девайса на складі ➔' : 'Зберегти новий лот на склад ➔'}
          </button>
        </form>

        {/* СПИСОК ТОВАРІВ НА СКЛАДІ */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest border-b pb-2">📦 Наявність на складі ({products.length})</h2>
          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {products.map(p => {
              const productImages = p.images || [];
              const firstImageObj = productImages[0];
              const imageUrl = typeof firstImageObj === 'object' ? firstImageObj?.url : firstImageObj;

              return (
                <div key={p.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border dark:border-gray-800 flex items-center justify-between gap-3 group text-xs">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {imageUrl ? <img src={imageUrl} alt="product" className="w-12 h-12 rounded-lg object-cover shrink-0 border" /> : <span className="text-xl bg-white dark:bg-gray-700 w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border border-dashed text-gray-400">{p.image || '📦'}</span>}
                    <div className="overflow-hidden">
                      <p className="font-black text-gray-900 dark:text-white truncate leading-tight">{p.title}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">{p.price?.toLocaleString()} грн · {p.stock} шт</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button type="button" onClick={() => handleStartEdit(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">✏️</button>
                    <button type="button" onClick={() => handleDelete(p.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg font-bold">🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* НИЖНЯ СЕКЦІЯ: ОБРОБКА КЛІЄНТСЬКИХ ЗАМОВЛЕНЬ ТА ЛОГІСТИКА */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 items-start">
        
        {/* БЛОК А. ПОВНІ ЗАМОВЛЕННЯ З КОРЗИНИ (З РЕАКТИВНИМ КЛІКОМ СПРАВА) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
            <span>🛒</span> Кошик: Повні замовлення з доставкою ({standardOrders.length})
          </h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {standardOrders.length > 0 ? (
              standardOrders.map((ord, idx) => (
                <div 
                  key={ord.id} 
                  onClick={() => setSelectedOrder(ord)} // 🔥 КЛІК НА ЧЕК: відкриває реквізити справа
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 text-xs relative ${selectedOrder?.id === ord.id ? 'border-blue-600 ring-2 ring-blue-500/10 bg-blue-50/10' : 'bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      {/* Виводимо ім'я отримувача з об'єкта delivery */}
                      <p className="font-black text-sm text-gray-900 dark:text-white">Отримувач: {ord.delivery?.fullName || 'Клієнт Bitecore'}</p>
                      <p className="text-blue-600 dark:text-blue-400 font-black font-mono mt-0.5">Тел: {ord.delivery?.phone || ord.customerPhone}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Оформлено: {ord.createdAt ? new Date(ord.createdAt).toLocaleString('uk-UA') : 'Невідомо'}</p>
                    </div>
                    
                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                      <select 
                        value={ord.status || 'Нове замовлення'} 
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        className="px-2 py-1 text-[10px] font-black rounded-md uppercase bg-white dark:bg-gray-900 border text-gray-900 dark:text-white"
                      >
                        <option value="Нове замовлення">🆕 Нове замовлення</option>
                        <option value="В обробці">🔄 В обробці</option>
                        <option value="Відправлено">🚚 Відправлено</option>
                        <option value="Виконано">✅ Виконано</option>
                        <option value="Скасовано">✕ Скасовано</option>
                      </select>
                      <button onClick={() => handleDeleteItem('orders', ord.id)} className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-black text-[10px] uppercase rounded-md">🗑️</button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border dark:border-gray-800 space-y-1 text-gray-500 dark:text-gray-400">
                    <p className="text-[10px] text-gray-400 font-black uppercase">Логістика: <span className="text-blue-600 font-black">{ord.delivery?.method}</span> ({ord.delivery?.city})</p>
                    {ord.items?.map((item, idx) => (
                      <p key={idx} className="font-medium">• <span className="font-bold text-gray-800 dark:text-gray-200">{item.title}</span> ({item.color}, {item.storage}) x {item.quantity}шт</p>
                    ))}
                  </div>
                  <p className="font-black text-right text-gray-900 dark:text-white">Разом: <span className="text-blue-600 dark:text-blue-400">{ord.totalPrice?.toLocaleString()} грн</span></p>
                </div>
              ))
            ) : (
              <p className="text-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-900/40 border border-dashed rounded-2xl">Повних замовлень немає.</p>
            )}
          </div>
        </div>

        {/* ПРАВА СТОРОНА: ПОШТОВІ РЕКВІЗИТИ ЗАМОВЛЕННЯ */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase text-gray-400 tracking-wider">Логістична відомість відвантаження</h2>
          {selectedOrder ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl space-y-5 shadow-md">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-blue-600 tracking-wider">👤 Отримувач вантажу:</p>
                <p className="text-xs font-black uppercase">{selectedOrder.delivery?.fullName}</p>
                <p className="text-[11px] text-gray-400">Акаунт: {selectedOrder.userEmail}</p>
                <p className="text-[11px] text-gray-400">Телефон: {selectedOrder.delivery?.phone}</p>
              </div>

              <div className="space-y-1 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[9px] font-black uppercase text-amber-500 tracking-wider">🚚 Реквізити доставки:</p>
                <p className="text-xs font-bold">Служба: <span className="text-blue-600 uppercase">{selectedOrder.delivery?.method}</span></p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Пункт: м. {selectedOrder.delivery?.city}, {selectedOrder.delivery?.warehouse}</p>
                <p className="text-xs font-bold mt-1">💳 Розрахунок: <span className="text-emerald-500">{selectedOrder.payment}</span></p>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">📦 Складський вміст:</p>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>• {item.title} ({item.color}, {item.storage})</span>
                    <span className="font-black text-gray-900 dark:text-white">{item.quantity} шт</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t flex justify-between items-baseline font-black">
                <span className="text-xs uppercase">Підсумок чеку:</span>
                <span className="text-base text-blue-600 dark:text-blue-400">{selectedOrder.totalPrice?.toLocaleString()} грн</span>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 rounded-2xl bg-white dark:bg-gray-900">👈 Клікніть на повне замовлення зліва, щоб сформувати накладну.</div>
          )}
        </div>

      </div>

      {/* НИЖНІ БЛОКИ: ЕКСПРЕС-ЗАМОВЛЕННЯ ТА ТРЕЙД-ІН */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ЕКСПРЕС В 1 КЛІК */}
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-600 flex items-center gap-2"><span>⚡</span> Швидке замовлення в 1 Клік ({expressOrders.length})</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {expressOrders.length > 0 ? (
              expressOrders.map((ord) => (
                <div key={ord.id} className="p-4 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/60 space-y-3 text-xs">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-black text-sm flex items-center gap-1.5"><span>👤</span> {ord.customerName}</p>
                      <a href={`tel:${ord.customerPhone}`} className="text-amber-600 font-black font-mono text-sm block hover:underline">📞 {ord.customerPhone}</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <select value={ord.status || 'Нова заявка'} onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)} className="px-2 py-1 text-[10px] font-black rounded-md uppercase bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                        <option value="Нова заявка">Нова заявка</option>
                        <option value="В обробці">В обробці</option>
                        <option value="Завершено">Завершено</option>
                      </select>
                      <button onClick={() => handleDeleteItem('orders', ord.id)} className="px-3 py-1 bg-red-50 text-red-600 font-black text-[10px] uppercase rounded-md">🗑️</button>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border dark:border-gray-800">
                    {ord.items?.map((item, idx) => (
                      <p key={idx} className="font-bold">📦 Товар: <span className="text-blue-600">{item.title}</span> ({item.color}, {item.storage})</p>
                    ))}
                  </div>
                </div>
              ))
            ) : ( <p className="text-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-900/40 border border-dashed rounded-2xl">Експрес-заявок немає.</p> )}
          </div>
        </div>

        {/* ТРЕЙД-ІН ЗАЯВКИ */}
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2"><span>♻️</span> Оцінка девайсів Trade-In ({tradeInAppeals.length})</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {tradeInAppeals.length > 0 ? (
              tradeInAppeals.map((app) => (
                <div key={app.id} className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border dark:border-gray-800 space-y-3 text-xs">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-black text-sm truncate max-w-[185px]">{app.userEmail || 'Клієнт Трейд-ін'}</p>
                      <p className="text-emerald-600 font-black font-mono mt-0.5">{app.contact || 'Не вказано'}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <select value={app.status || 'Нова заявка'} onChange={(e) => handleUpdateStatus(app.id, e.target.value)} className="px-2 py-1 text-[10px] font-black rounded-md uppercase bg-white dark:bg-gray-900">
                        <option value="Нова заявка">Нова заявка</option>
                        <option value="В обробці">В обробці</option>
                        <option value="Завершено">Завершено</option>
                      </select>
                      <button onClick={() => handleDeleteItem('tradeInRequests', app.id)} className="px-3 py-1 bg-red-50 text-red-600 font-black text-[10px] uppercase rounded-md">🗑️</button>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border dark:border-gray-800 space-y-1">
                    <p className="font-medium text-gray-500"><span className="font-black text-gray-700 dark:text-gray-300">Пристрій:</span> {app.oldDevice}</p>
                    <p className="font-medium text-gray-500"><span className="font-black text-gray-700 dark:text-gray-300">Стан:</span> {app.deviceCondition}</p>
                    {app.comment && <p className="font-medium text-gray-500"><span className="font-black text-gray-700 dark:text-gray-300">Коментар:</span> <span className="italic">"{app.comment}"</span></p>}
                  </div>
                </div>
              ))
            ) : ( <p className="text-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-900/40 border border-dashed rounded-2xl">Заявок на Trade-In немає.</p> )}
          </div>
        </div>

      </div>

    </div>
  );
}