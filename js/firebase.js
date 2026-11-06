/* Shared Firebase init (Spark/free plan). These keys are public identifiers — security comes from database.rules.json. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

export const OWNER_EMAIL = 'subhampersonal123@gmail.com';

export const app = initializeApp({
  apiKey: 'AIzaSyDcs05nhrx4fXE8_yXj3ZTsQWq8hVAnN6s',
  authDomain: 'portfolio-5593d.firebaseapp.com',
  databaseURL: 'https://portfolio-5593d-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'portfolio-5593d',
  storageBucket: 'portfolio-5593d.firebasestorage.app',
  messagingSenderId: '874412327930',
  appId: '1:874412327930:web:a652da79767d7a43cd9a43',
});
export const db = getDatabase(app);
