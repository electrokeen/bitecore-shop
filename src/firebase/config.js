// 1. Імпортуємо базовий двигун Firebase
import { initializeApp } from "firebase/app";

// 2. Додаємо імпорти конкретних сервісів, які потрібні для диплома Bitecore
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Конфігурація підтягується через змінні оточення Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Ініціалізуємо Firebase
const app = initializeApp(firebaseConfig);

// 3. Створюємо готові пульти керування для кожного відділу нашого бекенду
export const auth = getAuth(app);       // Охорона (Вхід / Реєстрація)
export const db = getFirestore(app);     // Хмарний склад даних (Firestore Database)
export const storage = getStorage(app); // Полиця з медіафайлами (Storage для картинок)
