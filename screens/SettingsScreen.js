import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { LogOut, RefreshCw, User } from 'lucide-react-native';

export default function SettingsScreen() {
    const { user, signIn, signOut, syncNow, isSyncing } = useApp();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 20,
    },
    header: {
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    section: {
        marginBottom: 30,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 15,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e2e8f0',
    },
    userInfo: {
        flex: 1,
        marginLeft: 15,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    userEmail: {
        fontSize: 14,
        color: '#64748b',
    },
    signOutButton: {
        padding: 10,
        backgroundColor: '#fee2e2',
        borderRadius: 10,
    },
    signInContainer: {
        alignItems: 'center',
        padding: 10,
    },
    signInText: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 15,
        textAlign: 'center',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1e293b',
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366f1',
        padding: 15,
        borderRadius: 12,
    },
    syncButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    syncNote: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 10,
        textAlign: 'center',
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
    },
    version: {
        color: '#cbd5e1',
        fontSize: 12,
    },
});
