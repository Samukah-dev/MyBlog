import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDN45v3I_KBhsIkPe7Ju9clBWXoT3yiLtw",
  authDomain: "myblog-f3e02.firebaseapp.com",
  projectId: "myblog-f3e02",
  messagingSenderId: "757758306184",
  appId: "1:757758306184:web:0cde8b5faca6ec317f3c3d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
