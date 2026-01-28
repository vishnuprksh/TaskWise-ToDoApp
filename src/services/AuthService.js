import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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

// Google Sign-In Implementation
export const signInWithGoogle = async () => {
    try {
        // 1. Check if Play Services are available
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // 2. Sign in with Google
        const userInfo = await GoogleSignin.signIn();

        // 3. Get the ID token
        const { idToken } = await GoogleSignin.getTokens();

        if (!idToken) {
            throw new Error('No ID token found');
        }

        // 4. Create a Firebase credential with the token
        const googleCredential = GoogleAuthProvider.credential(idToken);

        // 5. Sign-in the user with the credential
        return await signInWithCredential(auth, googleCredential);
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        throw error;
    }
};

// Configure Google Sign-In
GoogleSignin.configure({
    webClientId: '658595013531-1kqbfqcspb9lc6eq7ac8lnqjba267lfe.apps.googleusercontent.com',
});
