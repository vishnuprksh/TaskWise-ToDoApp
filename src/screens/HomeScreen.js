import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Animated,
    StatusBar,
    Modal,
    KeyboardAvoidingView,
    Keyboard,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    LayoutList,
    Briefcase,
    Settings,
    Plus,
    ChevronDown,
    ChevronRight,
    CalendarRange,
    Hand,
    X,
    User,
} from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useApp } from '../context/AppContext';
import { isValidDate } from '../utils/time';
import TaskItem from '../components/TaskItem';

import TaskForm from '../components/TaskForm';
import ScheduleModal from '../components/ScheduleModal';
import UserMenu from '../components/UserMenu';

export default function HomeScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { tasks, projects, updateTasks, calculatePriorityScore, updateTaskSchedule, user, signOut } = useApp();
    const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
    const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
    const [isUserMenuVisible, setIsUserMenuVisible] = useState(false);
    const [taskToSchedule, setTaskToSchedule] = useState(null);
    const [projectSearchText, setProjectSearchText] = useState('');
    const [selectedFilterProject, setSelectedFilterProject] = useState(null); // null means 'All'
    const [isFinishedExpanded, setIsFinishedExpanded] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const TUTORIAL_KEY = '@taskwise_tutorial_seen';

    // Task Form State
    const [editingTask, setEditingTask] = useState(null);
    const [taskText, setTaskText] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [attributes, setAttributes] = useState({
        easiness: 'medium',
        importance: 'medium',
        emergency: 'medium',
        interest: 'medium',
    });
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        checkTutorial();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    const checkTutorial = async () => {
        try {
            const hasSeen = await AsyncStorage.getItem(TUTORIAL_KEY);
            if (!hasSeen) {
                setShowTutorial(true);
            }
        } catch (error) {
            console.log('Error checking tutorial:', error);
        }
    };

    const dismissTutorial = async () => {
        try {
            await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
            setShowTutorial(false);
        } catch (error) {
            console.log('Error saving tutorial status:', error);
        }
    };

    const handleSaveTask = () => {
        if (taskText.trim().length === 0) return;

        const priorityScore = calculatePriorityScore(attributes);
        const newTask = {
            ...(editingTask || {}),
            id: editingTask ? editingTask.id : Date.now().toString(),
            text: taskText,
            completed: editingTask ? editingTask.completed : false,
            projectId: selectedProject,
            attributes,
            priorityScore,
            startDate: startDate ? startDate.toISOString() : null,
            endDate: endDate ? endDate.toISOString() : null,
        };

        let newTasks;
        if (editingTask) {
            newTasks = tasks.map((t) => (t.id === editingTask.id ? newTask : t));
        } else {
            newTasks = [...tasks, newTask];
        }

        // Sort by priority score (descending)
        newTasks.sort((a, b) => b.priorityScore - a.priorityScore);

        updateTasks(newTasks);
        closeTaskModal();
    };

    const deleteTask = (id) => {
        const newTasks = tasks.filter((item) => item.id !== id);
        updateTasks(newTasks);
    };

    const toggleTask = (id) => {
        const newTasks = tasks.map((item) =>
            item.id === id ? { ...item, completed: !item.completed } : item
        );
        updateTasks(newTasks);
    };

    const openTaskModal = (task = null) => {
        if (task) {
            setEditingTask(task);
            setTaskText(task.text);
            setSelectedProject(task.projectId);
            setAttributes(task.attributes);
            setStartDate(isValidDate(task.startDate) ? new Date(task.startDate) : null);
            setEndDate(isValidDate(task.endDate) ? new Date(task.endDate) : null);
        } else {

            setEditingTask(null);
            setTaskText('');
            // Use the selected filter project as default, otherwise fall back to the first project
            const defaultProjectId = selectedFilterProject || (projects.length > 0 ? projects[0].id : null);
            setSelectedProject(defaultProjectId);
            setProjectSearchText('');
            setAttributes({
                easiness: 'medium',
                importance: 'medium',
                emergency: 'medium',
                interest: 'medium',
            });
            setStartDate(null);
            setEndDate(null);
        }
        setIsTaskModalVisible(true);
    };

    const closeTaskModal = () => {
        setIsTaskModalVisible(false);
        Keyboard.dismiss();
    };

    const handleOpenSchedule = (task) => {
        setTaskToSchedule(task);
        setIsScheduleModalVisible(true);
    };

    const handleScheduleTask = (taskId, date) => {
        updateTaskSchedule(taskId, date);
        setIsScheduleModalVisible(false);
        setTaskToSchedule(null);
    };

    const getProject = (id) => projects.find((p) => p.id === id);

    const filteredTasks = tasks.filter(t => {
        const project = getProject(t.projectId);
        if (selectedFilterProject && t.projectId !== selectedFilterProject) return false;
        return !project || !project.archived;
    });

    const activeTasks = filteredTasks.filter(t => !t.completed);
    const finishedTasks = filteredTasks.filter(t => t.completed);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" />

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <View style={styles.titleContainer}>
                            <LayoutList size={32} color="#6366f1" />
                            <Text style={styles.title}>
                                {selectedFilterProject ? getProject(selectedFilterProject)?.name : 'TaskWise'}
                            </Text>
                        </View>
                        <Text style={styles.subtitle}>Stay organized, stay ahead.</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => navigation.navigate('Calendar')} style={styles.headerButton}>
                            <CalendarRange size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Projects')} style={styles.headerButton}>
                            <Briefcase size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsUserMenuVisible(true)} style={styles.headerButton}>
                            <User size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Project Filter Bar */}
                <View style={styles.filterBar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                !selectedFilterProject ? styles.filterChipSelected : { opacity: 0.6 }
                            ]}
                            onPress={() => setSelectedFilterProject(null)}
                        >
                            <Text style={[styles.filterChipText, !selectedFilterProject && styles.filterChipTextSelected]}>All</Text>
                        </TouchableOpacity>
                        {projects.filter(p => !p.archived).map(p => {
                            const isSelected = selectedFilterProject === p.id;
                            return (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[
                                        styles.filterChip,
                                        isSelected
                                            ? [styles.filterChipSelected, { borderColor: p.color }]
                                            : { borderColor: '#334155', opacity: 0.6 }
                                    ]}
                                    onPress={() => setSelectedFilterProject(p.id)}
                                >
                                    <View style={[styles.projectDot, { backgroundColor: isSelected ? p.color : '#64748b' }]} />
                                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>{p.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Task List */}
                <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                    {activeTasks.length > 0 ? (
                        activeTasks.map(item => (
                            <View key={item.id}>
                                <TaskItem
                                    item={item}
                                    project={getProject(item.projectId)}
                                    onOpenModal={openTaskModal}
                                    onToggle={toggleTask}
                                    onNavigateTimer={(task) => navigation.navigate('Timer', { task })}
                                    onDelete={deleteTask}
                                    onSchedule={handleOpenSchedule}
                                    fadeAnim={fadeAnim}
                                />
                            </View>
                        ))
                    ) : finishedTasks.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No tasks found.</Text>
                        </View>
                    ) : null}

                    {finishedTasks.length > 0 && (
                        <View style={styles.finishedSection}>
                            <TouchableOpacity
                                style={styles.finishedHeader}
                                onPress={() => setIsFinishedExpanded(!isFinishedExpanded)}
                            >
                                <View style={styles.finishedHeaderLeft}>
                                    {isFinishedExpanded ? <ChevronDown size={20} color="#94a3b8" /> : <ChevronRight size={20} color="#94a3b8" />}
                                    <Text style={styles.finishedTitle}>Finished ({finishedTasks.length})</Text>
                                </View>
                            </TouchableOpacity>
                            {isFinishedExpanded && (
                                <View style={styles.finishedList}>
                                    {finishedTasks.map(item => (
                                        <View key={item.id}>
                                            <TaskItem
                                                item={item}
                                                project={getProject(item.projectId)}
                                                onOpenModal={openTaskModal}
                                                onToggle={toggleTask}
                                                onNavigateTimer={(task) => navigation.navigate('Timer', { task })}
                                                onDelete={deleteTask}
                                                fadeAnim={fadeAnim}
                                            />
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Add Task FAB */}
                <TouchableOpacity
                    style={[styles.fab, { bottom: Math.max(20, insets.bottom + 20) }]}
                    onPress={() => openTaskModal()}
                >
                    <Plus size={32} color="#fff" />
                </TouchableOpacity>

                {/* Task Modal */}
                <Modal
                    visible={isTaskModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={closeTaskModal}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <TaskForm
                            isEditing={!!editingTask}
                            taskText={taskText}
                            setTaskText={setTaskText}
                            projects={projects}
                            selectedProject={selectedProject}
                            setSelectedProject={setSelectedProject}
                            projectSearchText={projectSearchText}
                            setProjectSearchText={setProjectSearchText}
                            attributes={attributes}
                            setAttributes={setAttributes}
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            onSave={handleSaveTask}
                            onClose={closeTaskModal}
                            onNavigateProjects={() => {
                                closeTaskModal();
                                navigation.navigate('Projects', { openCreate: true });
                            }}
                        />
                    </KeyboardAvoidingView>
                </Modal>
                <ScheduleModal
                    visible={isScheduleModalVisible}
                    onClose={() => setIsScheduleModalVisible(false)}
                    onSchedule={handleScheduleTask}
                    task={taskToSchedule}
                />
                <UserMenu
                    visible={isUserMenuVisible}
                    onClose={() => setIsUserMenuVisible(false)}
                    user={user}
                    onSignOut={signOut}
                    onNavigateSettings={() => navigation.navigate('Settings')}
                />

                {/* Tutorial Modal */}
                <Modal
                    visible={showTutorial}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={dismissTutorial}
                    statusBarTranslucent
                >
                    <View style={styles.tutorialOverlay}>
                        <View style={styles.tutorialContent}>
                            <View style={styles.tutorialIconBg}>
                                <Hand size={40} color="#6366f1" />
                            </View>
                            <Text style={styles.tutorialTitle}>Quick Tip!</Text>
                            <Text style={styles.tutorialText}>
                                Swipe right on a task to add it to your calendar.
                            </Text>
                            <TouchableOpacity style={styles.tutorialButton} onPress={dismissTutorial}>
                                <Text style={styles.tutorialButtonText}>Got it!</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    finishedSection: {
        marginTop: 20,
    },
    finishedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    finishedHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    finishedTitle: {
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: '600',
    },
    finishedList: {
        marginTop: 10,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#f8fafc',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 4,
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    headerButton: {
        backgroundColor: '#6366f1',
        padding: 10,
        borderRadius: 12,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    filterBar: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    filterScroll: {
        gap: 10,
        paddingRight: 20,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    filterChipSelected: {
        backgroundColor: '#334155',
        borderColor: '#6366f1',
        borderWidth: 2,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
        transform: [{ scale: 1.05 }],
    },
    filterChipText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
    filterChipTextSelected: {
        color: '#f8fafc',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    projectDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    fab: {
        position: 'absolute',
        right: 30,
        width: 60,
        height: 60,
        backgroundColor: '#6366f1',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#64748b',
        fontSize: 16,
    },
    tutorialOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    tutorialContent: {
        backgroundColor: '#1e293b',
        width: '85%',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    tutorialIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#6366f120',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#6366f140',
    },
    tutorialTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#f8fafc',
        marginBottom: 10,
        textAlign: 'center',
    },
    tutorialText: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 24,
    },
    tutorialButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    tutorialButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
