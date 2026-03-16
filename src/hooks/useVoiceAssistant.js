import { useState, useEffect, useCallback } from 'react';
import Voice from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import { parseCommand, COMMAND_TYPES } from '../utils/nlpUtils';

export const useVoiceAssistant = (onCommand) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        Voice.onSpeechStart = () => setIsListening(true);
        Voice.onSpeechEnd = () => setIsListening(false);
        Voice.onSpeechError = (e) => {
            console.error('Speech Error:', e);
            setError(e.error);
            setIsListening(false);
        };
        Voice.onSpeechResults = (e) => {
            if (e.value && e.value.length > 0) {
                const result = e.value[0];
                setTranscript(result);
                handleResult(result);
            }
        };

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, [handleResult]);

    const handleResult = useCallback((text) => {
        const command = parseCommand(text);
        if (command.type !== COMMAND_TYPES.UNKNOWN) {
            provideFeedback(command.type);
            if (onCommand) onCommand(command);
        }
    }, [onCommand]);

    const provideFeedback = (commandType) => {
        let message = '';
        switch (commandType) {
            case COMMAND_TYPES.START_POMODORO:
                message = 'Starting your Pomodoro session. Happy focusing!';
                break;
            case COMMAND_TYPES.STOP_TIMER:
                message = 'Stopping the timer.';
                break;
            case COMMAND_TYPES.PAUSE_TIMER:
                message = 'Timer paused.';
                break;
            case COMMAND_TYPES.RESUME_TIMER:
                message = 'Resuming your session.';
                break;
            case COMMAND_TYPES.RESET_TIMER:
                message = 'Resetting the timer to default.';
                break;
            case COMMAND_TYPES.SHOW_TASKS:
                message = 'Opening your task list.';
                break;
            default:
                message = 'I heard you, but I am not sure how to help with that.';
        }
        Speech.speak(message);
    };

    const startListening = async () => {
        try {
            setError(null);
            setTranscript('');
            await Voice.start('en-US');
        } catch (e) {
            console.error('Start Listening Error:', e);
            setError(e);
        }
    };

    const stopListening = async () => {
        try {
            await Voice.stop();
        } catch (e) {
            console.error('Stop Listening Error:', e);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        toggleListening,
    };
};
