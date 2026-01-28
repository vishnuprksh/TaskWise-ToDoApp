import React, { useState, useRef, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    LayoutList,
    Briefcase,
    Settings,
    Plus,
    ChevronDown,
    ChevronRight,
} from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useApp } from '../context/AppContext';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';

export default function HomeScreen({ navigation }) {
    const { tasks, projects, updateTasks, calculatePriorityScore } = useApp();
    const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
    const [projectSearchText, setProjectSearchText] = useState('');
    const [selectedFilterProject, setSelectedFilterProject] = useState(null); // null means 'All'
    const [isFinishedExpanded, setIsFinishedExpanded] = useState(false);

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

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleSaveTask = () => {
        if (taskText.trim().length === 0) return;

        const priorityScore = calculatePriorityScore(attributes);
        const newTask = {
            id: editingTask ? editingTask.id : Date.now().toString(),
            text: taskText,
            completed: editingTask ? editingTask.completed : false,
            projectId: selectedProject,
            attributes,
            priorityScore,
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
        } else {
            setEditingTask(null);
            setTaskText('');
            setSelectedProject(projects.length > 0 ? projects[0].id : null);
            setProjectSearchText('');
            setAttributes({
                easiness: 'medium',
                importance: 'medium',
                emergency: 'medium',
                interest: 'medium',
            });
        }
        setIsTaskModalVisible(true);
    };

    const closeTaskModal = () => {
        setIsTaskModalVisible(false);
        Keyboard.dismiss();
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
                        <TouchableOpacity onPress={() => navigation.navigate('Projects')} style={styles.headerButton}>
                            <Briefcase size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerButton}>
                            <Settings size={20} color="#fff" />
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
                    style={styles.fab}
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
                            onSave={handleSaveTask}
                            onClose={closeTaskModal}
                            onNavigateProjects={() => {
                                closeTaskModal();
                                navigation.navigate('Projects', { openCreate: true });
                            }}
                        />
                    </KeyboardAvoidingView>
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
        bottom: 30,
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
    }
});
