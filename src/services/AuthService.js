import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';
import { auth } from './FirebaseConfig';

export const signInWithEmail = async (email, password) => {
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Email Sign-In Error:', error);
        throw error;
    }
};

export const signUpWithEmail = async (email, password) => {
    try {
        return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Email Sign-Up Error:', error);
        throw error;
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Sign Out Error:', error);
    }
};

export const onAuthStateChanged = (callback) => {
    return firebaseOnAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => {
    return auth.currentUser;
};

// Placeholder for Google Sign-in if the user wants to implement it via Web flow
export const signInWithGoogle = async () => {
    console.warn("Google Sign-In via Native is disabled for Expo Go. Use Email/Password for now.");
    throw new Error("Google Sign-In not supported in Expo Go with JS SDK without additional setup.");
};
