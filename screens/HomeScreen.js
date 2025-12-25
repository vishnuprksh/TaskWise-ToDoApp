import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    StatusBar,
    Modal,
    ScrollView,
    Animated,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    LayoutList,
    X,
    Edit2,
    Flag,
    Briefcase,
    Search,
    PlayCircle,
    Filter,
    Settings,
    ChevronDown,
    ChevronRight,
    Eye,
    EyeOff,
    Clock,
} from 'lucide-react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useApp } from '../context/AppContext';

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

    const getAttributeColor = (level) => {
        switch (level) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#94a3b8';
        }
    };

    const AttributeSelector = ({ label, value, onChange }) => (
        <View style={styles.attributeRow}>
            <Text style={styles.attributeLabel}>{label}</Text>
            <View style={styles.attributeOptions}>
                {['low', 'medium', 'high'].map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.attributeOption,
                            value === option && styles.attributeOptionSelected,
                            value === option && { backgroundColor: getAttributeColor(option) },
                        ]}
                        onPress={() => onChange(option)}
                    >
                        <Text
                            style={[
                                styles.attributeOptionText,
                                value === option && styles.attributeOptionTextSelected,
                            ]}
                        >
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    const renderRightActions = (progress, dragX) => {
        return (
            <View style={styles.deleteActionPlaceholder} />
        );
    };

    const TaskItem = ({ item, onOpenModal, onToggle, onNavigateTimer }) => {
        const swipeableRef = useRef(null);
        const project = getProject(item.projectId);

        return (
            <Swipeable
                ref={swipeableRef}
                renderRightActions={renderRightActions}
                onSwipeableOpen={(direction) => {
                    if (direction === 'right') {
                        swipeableRef.current?.close();
                        Alert.alert(
                            "Delete Task",
                            "Are you sure you want to delete this task?",
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Delete", style: "destructive", onPress: () => deleteTask(item.id) }
                            ]
                        );
                    }
                }}
            >
                <Animated.View style={[styles.taskContainer, { opacity: fadeAnim }]}>
                    <View style={styles.taskMain}>
                        <TouchableOpacity
                            style={styles.taskTextContainer}
                            onPress={() => onOpenModal(item)}
                        >
                            <TouchableOpacity
                                onPress={() => onToggle(item.id)}
                                style={styles.checkbox}
                            >
                                {item.completed ? (
                                    <CheckCircle2 size={24} color="#10b981" />
                                ) : (
                                    <Circle size={24} color="#94a3b8" />
                                )}
                            </TouchableOpacity>
                            <View style={styles.taskContent}>
                                <Text style={[styles.taskText, item.completed && styles.completedTaskText]}>
                                    {item.text}
                                </Text>
                                <View style={styles.taskMeta}>
                                    {project && (
                                        <View style={[styles.projectTag, { backgroundColor: project.color + '20' }]}>
                                            <View style={[styles.projectDot, { backgroundColor: project.color }]} />
                                            <Text style={[styles.projectTagText, { color: project.color }]}>
                                                {project.name}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.priorityTag}>
                                        <Flag size={12} color="#f59e0b" />
                                        <Text style={styles.priorityText}>
                                            {typeof item.priorityScore === 'number' ? item.priorityScore.toFixed(1) : '0.0'}
                                        </Text>
                                    </View>
                                    {item.timeSpent > 0 && (
                                        <View style={styles.timeSpentTag}>
                                            <Clock size={12} color="#94a3b8" />
                                            <Text style={styles.timeSpentText}>{formatTime(item.timeSpent)}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View style={styles.taskActions}>
                            <TouchableOpacity onPress={() => onNavigateTimer(item)} style={styles.actionButton}>
                                <PlayCircle size={20} color="#6366f1" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </Swipeable>
        );
    };

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
                                    onOpenModal={openTaskModal}
                                    onToggle={toggleTask}
                                    onNavigateTimer={(task) => navigation.navigate('Timer', { task })}
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
                                                onOpenModal={openTaskModal}
                                                onToggle={toggleTask}
                                                onNavigateTimer={(task) => navigation.navigate('Timer', { task })}
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
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'New Task'}</Text>
                                <TouchableOpacity onPress={closeTaskModal}>
                                    <X size={24} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                <Text style={styles.inputLabel}>Task Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="What needs to be done?"
                                    placeholderTextColor="#64748b"
                                    value={taskText}
                                    onChangeText={setTaskText}
                                />

                                <Text style={styles.inputLabel}>Project</Text>

                                {/* Project Search */}
                                <View style={styles.searchContainer}>
                                    <Search size={16} color="#94a3b8" style={styles.searchIcon} />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Search projects..."
                                        placeholderTextColor="#64748b"
                                        value={projectSearchText}
                                        onChangeText={setProjectSearchText}
                                    />
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectSelector}>
                                    {projects
                                        .filter(p => !p.archived && p.name.toLowerCase().includes(projectSearchText.toLowerCase()))
                                        .map((project) => (
                                            <TouchableOpacity
                                                key={project.id}
                                                style={[
                                                    styles.projectOption,
                                                    selectedProject === project.id && { backgroundColor: project.color, borderColor: project.color },
                                                ]}
                                                onPress={() => setSelectedProject(project.id)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.projectOptionText,
                                                        selectedProject === project.id && { color: '#fff' },
                                                    ]}
                                                >
                                                    {project.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    <TouchableOpacity
                                        style={[styles.projectOption, { borderColor: '#6366f1', borderStyle: 'dashed' }]}
                                        onPress={() => {
                                            closeTaskModal();
                                            navigation.navigate('Projects', { openCreate: true });
                                        }}
                                    >
                                        <Plus size={16} color="#6366f1" />
                                        <Text style={[styles.projectOptionText, { color: '#6366f1', marginLeft: 4 }]}>New</Text>
                                    </TouchableOpacity>
                                </ScrollView>

                                <View style={styles.divider} />

                                <Text style={styles.sectionTitle}>Priority Attributes</Text>
                                <AttributeSelector
                                    label="Easiness (40%)"
                                    value={attributes.easiness}
                                    onChange={(val) => setAttributes({ ...attributes, easiness: val })}
                                />
                                <AttributeSelector
                                    label="Importance (30%)"
                                    value={attributes.importance}
                                    onChange={(val) => setAttributes({ ...attributes, importance: val })}
                                />
                                <AttributeSelector
                                    label="Emergency (20%)"
                                    value={attributes.emergency}
                                    onChange={(val) => setAttributes({ ...attributes, emergency: val })}
                                />
                                <AttributeSelector
                                    label="Interest (10%)"
                                    value={attributes.interest}
                                    onChange={(val) => setAttributes({ ...attributes, interest: val })}
                                />
                            </ScrollView>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
                                <Text style={styles.saveButtonText}>Save Task</Text>
                            </TouchableOpacity>
                        </View>
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
    deleteAction: {
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '88%',
        borderRadius: 16,
        marginBottom: 12,
    },
    checkbox: {
        padding: 4,
        marginLeft: -4,
    },
    timeSpentTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#33415540',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    timeSpentText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
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
    deleteActionPlaceholder: {
        width: 100,
        backgroundColor: 'transparent',
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
    taskContainer: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    taskMain: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    taskTextContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        gap: 12,
    },
    taskContent: {
        flex: 1,
    },
    taskText: {
        fontSize: 16,
        color: '#f1f5f9',
        fontWeight: '500',
        marginBottom: 6,
    },
    completedTaskText: {
        textDecorationLine: 'line-through',
        color: '#64748b',
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    projectTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    projectDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    projectTagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    priorityTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f59e0b20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    priorityText: {
        color: '#f59e0b',
        fontSize: 12,
        fontWeight: '700',
    },
    taskActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginLeft: 8,
    },
    actionButton: {
        padding: 4,
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
    modalContent: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#f8fafc',
    },
    modalBody: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 12,
        color: '#f8fafc',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#f8fafc',
        paddingVertical: 12,
        fontSize: 14,
    },
    projectSelector: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    projectOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    projectOptionText: {
        color: '#94a3b8',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#334155',
        marginVertical: 20,
    },
    sectionTitle: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    attributeRow: {
        marginBottom: 16,
    },
    attributeLabel: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 8,
    },
    attributeOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    attributeOption: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#334155',
        alignItems: 'center',
    },
    attributeOptionSelected: {
        // Background color set dynamically
    },
    attributeOptionText: {
        color: '#94a3b8',
        fontWeight: '600',
        fontSize: 12,
    },
    attributeOptionTextSelected: {
        color: '#fff',
    },
    saveButton: {
        backgroundColor: '#6366f1',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyStateText: {
        color: '#64748b',
        fontSize: 16,
    },
});
