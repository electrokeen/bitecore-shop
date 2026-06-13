import React from 'react';

export default function ProductImage({ product, className = "w-full h-full object-contain" }) {
  // 1. Пробуємо взяти перше фото з масиву images (новий формат з Firebase Storage)
  const productImages = product?.images || [];
  const firstImageObj = productImages[0];
  const newUrl = typeof firstImageObj === 'object' ? firstImageObj?.url : firstImageObj;

  // 2. Якщо масиву немає, перевіряємо старе поле image / url
  const oldUrl = typeof product?.image === 'string' && product.image.startsWith('http') ? product.image : null;
  const fallbackUrl = typeof product?.imageUrl === 'string' && product.imageUrl.startsWith('http') ? product.imageUrl : null;

  const finalSrc = newUrl || oldUrl || fallbackUrl;

  // Якщо це емодзі або фото взагалі відсутнє — рендеримо акуратну заглушку
  if (!finalSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 select-none text-2xl rounded-2xl font-sans">
        {typeof product?.image === 'string' && !product.image.startsWith('http') ? product.image : '📦'}
      </div>
    );
  }

  return (
    <img 
      src={finalSrc} 
      alt={product?.title || 'Bitecore Product'} 
      className={className}
      loading="lazy"
      onError={(e) => {
        // Якщо посилання біте — підміняємо на красиву заглушку, щоб не було знаку питання
        e.target.style.display = 'none';
        e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 text-2xl rounded-2xl font-sans">📦</div>`;
      }}
    />
  );
}