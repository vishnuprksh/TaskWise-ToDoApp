import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Modal,
    TextInput,
    Alert,
    Switch,
    Vibration,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import {
    ArrowLeft,
    Play,
    Pause,
    RotateCcw,
    Clock,
    Settings,
    X,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/time';
import { useKeepAwake } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    withRepeat,
    withSequence,
    withSpring,
    Easing,
    useAnimatedStyle,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function KeepAwakeWrapper() {
    useKeepAwake();
    return null;
}

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;
const STROKE_WIDTH = 15;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MODES = {
    WORK: 'work',
    SHORT_BREAK: 'shortBreak',
    LONG_BREAK: 'longBreak',
};

const DEFAULT_DURATIONS = {
    [MODES.WORK]: 25,
    [MODES.SHORT_BREAK]: 5,
    [MODES.LONG_BREAK]: 15,
};

const STORAGE_KEY_SETTINGS = '@taskwise_timer_settings';

const TimerSettingsModal = ({ visible, onClose, onSave, initialDurations, initialShowBreaks }) => {
    const [tempDurations, setTempDurations] = useState(initialDurations);
    const [tempShowBreaks, setTempShowBreaks] = useState(initialShowBreaks);

    useEffect(() => {
        if (visible) {
            setTempDurations(initialDurations);
            setTempShowBreaks(initialShowBreaks);
        }
    }, [visible, initialDurations, initialShowBreaks]);

    const handleSave = () => {
        onSave(tempDurations, tempShowBreaks);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Timer Settings</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#f8fafc" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Work (min)</Text>
                        <TextInput
                            style={styles.settingInput}
                            keyboardType="number-pad"
                            value={String(tempDurations[MODES.WORK])}
                            onChangeText={(v) => setTempDurations(p => ({ ...p, [MODES.WORK]: parseInt(v) || 0 }))}
                        />
                    </View>

                    <View style={[styles.settingItem, styles.settingRow]}>
                        <Text style={styles.settingLabel}>Enable Breaks</Text>
                        <Switch
                            value={tempShowBreaks}
                            onValueChange={setTempShowBreaks}
                            trackColor={{ false: '#334155', true: '#6366f1' }}
                            thumbColor={tempShowBreaks ? '#c7d2fe' : '#94a3b8'}
                        />
                    </View>

                    {tempShowBreaks && (
                        <>
                            <View style={styles.settingItem}>
                                <Text style={styles.settingLabel}>Short Break (min)</Text>
                                <TextInput
                                    style={styles.settingInput}
                                    keyboardType="number-pad"
                                    value={String(tempDurations[MODES.SHORT_BREAK])}
                                    onChangeText={(v) => setTempDurations(p => ({ ...p, [MODES.SHORT_BREAK]: parseInt(v) || 0 }))}
                                />
                            </View>
                            <View style={styles.settingItem}>
                                <Text style={styles.settingLabel}>Long Break (min)</Text>
                                <TextInput
                                    style={styles.settingInput}
                                    keyboardType="number-pad"
                                    value={String(tempDurations[MODES.LONG_BREAK])}
                                    onChangeText={(v) => setTempDurations(p => ({ ...p, [MODES.LONG_BREAK]: parseInt(v) || 0 }))}
                                />
                            </View>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default function TimerScreen({ navigation, route }) {
    const { task } = route.params;
    const { updateTaskTime } = useApp();

    // Settings State
    const [durations, setDurations] = useState(DEFAULT_DURATIONS);
    const [showBreaks, setShowBreaks] = useState(true);
    const [currentMode, setCurrentMode] = useState(MODES.WORK);
    const [showSettings, setShowSettings] = useState(false);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS[MODES.WORK] * 60);
    const [isActive, setIsActive] = useState(false);
    const lastTickRef = useRef(Date.now());
    const timeLeftRef = useRef(timeLeft);

    // Session duration tracks the "total" for the current session (temporary adjustments)
    const sessionDurationRef = useRef(DEFAULT_DURATIONS[MODES.WORK] * 60);

    // Gesture state in shared values for worklet access
    const currentTimeSV = useSharedValue(DEFAULT_DURATIONS[MODES.WORK] * 60);
    const storedStartTimeSV = useSharedValue(0);

    // Animation Values
    const progress = useSharedValue(1);
    const breathing = useSharedValue(1);

    // Initial Load
    useEffect(() => {
        loadSettings();
    }, []);

    // Navigation guard: prevent going back while timer is active or paused
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            const isSessionInProgress = isActive || (timeLeftRef.current < sessionDurationRef.current && timeLeftRef.current > 0);

            if (!isSessionInProgress) return;

            e.preventDefault();
            Alert.alert(
                'Stop Timer?',
                'Going back will break your focus session. Are you sure?',
                [
                    { text: 'Stay', style: 'cancel' },
                    {
                        text: 'Leave',
                        style: 'destructive',
                        onPress: () => {
                            setIsActive(false);
                            navigation.dispatch(e.data.action);
                        },
                    },
                ]
            );
        });
        return unsubscribe;
    }, [navigation, isActive]);

    // Effect to update time left when mode changes or durations load
    useEffect(() => {
        if (!isActive) {
            const newTime = durations[currentMode] * 60;
            setTimeLeft(newTime);
            // Update shared value
            currentTimeSV.value = newTime;
            sessionDurationRef.current = newTime;
            progress.value = withTiming(1, { duration: 500 });
        }
    }, [currentMode, durations]);

    // Keep shared value and ref in sync with state
    useEffect(() => {
        currentTimeSV.value = timeLeft;
        timeLeftRef.current = timeLeft;
    }, [timeLeft]);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY_SETTINGS);
            let finalDurations = DEFAULT_DURATIONS;
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.durations) {
                    setDurations(parsed.durations);
                    finalDurations = parsed.durations;
                    setShowBreaks(parsed.showBreaks !== undefined ? parsed.showBreaks : true);
                } else {
                    // Legacy format: settings were just durations
                    setDurations(parsed);
                    finalDurations = parsed;
                }
            }
            
            // Auto-start timer on load
            const initialTime = finalDurations[currentMode] * 60;
            setTimeLeft(initialTime);
            sessionDurationRef.current = initialTime;
            setIsActive(true);
        } catch (e) {
            console.error(e);
        }
    };

    const saveSettings = async (newDurations, newShowBreaks) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
                durations: newDurations,
                showBreaks: newShowBreaks,
            }));
            setDurations(newDurations);
            setShowBreaks(newShowBreaks);
            // If breaks are being hidden, switch to WORK mode
            if (!newShowBreaks && currentMode !== MODES.WORK) {
                setCurrentMode(MODES.WORK);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            lastTickRef.current = Date.now();
            interval = setInterval(() => {
                const now = Date.now();
                const delta = Math.floor((now - lastTickRef.current) / 1000);
                if (delta >= 1) {
                    setTimeLeft((prev) => {
                        const newVal = Math.max(0, prev - 1);
                        progress.value = withTiming(newVal / sessionDurationRef.current, {
                            duration: 1000,
                            easing: Easing.linear,
                        });
                        return newVal;
                    });

                    if (currentMode === MODES.WORK) {
                        updateTaskTime(task.id, 1);
                    }
                    lastTickRef.current = now;
                }
            }, 1000);

            // Start breathing animation
            breathing.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );

        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            clearInterval(interval);
            breathing.value = withTiming(1);

            // Vibrate phone
            Vibration.vibrate([0, 500, 250, 500]);

            // Show a notification routed to the correct Android channel
            Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Timer Finished',
                    body: "Good job! You've completed your focus session.",
                    sound: true,
                    ...(Platform.OS === 'android' ? { channelId: 'timer-notifications-v2' } : {}),
                },
                trigger: null,
            });

            Alert.alert('Timer Finished', 'Good job!', [{ text: 'OK' }]);
        } else {
            breathing.value = withTiming(1);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, currentMode, durations]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        const newTime = durations[currentMode] * 60;
        setTimeLeft(newTime);
        sessionDurationRef.current = newTime;
        progress.value = withTiming(1, { duration: 500 });
    };

    // Gesture handler for scroll-to-adjust (analog timer feel)
    const updateTimeFromGesture = useCallback((newSeconds) => {
        setTimeLeft(newSeconds);
    }, []);

    const snapToMinute = useCallback((finalSeconds) => {
        // Snap to nearest minute on release
        const snapped = Math.round(finalSeconds / 60) * 60;
        const clamped = Math.max(60, Math.min(180 * 60, snapped));
        setTimeLeft(clamped);
        sessionDurationRef.current = clamped;
        progress.value = withTiming(1, { duration: 300 });
    }, []);

    const panGesture = useMemo(() => Gesture.Pan()
        .onStart(() => {
            'worklet';
            storedStartTimeSV.value = currentTimeSV.value;
        })
        .onUpdate((e) => {
            'worklet';
            // Fine sensitivity: ~5px per 15 seconds for analog feel
            const secondsDelta = Math.round(-e.translationY / 5) * 15;
            const startTime = storedStartTimeSV.value;
            const newSeconds = Math.max(60, Math.min(180 * 60, startTime + secondsDelta));
            // Update session duration live so progress ring winds/unwinds
            const newDuration = Math.max(startTime, newSeconds);
            progress.value = newSeconds / newDuration;
            runOnJS(updateTimeFromGesture)(newSeconds);
        })
        .onFinalize((e) => {
            'worklet';
            const secondsDelta = Math.round(-e.translationY / 5) * 15;
            const startTime = storedStartTimeSV.value;
            const finalSeconds = Math.max(60, Math.min(180 * 60, startTime + secondsDelta));
            runOnJS(snapToMinute)(finalSeconds);
        })
        .minDistance(5),
        [updateTimeFromGesture, snapToMinute]);

    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Animated Props
    const animatedCircleProps = useAnimatedProps(() => {
        return {
            strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
        };
    });

    const breathingStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: breathing.value }],
        };
    });

    const getModeColor = () => {
        switch (currentMode) {
            case MODES.WORK: return '#6366f1';
            case MODES.SHORT_BREAK: return '#10b981';
            case MODES.LONG_BREAK: return '#3b82f6';
            default: return '#6366f1';
        }
    };



    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#f8fafc" />
                </TouchableOpacity>
                <View style={styles.modeSelector}>
                    <TouchableOpacity onPress={() => { if (!isActive) setCurrentMode(MODES.WORK); }}>
                        <Text style={[styles.modeText, currentMode === MODES.WORK && styles.activeModeText]}>Work</Text>
                    </TouchableOpacity>
                    {showBreaks && (
                        <>
                            <TouchableOpacity onPress={() => { if (!isActive) setCurrentMode(MODES.SHORT_BREAK); }}>
                                <Text style={[styles.modeText, currentMode === MODES.SHORT_BREAK && styles.activeModeText]}>Short</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { if (!isActive) setCurrentMode(MODES.LONG_BREAK); }}>
                                <Text style={[styles.modeText, currentMode === MODES.LONG_BREAK && styles.activeModeText]}>Long</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
                <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconButton}>
                    <Settings size={24} color="#f8fafc" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.taskContainer}>
                    <Text style={styles.taskLabel}>
                        {currentMode === MODES.WORK ? 'Current Task' : 'Take a Break'}
                    </Text>
                    <Text style={styles.taskText}>{task.text}</Text>
                    {currentMode === MODES.WORK && (
                        <View style={styles.totalTimeContainer}>
                            <Clock size={16} color="#94a3b8" />
                            <Text style={styles.totalTimeText}>
                                Total Focus: {formatTime(task.timeSpent || 0)}
                            </Text>
                        </View>
                    )}
                </View>

                <GestureDetector gesture={panGesture}>
                    <Animated.View style={[styles.timerWrapper, breathingStyle]}>
                        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                            <Circle
                                cx={CIRCLE_SIZE / 2}
                                cy={CIRCLE_SIZE / 2}
                                r={RADIUS}
                                stroke="#1e293b"
                                strokeWidth={STROKE_WIDTH}
                                fill="transparent"
                            />
                            <AnimatedCircle
                                cx={CIRCLE_SIZE / 2}
                                cy={CIRCLE_SIZE / 2}
                                r={RADIUS}
                                stroke={getModeColor()}
                                strokeWidth={STROKE_WIDTH}
                                fill="transparent"
                                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                                animatedProps={animatedCircleProps}
                                strokeLinecap="round"
                                rotation="-90"
                                origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
                            />
                        </Svg>
                        <View style={styles.timerTextContainer}>
                            <Text style={styles.timerText}>{formatCountdown(timeLeft)}</Text>
                            <Text style={[styles.timerLabel, { color: getModeColor() }]}>
                                {isActive ? 'FOCUS' : 'PAUSED'}
                            </Text>
                        </View>
                    </Animated.View>
                </GestureDetector>
                {!isActive && (
                    <Text style={styles.scrollHint}>Scroll on timer to adjust</Text>
                )}

                <View style={styles.controls}>
                    <TouchableOpacity
                        onPress={toggleTimer}
                        style={[styles.controlButton, { backgroundColor: getModeColor() }]}
                    >
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
                {isActive && <KeepAwakeWrapper />}
            </View>
            <TimerSettingsModal
                visible={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={saveSettings}
                initialDurations={durations}
                initialShowBreaks={showBreaks}
            />
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
    iconButton: {
        padding: 8,
    },
    modeSelector: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 4,
        gap: 4,
    },
    modeText: {
        color: '#94a3b8',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        fontSize: 12,
        fontWeight: '600',
    },
    activeModeText: {
        backgroundColor: '#334155',
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
    },
    taskContainer: {
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 30,
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
    timerWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    scrollHint: {
        color: '#475569',
        fontSize: 12,
        marginBottom: 30,
        letterSpacing: 1,
    },
    timerTextContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    timerText: {
        color: '#fff',
        fontSize: 56,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    timerLabel: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 4,
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
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#f8fafc',
    },
    settingItem: {
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingLabel: {
        color: '#94a3b8',
        marginBottom: 8,
        fontSize: 14,
    },
    settingInput: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 12,
        color: '#f8fafc',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    soundSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    soundOption: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#334155',
    },
    activeSoundOption: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    soundOptionText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
    },
    activeSoundOptionText: {
        color: '#ffffff',
    },
    saveButton: {
        backgroundColor: '#6366f1',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
