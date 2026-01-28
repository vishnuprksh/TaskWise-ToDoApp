import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import {
    CheckCircle2,
    Circle,
    PlayCircle,
    Clock,
    Flag,
} from 'lucide-react-native';
import { formatTime } from '../utils/time';

const TaskItem = ({ item, project, onOpenModal, onToggle, onNavigateTimer, onDelete, fadeAnim }) => {
    const swipeableRef = useRef(null);

    const renderRightActions = (progress, dragX) => {
        return (
            <View style={styles.deleteActionPlaceholder} />
        );
    };

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
                            { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) }
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

const styles = StyleSheet.create({
    deleteActionPlaceholder: {
        width: 100,
        backgroundColor: 'transparent',
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
    checkbox: {
        padding: 4,
        marginLeft: -4,
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
    taskActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginLeft: 8,
    },
    actionButton: {
        padding: 4,
    },
});

export default TaskItem;
