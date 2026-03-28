import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { format } from 'date-fns';

// Create a function to load assets for sounds
const getSoundAsset = async () => {
    const asset = Asset.fromModule(require('../../assets/sounds/happy_bells.wav'));
    await asset.downloadAsync();
    return asset;
};

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
        // Default channel
        await Notifications.setNotificationChannelAsync('default', {
            name: 'General',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6366f1',
        });

        // Dedicated channel for 5-min event reminders
        await Notifications.setNotificationChannelAsync('event-reminders', {
            name: 'Event Reminders',
            description: 'Notifications 5 minutes before a scheduled event starts.',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 300, 150, 300],
            lightColor: '#f43f5e',
            sound: 'default',
            enableLights: true,
            enableVibrate: true,
            showBadge: true,
        });

        // Dedicated channel for timer completion with custom sound
        await Notifications.setNotificationChannelAsync('timer-notifications-v2', {
            name: 'Timer Notifications',
            description: 'Alerts for when the Pomodoro timer finishes.',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 250, 500, 250, 500],
            lightColor: '#6366f1',
            sound: null,
            enableLights: true,
            enableVibrate: true,
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Permission not granted for notifications');
        return;
    }

    return token;
};

/**
 * Schedule a notification 5 minutes before an event.
 * @param {string} taskText  - The task/event title
 * @param {Date}   eventDate - The actual start time of the event
 * @returns {string|null} notification identifier
 */
export const scheduleEventReminderNotification = async (taskText, eventDate) => {
    try {
        const triggerDate = new Date(eventDate.getTime() - 5 * 60 * 1000);
        if (triggerDate <= new Date()) return null; // already in the past

        const timeStr = format(eventDate, 'h:mm a');

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: '⏰ Starting soon',
                body: `"${taskText}" starts at ${timeStr} — in 5 minutes.`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.MAX,
                ...(Platform.OS === 'android' && { channelId: 'event-reminders' }),
                data: { taskText, eventDate: eventDate.toISOString() },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
            },
        });
        return id;
    } catch (error) {
        console.error('Error scheduling event reminder notification:', error);
        return null;
    }
};

// Legacy helper kept for backward compatibility
export const scheduleEventNotification = async (title, body, triggerDate) => {
    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                ...(Platform.OS === 'android' && { channelId: 'event-reminders' }),
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
            },
        });
        return id;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
};

export const cancelNotification = async (notificationId) => {
    if (!notificationId) return;
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
        console.error('Error cancelling notification:', error);
    }
};

