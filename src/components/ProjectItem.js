import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Clock, Eye, EyeOff } from 'lucide-react-native';
import { formatTime } from '../utils/time';

const ProjectItem = ({ item, totalTime, onOpenModal, onToggleArchive, onDelete }) => {
    const swipeableRef = useRef(null);

    const renderRightActions = () => {
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
                    onDelete(item.id);
                }
            }}
        >
            <TouchableOpacity
                style={styles.projectListItem}
                onPress={() => onOpenModal(item)}
            >
                <View style={styles.projectListContent}>
                    <View style={styles.projectListInfo}>
                        <View style={[styles.projectDot, { backgroundColor: item.color }]} />
                        <View style={styles.projectTextContainer}>
                            <Text style={styles.projectListText}>{item.name}</Text>
                            {item.archived && <Text style={styles.archivedBadge}>Archived</Text>}
                        </View>
                    </View>
                    <View style={styles.projectListRight}>
                        <View style={styles.timeBadge}>
                            <Clock size={12} color="#94a3b8" />
                            <Text style={styles.timeBadgeText}>{formatTime(totalTime)}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                onToggleArchive(item.id);
                            }}
                            style={styles.archiveButton}
                        >
                            {item.archived ? <EyeOff size={20} color="#f59e0b" /> : <Eye size={20} color="#64748b" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    deleteActionPlaceholder: {
        width: 100,
        backgroundColor: 'transparent',
    },
    projectListItem: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
        overflow: 'hidden',
    },
    projectListContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
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
    projectTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
        marginLeft: 8,
    },
    projectListRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
    archiveButton: {
        padding: 4,
    },
});

export default ProjectItem;
