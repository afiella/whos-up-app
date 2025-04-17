// public/scripts/firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyDkEKUzUhc-nKFLnF1w0MOm6qwpKHTpfaI",
    authDomain: "who-s-up-app.firebaseapp.com",
    databaseURL: "https://who-s-up-app-default-rtdb.firebaseio.com",
    projectId: "who-s-up-app",
    storageBucket: "who-s-up-app.appspot.com",
    messagingSenderId: "167292375113",
    appId: "1:167292375113:web:ce718a1aab4852fe5daf98"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  export { db };
  