import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import {getAuth, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';

const firebaseApp = initializeApp({
    apiKey: "AIzaSyDGDYcNR36coda2CsEe1sENnZVJ6HhM7xQ",
    authDomain: "tree-detection-app.firebaseapp.com",
    projectId: "tree-detection-app",
    storageBucket: "tree-detection-app.appspot.com",
    messagingSenderId: "837959614002",
    appId: "1:837959614002:web:c4b3c6152767981220c62b"
})

const auth = getAuth(firebaseApp);

onAuthStateChanged(auth, user => {
    if (user!=null){
        console.log('logged in');
    }else{
        console.log('No user');
    }
})