import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { X, Search, Plus } from 'lucide-react-native';
import AttributeSelector from './AttributeSelector';

const TaskForm = ({
    isEditing,
    taskText,
    setTaskText,
    projects,
    selectedProject,
    setSelectedProject,
    projectSearchText,
    setProjectSearchText,
    attributes,
    setAttributes,
    onSave,
    onClose,
    onNavigateProjects,
}) => {

    return (
        <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isEditing ? 'Edit Task' : 'New Task'}</Text>
                <TouchableOpacity onPress={onClose}>
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
                            onClose();
                            onNavigateProjects();
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

            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                <Text style={styles.saveButtonText}>Save Task</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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
        paddingHorizontal: 12,
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
        fontSize: 14,
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
        fontWeight: '600',
        marginBottom: 12,
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

export default TaskForm;
