import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Image,
    ScrollView,
    Linking,
    Platform,
} from 'react-native';
import {
    X,
    User,
    LogOut,
    Info,
    HelpCircle,
    ChevronRight,
    Github,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const UserMenu = ({ visible, onClose, user, onSignOut, onNavigateSettings }) => {
    const [activeSection, setActiveSection] = useState('main'); // 'main', 'about', 'help'

    useEffect(() => {
        if (visible) {
            setActiveSection('main');
        }
    }, [visible]);

    const renderMain = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.profileSection}>
                {user ? (
                    <View style={styles.userInfo}>
                        <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        <View style={styles.userTextInfo}>
                            <Text style={styles.userName}>{user.displayName || 'User'}</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                        <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
                            <LogOut size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.signInPrompt}
                        onPress={() => {
                            onClose();
                            onNavigateSettings();
                        }}
                    >
                        <View style={styles.signInIcon}>
                            <User size={24} color="#6366f1" />
                        </View>
                        <View style={styles.signInTextContainer}>
                            <Text style={styles.signInTitle}>Sign In</Text>
                            <Text style={styles.signInSubtitle}>Sync your tasks across devices</Text>
                        </View>
                        <ChevronRight size={20} color="#94a3b8" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.menuItems}>
                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveSection('help')}>
                    <View style={[styles.menuIconContainer, { backgroundColor: '#3b82f620' }]}>
                        <HelpCircle size={20} color="#3b82f6" />
                    </View>
                    <Text style={styles.menuItemText}>Help & Support</Text>
                    <ChevronRight size={20} color="#475569" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveSection('about')}>
                    <View style={[styles.menuIconContainer, { backgroundColor: '#6366f120' }]}>
                        <Info size={20} color="#6366f1" />
                    </View>
                    <Text style={styles.menuItemText}>About TaskWise</Text>
                    <ChevronRight size={20} color="#475569" />
                </TouchableOpacity>

            </View>
        </View>
    );

    const renderAbout = () => (
        <ScrollView style={styles.sectionContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>About TaskWise</Text>
                <Text style={styles.appVersion}>Version 3.0.0</Text>
            </View>

            <View style={styles.aboutContent}>
                <Text style={styles.aboutText}>
                    TaskWise is a modern task management application designed to help you stay organized and productive. Built with a focus on ease of use and powerful prioritization, it ensures you're always working on what matters most.
                </Text>

                <View style={styles.developerCard}>
                    <Text style={styles.developerTitle}>Developed by</Text>
                    <Text style={styles.developerName}>BrightTomorrow</Text>
                    <View style={styles.socialLinks}>
                        <TouchableOpacity style={styles.socialIcon} onPress={() => Linking.openURL('https://github.com/BrightTomorrowLabs')}>
                            <Github size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => setActiveSection('main')}>
                <Text style={styles.backButtonText}>Back to Menu</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderHelp = () => (
        <ScrollView style={styles.sectionContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>Help & Support</Text>
            </View>

            <View style={styles.helpItems}>
                <View style={styles.helpItem}>
                    <Text style={styles.helpQuestion}>How to add a task?</Text>
                    <Text style={styles.helpAnswer}>
                        Tap the floating "+" button at the bottom right of the Home screen to quickly add a new task.
                    </Text>
                </View>

                <View style={styles.helpItem}>
                    <Text style={styles.helpQuestion}>How to set priority?</Text>
                    <Text style={styles.helpAnswer}>
                        When creating or editing a task, adjust the sliders for Easiness, Importance, Emergency, and Interest. TaskWise will automatically calculate a priority score for you.
                    </Text>
                </View>

                <View style={styles.helpItem}>
                    <Text style={styles.helpQuestion}>How to use projects?</Text>
                    <Text style={styles.helpAnswer}>
                        Group your tasks by projects to stay organized. Tap the briefcase icon in the header to manage your projects or filter tasks by selecting a project chip on the Home screen.
                    </Text>
                </View>

                <View style={styles.helpItem}>
                    <Text style={styles.helpQuestion}>How to add tasks to calendar?</Text>
                    <Text style={styles.helpAnswer}>
                        Simply swipe right on any task in your list to reveal the calendar option and schedule it for a specific date.
                    </Text>
                </View>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => setActiveSection('main')}>
                <Text style={styles.backButtonText}>Back to Menu</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.menuContainer}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>
                                {activeSection === 'main' ? 'Menu' : activeSection === 'about' ? 'About' : 'Help'}
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={24} color="#f8fafc" />
                            </TouchableOpacity>
                        </View>

                        {activeSection === 'main' && renderMain()}
                        {activeSection === 'about' && renderAbout()}
                        {activeSection === 'help' && renderHelp()}

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Stay organized, stay ahead.</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        justifyContent: 'center',
        padding: 20,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'center',
    },
    menuContainer: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#f8fafc',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionContainer: {
        padding: 24,
    },
    profileSection: {
        marginBottom: 32,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#334155',
        borderWidth: 2,
        borderColor: '#6366f1',
    },
    userTextInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f8fafc',
    },
    userEmail: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    signOutButton: {
        padding: 10,
        backgroundColor: '#ef444415',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ef444430',
    },
    signInPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366f110',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#6366f130',
    },
    signInIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6366f120',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signInTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    signInTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6366f1',
    },
    signInSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    menuItems: {
        gap: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#33415540',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#e2e8f0',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    footerText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    detailHeader: {
        marginBottom: 24,
    },
    detailTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#f8fafc',
    },
    appVersion: {
        fontSize: 14,
        color: '#6366f1',
        marginTop: 4,
        fontWeight: '600',
    },
    aboutContent: {
        gap: 20,
    },
    aboutText: {
        fontSize: 15,
        color: '#94a3b8',
        lineHeight: 24,
    },
    developerCard: {
        backgroundColor: '#0f172a',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
        marginTop: 8,
    },
    developerTitle: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    developerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f8fafc',
        marginTop: 4,
    },
    socialLinks: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    socialIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        marginTop: 32,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#33415580',
        alignItems: 'center',
    },
    backButtonText: {
        color: '#f8fafc',
        fontWeight: '700',
        fontSize: 16,
    },
    helpItems: {
        gap: 20,
    },
    helpItem: {
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    helpQuestion: {
        fontSize: 16,
        fontWeight: '700',
        color: '#e2e8f0',
        marginBottom: 8,
    },
    helpAnswer: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
    },
});

export default UserMenu;
