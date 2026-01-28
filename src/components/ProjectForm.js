import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const ProjectForm = ({
    name,
    setName,
    color,
    setColor,
    isEditing,
    onSave,
}) => {
    return (
        <View style={styles.projectForm}>
            <TextInput
                style={[styles.input, { marginBottom: 10 }]}
                placeholder="Project Name"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
            />
            <View style={styles.colorSelector}>
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((c) => (
                    <TouchableOpacity
                        key={c}
                        style={[
                            styles.colorOption,
                            { backgroundColor: c },
                            color === c && styles.colorOptionSelected,
                        ]}
                        onPress={() => setColor(c)}
                    />
                ))}
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                <Text style={styles.saveButtonText}>
                    {isEditing ? 'Update Project' : 'Add Project'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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

export default ProjectForm;
