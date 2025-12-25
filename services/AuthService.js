import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

GoogleSignin.configure({
    webClientId: '658595013531-1kqbfqcspb9lc6eq7ac8lnqjba267lfe.apps.googleusercontent.com',
});

export const signInWithGoogle = async () => {
    try {
        // Check if your device supports Google Play
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // Get the users ID token
        const signInResult = await GoogleSignin.signIn();

        // Try to retrieve the idToken from the result
        // The structure of signInResult changed in v13+
        let idToken = signInResult.data?.idToken;
        if (!idToken && signInResult.idToken) {
            idToken = signInResult.idToken;
        }

        if (!idToken) {
            throw new Error('No ID token found');
        }

        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);

        // Sign-in the user with the credential
        return auth().signInWithCredential(googleCredential);
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        throw error;
    }
};

export const signOut = async () => {
    try {
        await GoogleSignin.signOut();
        await auth().signOut();
    } catch (error) {
        console.error('Sign Out Error:', error);
    }
};

export const onAuthStateChanged = (callback) => {
    return auth().onAuthStateChanged(callback);
};

export const getCurrentUser = () => {
    return auth().currentUser;
};
