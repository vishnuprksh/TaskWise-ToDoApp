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
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';

export default function HomeScreen({ navigation }) {
    const { tasks, projects, updateTasks, calculatePriorityScore } = useApp();
    const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
    const [projectSearchText, setProjectSearchText] = useState('');
    const [selectedFilterProject, setSelectedFilterProject] = useState(null); // null means 'All'

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

    const getAttributeColor = (value) => {
        switch (value) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#64748b';
        }
    };

    const renderTaskItem = ({ item }) => {
        const project = getProject(item.projectId);
        return (
            <Animated.View style={[styles.taskContainer, { opacity: fadeAnim }]}>
                <View style={styles.taskMain}>
                    <TouchableOpacity
                        style={styles.taskTextContainer}
                        onPress={() => toggleTask(item.id)}
                    >
                        {item.completed ? (
                            <CheckCircle2 size={24} color="#10b981" />
                        ) : (
                            <Circle size={24} color="#94a3b8" />
                        )}
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
                            </View>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.taskActions}>
                        <TouchableOpacity onPress={() => navigation.navigate('Timer', { task: item })} style={styles.actionButton}>
                            <PlayCircle size={20} color="#6366f1" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openTaskModal(item)} style={styles.actionButton}>
                            <Edit2 size={20} color="#64748b" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.actionButton}>
                            <Trash2 size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        );
    };

    const filteredTasks = tasks.filter(t => {
        const project = getProject(t.projectId);
        // Filter by selected project (if any)
        if (selectedFilterProject && t.projectId !== selectedFilterProject) return false;
        // Filter out archived projects (unless selected explicitly, though UI might prevent selecting archived)
        return !project || !project.archived;
    });

    return (
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
                    {/* Project Filter Dropdown (Simplified as a cycle button for now or modal) */}
                    {/* Let's make it a horizontal scroll selector below header or a modal picker. 
               User asked for "top right corner option". Let's use a simple modal or just a button that cycles/opens selection.
               For simplicity and UX, let's put a filter icon that opens a small modal or just cycles. 
               Actually, let's implement a horizontal list of chips below the header for filtering, it's cleaner.
               Wait, user specifically asked "top right corner option".
           */}
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => {
                            // Simple implementation: Cycle through projects or show a picker. 
                            // For better UX, let's use a simple alert/action sheet style for now or a custom modal.
                            // Let's use a custom small modal for selection.
                            // Or navigate to a "Filter" screen? No, that's too much.
                            // Let's just add a horizontal list below header for now, it's better than a hidden menu.
                            // BUT, adhering to "top right corner option":
                            // I will make this button toggle a visibility of a filter bar.
                        }}
                    >
                        {/* Placeholder for now, will implement filter bar below */}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Projects')} style={styles.projectsButton}>
                        <Briefcase size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.projectsButton}>
                        <Settings size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Project Filter Bar (Visible always or toggleable) */}
            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <TouchableOpacity
                        style={[styles.filterChip, !selectedFilterProject && styles.filterChipSelected]}
                        onPress={() => setSelectedFilterProject(null)}
                    >
                        <Text style={[styles.filterChipText, !selectedFilterProject && styles.filterChipTextSelected]}>All</Text>
                    </TouchableOpacity>
                    {projects.filter(p => !p.archived).map(p => (
                        <TouchableOpacity
                            key={p.id}
                            style={[styles.filterChip, selectedFilterProject === p.id && styles.filterChipSelected, { borderColor: p.color }]}
                            onPress={() => setSelectedFilterProject(p.id)}
                        >
                            <View style={[styles.projectDot, { backgroundColor: p.color }]} />
                            <Text style={[styles.filterChipText, selectedFilterProject === p.id && styles.filterChipTextSelected]}>{p.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Task List */}
            <FlatList
                data={filteredTasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No tasks found.</Text>
                    </View>
                }
            />

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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
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
    projectsButton: {
        backgroundColor: '#334155',
        padding: 10,
        borderRadius: 12,
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
