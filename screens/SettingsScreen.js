import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { LogOut, RefreshCw, User, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen({ navigation }) {
    const { user, signIn, signOut, syncNow, isSyncing } = useApp();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#f8fafc" />
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                {user ? (
                    <View style={styles.profileCard}>
                        <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{user.displayName}</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
                            <LogOut size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.signInContainer}>
                        <Text style={styles.signInText}>Sign in to sync your tasks across devices.</Text>
                        <TouchableOpacity onPress={signIn} style={styles.googleButton}>
                            <Image
                                source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                                style={styles.googleIcon}
                            />
                            <Text style={styles.googleButtonText}>Sign in with Google</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {user && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sync</Text>
                    <TouchableOpacity onPress={syncNow} style={styles.syncButton} disabled={isSyncing}>
                        {isSyncing ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <RefreshCw size={20} color="#ffffff" />
                        )}
                        <Text style={styles.syncButtonText}>
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.syncNote}>
                        Your data is automatically synced when you make changes.
                    </Text>
                </View>
            )}

            <View style={styles.footer}>
                <Text style={styles.version}>TaskWise v3.0.0</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    section: {
        marginBottom: 30,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: 15,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#334155',
        borderWidth: 2,
        borderColor: '#6366f1',
    },
    userInfo: {
        flex: 1,
        marginLeft: 15,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f8fafc',
    },
    userEmail: {
        fontSize: 14,
        color: '#94a3b8',
    },
    signOutButton: {
        padding: 10,
        backgroundColor: '#ef444420',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ef444440',
    },
    signInContainer: {
        alignItems: 'center',
        padding: 10,
    },
    signInText: {
        fontSize: 14,
        color: '#94a3b8',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366f1',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    syncButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 10,
    },
    syncNote: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 12,
        textAlign: 'center',
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingBottom: 20,
    },
    version: {
        color: '#334155',
        fontSize: 12,
        fontWeight: '500',
    },
});
