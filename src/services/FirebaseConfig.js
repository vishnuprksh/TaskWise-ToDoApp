import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration extracted from google-services.json
// NOTE: Some values like messagingSenderId and appId may need adjustment for Web
const firebaseConfig = {
    apiKey: "AIzaSyCBCRBEfInZ0lbn-H7zwqZ0pm7PFTJ-61I",
    authDomain: "taskwise-un29k.firebaseapp.com",
    projectId: "taskwise-un29k",
    storageBucket: "taskwise-un29k.firebasestorage.app",
    messagingSenderId: "658595013531",
    appId: "1:658595013531:web:c66fa197f174666201f73e" // Guessed Web App ID format based on Android
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { app, auth, db };
