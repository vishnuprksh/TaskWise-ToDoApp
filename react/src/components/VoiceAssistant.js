import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
    Dimensions,
    DeviceEventEmitter,
} from 'react-native';
import { Mic, X } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSpring,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { useNavigation } from '@react-navigation/native';
import { COMMAND_TYPES } from '../utils/nlpUtils';

const { width } = Dimensions.get('window');

const VoiceAssistant = () => {
    const navigation = useNavigation();
    const pulse = useSharedValue(1);

    const handleCommand = (command) => {
        switch (command.type) {
            case COMMAND_TYPES.SHOW_TASKS:
                navigation.navigate('Home');
                break;
            // Timer commands will be handled by the screen if it's active, 
            // or we could potentially navigate to Timer screen here.
            case COMMAND_TYPES.START_POMODORO:
                // We'll navigate to Timer screen for the first task or default
                // This is a simplified logic
                navigation.navigate('Timer', { task: { id: 'default', text: 'Voice Session' } });
                DeviceEventEmitter.emit('timer-command', { type: command.type });
                break;
            case COMMAND_TYPES.STOP_TIMER:
            case COMMAND_TYPES.PAUSE_TIMER:
            case COMMAND_TYPES.RESUME_TIMER:
            case COMMAND_TYPES.RESET_TIMER:
                DeviceEventEmitter.emit('timer-command', { type: command.type });
                break;
        }
    };

    const {
        isListening,
        transcript,
        toggleListening,
    } = useVoiceAssistant(handleCommand);

    useEffect(() => {
        if (isListening) {
            pulse.value = withRepeat(
                withTiming(1.5, { duration: 1000 }),
                -1,
                true
            );
        } else {
            pulse.value = withSpring(1);
        }
    }, [isListening]);

    const pulseStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: pulse.value }],
            opacity: interpolate(pulse.value, [1, 1.5], [0.5, 0], Extrapolate.CLAMP),
        };
    });

    return (
        <View style={styles.container} pointerEvents="box-none">
            {isListening && (
                <View style={styles.transcriptContainer}>
                    <Text style={styles.transcriptText}>
                        {transcript || 'Listening...'}
                    </Text>
                </View>
            )}

            <View style={styles.buttonContainer}>
                <Animated.View style={[styles.pulseCircle, pulseStyle]} />
                <TouchableOpacity
                    onPress={toggleListening}
                    style={[styles.micButton, isListening && styles.micButtonActive]}
                >
                    {isListening ? (
                        <X size={24} color="#fff" />
                    ) : (
                        <Mic size={24} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    micButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6366f1',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    micButtonActive: {
        backgroundColor: '#ef4444',
    },
    pulseCircle: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6366f1',
    },
    transcriptContainer: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginRight: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    transcriptText: {
        color: '#f8fafc',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default VoiceAssistant;
