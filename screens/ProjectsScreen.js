import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    Modal,
    Keyboard,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    X,
    Edit2,
    Trash2,
    Archive,
    ArrowLeft,
    Plus,
    Clock,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';

export default function ProjectsScreen({ navigation, route }) {
    const { projects, tasks, updateProjects, updateTasks } = useApp();
    const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectColor, setProjectColor] = useState('#3b82f6');
    const [editingProject, setEditingProject] = useState(null);

    useEffect(() => {
        if (route.params?.openCreate) {
            openProjectModal();
        }
    }, [route.params]);

    const handleSaveProject = () => {
        if (projectName.trim().length === 0) return;

        const newProject = {
            id: editingProject ? editingProject.id : Date.now().toString(),
            name: projectName,
            color: projectColor,
            archived: editingProject ? editingProject.archived : false,
        };

        let newProjects;
        if (editingProject) {
            newProjects = projects.map((p) => (p.id === editingProject.id ? newProject : p));
        } else {
            newProjects = [...projects, newProject];
        }

        updateProjects(newProjects);
        closeProjectModal();
    };

    const deleteProject = (id) => {
        Alert.alert(
            "Delete Project",
            "Are you sure? Tasks in this project will remain but lose their project tag.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        const newProjects = projects.filter((p) => p.id !== id);
                        updateProjects(newProjects);

                        // Update tasks to remove project reference
                        const newTasks = tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t);
                        updateTasks(newTasks);
                    }
                }
            ]
        );
    };

    const toggleProjectArchive = (id) => {
        const newProjects = projects.map((p) =>
            p.id === id ? { ...p, archived: !p.archived } : p
        );
        updateProjects(newProjects);
    };

    const openProjectModal = (project = null) => {
        if (project) {
            setEditingProject(project);
            setProjectName(project.name);
            setProjectColor(project.color);
        } else {
            setEditingProject(null);
            setProjectName('');
            setProjectColor('#3b82f6');
        }
        setIsProjectModalVisible(true);
    };

    const closeProjectModal = () => {
        setIsProjectModalVisible(false);
        Keyboard.dismiss();
    };

    const getProjectTotalTime = (projectId) => {
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        const totalSeconds = projectTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#f8fafc" />
                </TouchableOpacity>
                <Text style={styles.title}>Projects</Text>
                <TouchableOpacity onPress={() => openProjectModal()} style={styles.addButton}>
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={projects}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.projectListItem}>
                        <View style={styles.projectListInfo}>
                            <View style={[styles.projectDot, { backgroundColor: item.color }]} />
                            <Text style={styles.projectListText}>{item.name}</Text>
                            <Text style={styles.projectListText}>{item.name}</Text>
                            {item.archived && <Text style={styles.archivedBadge}>Archived</Text>}
                            <View style={styles.timeBadge}>
                                <Clock size={12} color="#94a3b8" />
                                <Text style={styles.timeBadgeText}>{getProjectTotalTime(item.id)}</Text>
                            </View>
                        </View>
                        <View style={styles.projectListActions}>
                            <TouchableOpacity onPress={() => toggleProjectArchive(item.id)} style={{ marginRight: 15 }}>
                                <Archive size={20} color={item.archived ? "#f59e0b" : "#64748b"} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => openProjectModal(item)} style={{ marginRight: 15 }}>
                                <Edit2 size={20} color="#64748b" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteProject(item.id)}>
                                <Trash2 size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                style={styles.projectList}
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            <Modal
                visible={isProjectModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsProjectModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingProject ? 'Edit Project' : 'New Project'}</Text>
                            <TouchableOpacity onPress={() => setIsProjectModalVisible(false)}>
                                <X size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.projectForm}>
                            <TextInput
                                style={[styles.input, { marginBottom: 10 }]}
                                placeholder="Project Name"
                                placeholderTextColor="#64748b"
                                value={projectName}
                                onChangeText={setProjectName}
                            />
                            <View style={styles.colorSelector}>
                                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: color },
                                            projectColor === color && styles.colorOptionSelected,
                                        ]}
                                        onPress={() => setProjectColor(color)}
                                    />
                                ))}
                            </View>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProject}>
                                <Text style={styles.saveButtonText}>
                                    {editingProject ? 'Update Project' : 'Add Project'}
                                </Text>
                            </TouchableOpacity>
                        </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#f8fafc',
    },
    backButton: {
        padding: 8,
    },
    addButton: {
        padding: 8,
        backgroundColor: '#334155',
        borderRadius: 12,
    },
    projectList: {
        paddingHorizontal: 20,
    },
    projectListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    projectListInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    projectDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    projectListText: {
        color: '#f1f5f9',
        fontSize: 16,
        fontWeight: '600',
    },
    archivedBadge: {
        fontSize: 10,
        color: '#f59e0b',
        backgroundColor: '#f59e0b20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderRadius: 4,
        marginLeft: 8,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: '#334155',
    },
    timeBadgeText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    projectListActions: {
        flexDirection: 'row',
        alignItems: 'center',
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
    projectForm: {
        gap: 16,
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
    colorSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorOptionSelected: {
        borderColor: '#fff',
    },
    saveButton: {
        backgroundColor: '#6366f1',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
