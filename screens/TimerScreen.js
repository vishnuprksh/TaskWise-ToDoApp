import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Play,
    Pause,
    RotateCcw,
    Clock,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');
const TIMER_DURATION = 25 * 60; // 25 minutes

export default function TimerScreen({ navigation, route }) {
    const { task } = route.params;
    const { updateTaskTime } = useApp();
    const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
    const [isActive, setIsActive] = useState(false);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const lastTickRef = useRef(Date.now());

    // Track elapsed time to update global state
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            lastTickRef.current = Date.now();
            interval = setInterval(() => {
                const now = Date.now();
                const delta = Math.floor((now - lastTickRef.current) / 1000);
                if (delta >= 1) {
                    setTimeLeft((prev) => prev - 1);
                    updateTaskTime(task.id, 1); // Add 1 second to total time
                    lastTickRef.current = now;
                }
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: (TIMER_DURATION - timeLeft) / TIMER_DURATION,
            duration: 1000,
            useNativeDriver: false,
        }).start();
    }, [timeLeft]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(TIMER_DURATION);
        progressAnim.setValue(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTotalTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#f8fafc" />
                </TouchableOpacity>
                <Text style={styles.title}>Focus Mode</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.taskContainer}>
                    <Text style={styles.taskLabel}>Current Task</Text>
                    <Text style={styles.taskText}>{task.text}</Text>
                    <View style={styles.totalTimeContainer}>
                        <Clock size={16} color="#94a3b8" />
                        <Text style={styles.totalTimeText}>
                            Total Focus: {formatTotalTime(task.timeSpent || 0)}
                        </Text>
                    </View>
                </View>

                <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                    <View style={styles.progressBarContainer}>
                        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
                    </View>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity onPress={toggleTimer} style={styles.controlButton}>
                        {isActive ? (
                            <Pause size={32} color="#fff" fill="#fff" />
                        ) : (
                            <Play size={32} color="#fff" fill="#fff" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={resetTimer} style={[styles.controlButton, styles.resetButton]}>
                        <RotateCcw size={24} color="#94a3b8" />
                    </TouchableOpacity>
                </View>
            </View>
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
        fontSize: 20,
        fontWeight: '600',
        color: '#f8fafc',
    },
    backButton: {
        padding: 8,
        backgroundColor: '#1e293b',
        borderRadius: 12,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    taskContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    taskLabel: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    taskText: {
        color: '#f8fafc',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    totalTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#1e293b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    totalTimeText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
    timerContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 60,
    },
    timerText: {
        color: '#fff',
        fontSize: 80,
        fontWeight: '200',
        fontVariant: ['tabular-nums'],
        marginBottom: 30,
    },
    progressBarContainer: {
        width: '100%',
        height: 6,
        backgroundColor: '#1e293b',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#6366f1',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 30,
    },
    controlButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    resetButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#1e293b',
        shadowColor: 'transparent',
        elevation: 0,
    },
});
