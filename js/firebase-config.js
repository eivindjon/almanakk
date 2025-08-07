// Din unike Firebase-konfigurasjon
const firebaseConfig = {
  apiKey: "AIzaSyCcSrpaKrE-ZJ5DmsLS5J2wvlxEvVgqNrg",
  authDomain: "almanakk-b723e.firebaseapp.com",
  projectId: "almanakk-b723e",
  storageBucket: "almanakk-b723e.firebasestorage.app",
  messagingSenderId: "847713150113",
  appId: "1:847713150113:web:abf33b7405f007c7343ce0",
  measurementId: "G-NS9VD2F4P5"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Gjør databasen og autentisering lett tilgjengelig for app.js
const auth = firebase.auth();
const db = firebase.firestore();