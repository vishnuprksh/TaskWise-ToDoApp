import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { format, addDays, subDays, isSameDay, startOfDay } from 'date-fns';
import { isValidDate, safeFormat } from '../utils/time';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, withSpring } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import ScheduleModal from '../components/ScheduleModal';

const HOUR_HEIGHT = 80;
const TIME_LABELS_WIDTH = 60;
const SCREEN_WIDTH = Dimensions.get('window').width;

const EventItem = ({ task, project, onUpdate, onPress }) => {
    const startDate = isValidDate(task.scheduledAt) ? new Date(task.scheduledAt) : new Date();
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const duration = task.duration || 60;

    // Check if event is past
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const isPast = endDate < new Date();


    const top = useSharedValue(startMinutes * (HOUR_HEIGHT / 60));
    const height = useSharedValue(duration * (HOUR_HEIGHT / 60));
    const startTop = useSharedValue(0);
    const startHeight = useSharedValue(0);
    const isActive = useSharedValue(false);

    useEffect(() => {
        top.value = startMinutes * (HOUR_HEIGHT / 60);
        height.value = duration * (HOUR_HEIGHT / 60);
    }, [task.scheduledAt, task.duration]);

    const dragGesture = Gesture.Pan()
        .minPointers(1)
        .activateAfterLongPress(250) // Delay to distinguish from scrolling
        .onStart(() => {
            startTop.value = top.value;
            isActive.value = true;
        })
        .onUpdate((e) => {
            top.value = startTop.value + e.translationY;
        })
        .onEnd(() => {
            // Snap to 15 minutes
            const snapStep = 15 * (HOUR_HEIGHT / 60);
            const snappedTop = Math.round(top.value / snapStep) * snapStep;
            top.value = withSpring(snappedTop);
            isActive.value = false;

            const newStartMinutes = snappedTop / (HOUR_HEIGHT / 60);
            const newHours = Math.floor(newStartMinutes / 60);
            const newMinutes = Math.round(newStartMinutes % 60);

            runOnJS(onUpdate)(task.id, { newHours, newMinutes });
        });

    const resizeGesture = Gesture.Pan()
        .minPointers(1)
        .activateAfterLongPress(150)
        .onStart(() => {
            startHeight.value = height.value;
            isActive.value = true;
        })
        .onUpdate((e) => {
            height.value = Math.max(30, startHeight.value + e.translationY); // Min height 30px
        })
        .onEnd(() => {
            // Snap to 15 minutes
            const snapStep = 15 * (HOUR_HEIGHT / 60);
            const snappedHeight = Math.round(height.value / snapStep) * snapStep;
            height.value = withSpring(snappedHeight);
            isActive.value = false;

            const newDuration = Math.round(snappedHeight / (HOUR_HEIGHT / 60));
            runOnJS(onUpdate)(task.id, { newDuration });
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            top: top.value,
            height: height.value,
            zIndex: isActive.value ? 100 : 1,
            opacity: isActive.value ? 0.8 : 1,
            transform: [{ scale: isActive.value ? 1.02 : 1 }],
        };
    });

    const tapGesture = Gesture.Tap()
        .onEnd(() => {
            runOnJS(onPress)(task);
        });

    const composedGesture = Gesture.Race(dragGesture, tapGesture);

    return (
        <Animated.View style={[styles.eventContainer, animatedStyle]}>
            <GestureDetector gesture={composedGesture}>
                <View style={[
                    styles.eventContent,
                    { backgroundColor: project ? project.color : '#6366f1' }
                ]}>
                    <Text style={styles.eventText} numberOfLines={1}>
                        {task.text}
                    </Text>
                    <Text style={styles.eventTime}>
                        {safeFormat(startDate, 'h:mm a')}
                    </Text>

                    {isPast && <View style={styles.pastOverlay} />}
                </View>
            </GestureDetector>

            <GestureDetector gesture={resizeGesture}>
                <View style={styles.resizeHandle}>
                    <View style={styles.resizeBar} />
                </View>
            </GestureDetector>
        </Animated.View>
    );
};

export default function CalendarScreen({ navigation }) {
    const { tasks, updateTasks, updateTaskSchedule, projects, duplicateTask, cancelTaskSchedule } = useApp();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const dayTasks = tasks.filter(t =>
        isValidDate(t.scheduledAt) && isSameDay(new Date(t.scheduledAt), selectedDate)
    );

    const handleUpdateTask = (taskId, updates) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !isValidDate(task.scheduledAt)) return;

        if (updates.newHours !== undefined) {
            const newDate = new Date(task.scheduledAt);

            newDate.setHours(updates.newHours);
            newDate.setMinutes(updates.newMinutes);
            // Re-validate if it changed day (it shouldn't in this view but just in case)
            updateTaskSchedule(taskId, newDate, task.duration);
        }

        if (updates.newDuration !== undefined) {
            updateTaskSchedule(taskId, new Date(task.scheduledAt), updates.newDuration);
        }
    };

    const getProject = (id) => projects.find(p => p.id === id);

    const findNextAvailableSlot = (date, duration) => {
        const dayStart = new Date(date);
        dayStart.setHours(9, 0, 0, 0); // Default start at 9 AM for future days
        const now = new Date();
        const startTime = isSameDay(date, now) ? now : dayStart; // For today, start from current time; for future days, from 9 AM

        // Get all tasks on this day
        const dayTasks = tasks.filter(t =>
            isValidDate(t.scheduledAt) && isSameDay(new Date(t.scheduledAt), date)
        );

        // Sort by start time
        dayTasks.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

        let currentTime = startTime;

        for (const task of dayTasks) {
            const taskStart = new Date(task.scheduledAt);
            const taskEnd = new Date(taskStart.getTime() + (task.duration || 60) * 60000);

            if (currentTime < taskStart) {
                // There's a gap before this task
                const gapDuration = (taskStart - currentTime) / 60000; // in minutes
                if (gapDuration >= duration) {
                    return currentTime;
                }
            }
            // Move to after this task
            currentTime = taskEnd;
        }

        // No conflicts, use currentTime, but ensure it's at least 5 minutes from now for today
        if (isSameDay(date, now)) {
            return new Date(Math.max(currentTime.getTime(), now.getTime() + 5 * 60 * 1000));
        }
        return currentTime;
    };

    const handleEventPress = (task) => {
        setTaskToEdit(task);
        setIsScheduleModalVisible(true);
    };

    const handleScheduleUpdate = (taskId, date, duration) => {
        updateTaskSchedule(taskId, date, duration, true);
        setIsScheduleModalVisible(false);
        setTaskToEdit(null);
    };

    const handleDuplicateEvent = (taskId, date, duration) => {
        duplicateTask(taskId, date, duration, true);
        setIsScheduleModalVisible(false);
        setTaskToEdit(null);
    };

    const handleDeleteTask = (taskId) => {
        cancelTaskSchedule(taskId);
        setIsScheduleModalVisible(false);
        setTaskToEdit(null);
    };

    const headerDoubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .runOnJS(true)
        .onEnd(() => {
            setSelectedDate(new Date());
        });

    const headerSingleTap = Gesture.Tap()
        .runOnJS(true)
        .onEnd(() => {
            setShowDatePicker(true);
        });

    const renderTimeLines = () => {
        const lines = [];
        for (let i = 0; i < 24; i++) {
            lines.push(
                <View key={i} style={[styles.timeRow, { top: i * HOUR_HEIGHT }]}>
                    <Text style={styles.timeLabel}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}</Text>
                    <View style={styles.gridLine} />
                </View>
            );
        }
        return lines;
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        <ArrowLeft size={24} color="#f8fafc" />
                    </TouchableOpacity>

                    <View style={styles.dateSelector}>
                        <TouchableOpacity onPress={() => setSelectedDate(subDays(selectedDate, 1))}>
                            <ChevronLeft size={24} color="#94a3b8" />
                        </TouchableOpacity>

                        <GestureDetector gesture={Gesture.Exclusive(headerDoubleTap, headerSingleTap)}>
                            <View style={styles.dateTextContainer}>
                                <Text style={styles.dateTitle}>{format(selectedDate, 'MMMM d')}</Text>
                                <Text style={styles.dateSubtitle}>{format(selectedDate, 'EEEE')}</Text>
                            </View>
                        </GestureDetector>

                        <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 1))}>
                            <ChevronRight size={24} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                {/* Timeline */}
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.timelineContainer}>
                        {renderTimeLines()}

                        {/* Current Time Indicator (Visual only, static for now or can make dynamic) */}
                        {isSameDay(selectedDate, new Date()) && (
                            <View
                                style={[
                                    styles.currentTimeLine,
                                    {
                                        top: (new Date().getHours() * 60 + new Date().getMinutes()) * (HOUR_HEIGHT / 60)
                                    }
                                ]}
                            >
                                <View style={styles.currentTimeDot} />
                            </View>
                        )}

                        {dayTasks.map(task => (
                            <EventItem
                                key={task.id}
                                task={task}
                                project={getProject(task.projectId)}
                                onUpdate={handleUpdateTask}
                                onPress={handleEventPress}
                            />
                        ))}
                    </View>
                </ScrollView>

                <ScheduleModal
                    visible={isScheduleModalVisible}
                    onClose={() => setIsScheduleModalVisible(false)}
                    onSchedule={handleScheduleUpdate}
                    onDelete={handleDeleteTask}
                    onDuplicate={handleDuplicateEvent}
                    task={taskToEdit}
                    initialDate={taskToEdit?.scheduledAt}
                />

                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowDatePicker(false);
                            if (date) setSelectedDate(date);
                        }}
                    />
                )}
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
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        backgroundColor: '#0f172a',
        zIndex: 10,
    },
    iconButton: {
        padding: 8,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    dateTextContainer: {
        alignItems: 'center',
    },
    dateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f8fafc',
    },
    dateSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
    },
    scrollContent: {
        minHeight: HOUR_HEIGHT * 24 + 50,
        paddingBottom: 50,
    },
    timelineContainer: {
        height: HOUR_HEIGHT * 24,
        marginTop: 10,
        position: 'relative',
    },
    timeRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: HOUR_HEIGHT,
        flexDirection: 'row',
    },
    timeLabel: {
        width: TIME_LABELS_WIDTH,
        textAlign: 'right',
        color: '#64748b',
        fontSize: 12,
        transform: [{ translateY: -8 }], // Center vertically on line roughly
        paddingRight: 10,
    },
    gridLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#334155',
        opacity: 0.5,
    },
    // Event Styles
    eventContainer: {
        position: 'absolute',
        left: TIME_LABELS_WIDTH + 10,
        right: 10,
        borderRadius: 8,
        overflow: 'hidden',
    },
    eventContent: {
        flex: 1,
        padding: 8,
        borderRadius: 8,
    },
    eventText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    eventTime: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        marginTop: 2,
    },
    resizeHandle: {
        height: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    resizeBar: {
        width: 30,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 2,
    },
    currentTimeLine: {
        position: 'absolute',
        left: TIME_LABELS_WIDTH,
        right: 0,
        height: 2,
        backgroundColor: '#f43f5e',
        zIndex: 5,
    },
    currentTimeDot: {
        position: 'absolute',
        left: -4,
        top: -3,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f43f5e',
    },
    pastOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 8,
    },
});
