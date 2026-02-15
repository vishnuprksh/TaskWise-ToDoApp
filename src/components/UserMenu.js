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
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {
    X,
    User,
    LogOut,
    Info,
    HelpCircle,
    ChevronRight,
    Github,
    Globe,
    ShieldCheck,
    MessageSquare,
    Settings,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../services/FirebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as Application from 'expo-application';
import { Briefcase } from 'lucide-react-native';

const MemberItem = ({ name, role, icon: Icon, color, onPress }) => (
    <TouchableOpacity style={styles.memberCard} onPress={onPress} disabled={!onPress}>
        <View style={[styles.memberIconContainer, { backgroundColor: `${color}20` }]}>
            <Icon size={24} color={color} />
        </View>
        <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{name}</Text>
            <Text style={styles.memberRole}>{role}</Text>
        </View>
        {onPress && <ChevronRight size={20} color="#475569" />}
    </TouchableOpacity>
);

const UserMenu = ({ visible, onClose, user, onSignOut, onNavigateSettings }) => {
    const [activeSection, setActiveSection] = useState('main'); // 'main', 'about', 'help'
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isSendingFeedback, setIsSendingFeedback] = useState(false);

    useEffect(() => {
        if (visible) {
            setActiveSection('main');
        }
    }, [visible]);

    const handleHeaderClose = () => {
        if (activeSection !== 'main') {
            setActiveSection('main');
        } else {
            onClose();
        }
    };

    const handleFeedbackSubmit = async () => {
        if (!feedbackMessage.trim()) {
            Alert.alert('Error', 'Please enter a message');
            return;
        }
        setIsSendingFeedback(true);
        try {
            await addDoc(collection(db, 'feedback'), {
                message: feedbackMessage,
                userId: user ? user.uid : null,
                userEmail: user ? user.email : null,
                appVersion: Application.nativeApplicationVersion || '1.0.0',
                platform: Platform.OS,
                createdAt: serverTimestamp()
            });
            Alert.alert('Success', 'Feedback sent successfully!');
            setFeedbackMessage('');
            setShowFeedbackModal(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to send feedback');
        } finally {
            setIsSendingFeedback(false);
        }
    };

    const renderMain = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.profileSection}>
                {user ? (
                    <TouchableOpacity
                        style={styles.userInfo}
                        onPress={() => {
                            onClose();
                            onNavigateSettings();
                        }}
                    >
                        <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        <View style={styles.userTextInfo}>
                            <Text style={styles.userName}>{user.displayName || 'User'}</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={(e) => {
                                // Stop propagation isn't standard in RN, but nested touchables handle it if onPress is defined on both.
                                onSignOut();
                            }}
                            style={styles.signOutButton}
                        >
                            <LogOut size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </TouchableOpacity>
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

                <TouchableOpacity style={styles.menuItem} onPress={() => setShowFeedbackModal(true)}>
                    <View style={[styles.menuIconContainer, { backgroundColor: '#f59e0b20' }]}>
                        <MessageSquare size={20} color="#f59e0b" />
                    </View>
                    <Text style={styles.menuItemText}>Report a Bug / Suggest a Feature</Text>
                    <ChevronRight size={20} color="#475569" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderAbout = () => (
        <ScrollView style={styles.sectionContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>About TaskWise</Text>
                <Text style={styles.appVersion}>Version {Application.nativeApplicationVersion || '3.0.0'}</Text>
            </View>

            <View style={styles.aboutContent}>
                <Text style={styles.aboutText}>
                    TaskWise is a modern task management application designed to help you stay organized and productive. Built with a focus on ease of use and powerful prioritization.
                </Text>

                <View style={styles.membersSection}>
                    <Text style={styles.sectionTitle}>Team</Text>

                    <MemberItem
                        name="BrightTomorrow"
                        role="Organization"
                        icon={Briefcase}
                        color="#6366f1"
                        onPress={() => Linking.openURL('https://github.com/BrightTomorrowLabs')}
                    />

                    <MemberItem
                        name="Vishnu Prakash"
                        role="Lead Developer"
                        icon={User}
                        color="#10b981"
                        onPress={() => Linking.openURL('https://github.com/vishnuprksh')}
                    />
                </View>

                <View style={styles.linksSection}>
                    <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL('https://github.com/BrightTomorrowLabs/TaskWise')}>
                        <Github size={20} color="#94a3b8" />
                        <Text style={styles.linkButtonText}>View Source Code</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
                            <TouchableOpacity onPress={handleHeaderClose} style={styles.closeButton}>
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

                <Modal
                    visible={showFeedbackModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowFeedbackModal(false)}
                >
                    <View style={styles.feedbackModalOverlay}>
                        <View style={styles.feedbackModalContent}>
                            <View style={styles.feedbackModalHeader}>
                                <Text style={styles.feedbackModalTitle}>Send Feedback</Text>
                                <TouchableOpacity onPress={() => setShowFeedbackModal(false)} style={styles.feedbackModalCloseButton}>
                                    <X size={24} color="#f8fafc" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.feedbackInput}
                                placeholder="Describe your issue or suggestion..."
                                placeholderTextColor="#64748b"
                                multiline
                                numberOfLines={5}
                                value={feedbackMessage}
                                onChangeText={setFeedbackMessage}
                                textAlignVertical="top"
                            />
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleFeedbackSubmit}
                                disabled={isSendingFeedback}
                            >
                                {isSendingFeedback ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Send Feedback</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
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
    membersSection: {
        marginTop: 10,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    memberIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberInfo: {
        flex: 1,
        marginLeft: 16,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f8fafc',
    },
    memberRole: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    linksSection: {
        marginTop: 10,
        alignItems: 'center',
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
    },
    linkButtonText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
    helpAnswer: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
    },
    feedbackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f59e0b10',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f59e0b30',
        marginTop: 20,
        gap: 12,
    },
    feedbackButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#f59e0b',
    },
    feedbackModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(2, 6, 23, 0.9)',
        justifyContent: 'center',
        padding: 20,
    },
    feedbackModalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    feedbackModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    feedbackModalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#f8fafc',
    },
    feedbackModalCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedbackInput: {
        backgroundColor: '#0f172a',
        borderRadius: 16,
        padding: 16,
        color: '#f8fafc',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#334155',
        height: 150,
        marginBottom: 24,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#6366f1',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default UserMenu;
