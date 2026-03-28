import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
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
    ArrowLeft,
    Plus,
} from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useApp } from '../context/AppContext';
import ProjectItem from '../components/ProjectItem';
import ProjectForm from '../components/ProjectForm';

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
        return tasks
            .filter(t => t.projectId === projectId)
            .reduce((acc, t) => acc + (t.timeSpent || 0), 0);
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
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
                        <ProjectItem
                            item={item}
                            totalTime={getProjectTotalTime(item.id)}
                            onOpenModal={openProjectModal}
                            onToggleArchive={toggleProjectArchive}
                            onDelete={deleteProject}
                        />
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

                            <ProjectForm
                                name={projectName}
                                setName={setProjectName}
                                color={projectColor}
                                setColor={setProjectColor}
                                isEditing={!!editingProject}
                                onSave={handleSaveProject}
                            />
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
});
