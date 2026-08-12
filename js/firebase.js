
  
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js"; 

  
  const firebaseConfig = {
    apiKey: "AIzaSyC8P9xB029BSRwBVjvGT0KrEovAro8LBjc",
    authDomain: "urbanthreadsstore-246b9.firebaseapp.com",
    projectId: "urbanthreadsstore-246b9",
    storageBucket: "urbanthreadsstore-246b9.firebasestorage.app",
    messagingSenderId: "136397333873",
    appId: "1:136397333873:web:31bebfca2223e21cde02d0",
    measurementId: "G-R7K64FW8GS"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  



export { auth, db };
