import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthService from '../services/AuthService';
import * as SyncService from '../services/SyncService';
import * as NotificationService from '../services/NotificationService';
import { calculatePriorityScore } from '../utils/priority';
import { isValidDate } from '../utils/time';
import { subMinutes, parseISO, isSameDay } from 'date-fns';

const AppContext = createContext();

const STORAGE_KEY_TASKS = '@taskwise_tasks';
const STORAGE_KEY_PROJECTS = '@taskwise_projects';

const DEFAULT_PROJECTS = [
    { id: '1', name: 'Personal', color: '#3b82f6', archived: false },
    { id: '2', name: 'Work', color: '#10b981', archived: false },
    { id: '3', name: 'Shopping', color: '#f59e0b', archived: false },
];

export const AppProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        NotificationService.registerForPushNotificationsAsync();
        loadData();
        const subscriber = AuthService.onAuthStateChanged(onAuthStateChanged);
        return subscriber; // unsubscribe on unmount
    }, []);

    const onAuthStateChanged = async (user) => {
        setUser(user);
        if (user) {
            await syncNow();
        }
    };

    const syncNow = async () => {
        if (!user) return;
        setIsSyncing(true);
        try {
            // We need to pass the CURRENT state, but state updates might be pending.
            // Ideally we read from ref or trust the current 'tasks' state if it's up to date.
            // For safety, we can re-read from AsyncStorage or just use state.
            // Let's use state for now.
            const { tasks: syncedTasks, projects: syncedProjects } = await SyncService.syncData(tasks, projects);

            // Update local state and storage with synced data
            const sortedSyncedTasks = [...syncedTasks].sort((a, b) => b.priorityScore - a.priorityScore);
            setTasks(sortedSyncedTasks);
            saveTasks(sortedSyncedTasks);
            setProjects(syncedProjects);
            saveProjects(syncedProjects);
        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            setIsSyncing(false);
        }
    };

    const signIn = async () => {
        try {
            await AuthService.signInWithGoogle();
        } catch (error) {
            console.error("Sign in failed", error);
            throw error;
        }
    };

    const signInWithEmail = async (email, password) => {
        try {
            await AuthService.signInWithEmail(email, password);
        } catch (error) {
            throw error;
        }
    };

    const signUpWithEmail = async (email, password) => {
        try {
            await AuthService.signUpWithEmail(email, password);
        } catch (error) {
            throw error;
        }
    };

    const sendPasswordReset = async (email) => {
        try {
            await AuthService.sendPasswordReset(email);
        } catch (error) {
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await AuthService.signOut();
            // Clear local data on sign out
            setTasks([]);
            setProjects([...DEFAULT_PROJECTS].sort((a, b) => a.name.localeCompare(b.name)));
            await AsyncStorage.removeItem(STORAGE_KEY_TASKS);
            await AsyncStorage.removeItem(STORAGE_KEY_PROJECTS);
        } catch (error) {
            console.error("Sign out failed", error);
        }
    };

    const loadData = async () => {
        try {
            const savedTasks = await AsyncStorage.getItem(STORAGE_KEY_TASKS);
            const savedProjects = await AsyncStorage.getItem(STORAGE_KEY_PROJECTS);

            if (savedTasks) {
                let parsedTasks = JSON.parse(savedTasks);
                // Migration for old tasks
                parsedTasks = parsedTasks.map(task => {
                    if (!task.attributes || task.priorityScore === undefined || task.timeSpent === undefined) {
                        const defaultAttributes = {
                            easiness: task.attributes?.size || 'medium',
                            importance: 'medium',
                            emergency: 'medium',
                            interest: 'medium',
                        };
                        return {
                            ...task,
                            attributes: task.attributes || defaultAttributes,
                            priorityScore: task.priorityScore !== undefined ? task.priorityScore : calculatePriorityScore(defaultAttributes),
                            projectId: task.projectId || null,
                            timeSpent: task.timeSpent || 0,
                        };
                    }
                    return task;
                });
                // Sort tasks by priority score (descending)
                parsedTasks.sort((a, b) => b.priorityScore - a.priorityScore);
                setTasks(parsedTasks);
            }

            if (savedProjects) {
                const parsedProjects = JSON.parse(savedProjects);
                parsedProjects.sort((a, b) => a.name.localeCompare(b.name));
                setProjects(parsedProjects);
            } else {
                const sortedDefault = [...DEFAULT_PROJECTS].sort((a, b) => a.name.localeCompare(b.name));
                setProjects(sortedDefault);
                saveProjects(sortedDefault);
            }
        } catch (error) {
            console.error('Failed to load data', error);
        }
    };

    const saveTasks = async (newTasks) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(newTasks));
        } catch (error) {
            console.error('Failed to save tasks', error);
        }
    };

    const saveProjects = async (newProjects) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(newProjects));
        } catch (error) {
            console.error('Failed to save projects', error);
        }
    };

    const updateTasks = (newTasks) => {
        // Sort tasks by priority score (descending) before saving
        const sortedTasks = [...newTasks].sort((a, b) => b.priorityScore - a.priorityScore);

        // Diffing logic to sync changes to cloud
        if (user) {
            // Check for added/updated tasks
            sortedTasks.forEach(newTask => {
                const oldTask = tasks.find(t => t.id === newTask.id);
                if (!oldTask || JSON.stringify(oldTask) !== JSON.stringify(newTask)) {
                    SyncService.saveTaskToCloud(newTask);
                }
            });

            // Check for deleted tasks
            tasks.forEach(oldTask => {
                if (!sortedTasks.find(t => t.id === oldTask.id)) {
                    SyncService.deleteTaskFromCloud(oldTask.id);
                }
            });
        }

        setTasks(sortedTasks);
        saveTasks(sortedTasks);
    };

    const updateProjects = (newProjects) => {
        // Diffing logic for projects
        if (user) {
            newProjects.forEach(newProject => {
                const oldProject = projects.find(p => p.id === newProject.id);
                if (!oldProject || JSON.stringify(oldProject) !== JSON.stringify(newProject)) {
                    SyncService.saveProjectToCloud(newProject);
                }
            });

            projects.forEach(oldProject => {
                if (!newProjects.find(p => p.id === oldProject.id)) {
                    SyncService.deleteProjectFromCloud(oldProject.id);
                }
            });
        }

        const sortedProjects = [...newProjects].sort((a, b) => a.name.localeCompare(b.name));
        setProjects(sortedProjects);
        saveProjects(sortedProjects);
    };

    const updateTaskTime = (taskId, secondsToAdd) => {
        const newTasks = tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, timeSpent: (t.timeSpent || 0) + secondsToAdd };
            }
            return t;
        });
        updateTasks(newTasks);
    };

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

    const updateTaskSchedule = async (taskId, date, duration = 60, hasTime = true) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        let finalDate = date;
        if (!hasTime && date) {
            // Find next available slot
            finalDate = findNextAvailableSlot(date, duration);
        }

        // Cancel existing notification if any
        if (task.notificationId) {
            await NotificationService.cancelNotification(task.notificationId);
        }

        // Schedule new notification 5 minutes before
        let notificationId = null;
        if (finalDate) {
            notificationId = await NotificationService.scheduleEventReminderNotification(
                task.text,
                new Date(finalDate)
            );
        }

        const newTasks = tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    scheduledAt: finalDate ? finalDate.toISOString() : null,
                    duration,
                    notificationId,
                    isEvent: !!finalDate
                };
            }
            return t;
        });
        updateTasks(newTasks);
    };

    const cancelTaskSchedule = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        if (task.notificationId) {
            await NotificationService.cancelNotification(task.notificationId);
        }

        const newTasks = tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    scheduledAt: null,
                    duration: 60,
                    notificationId: null,
                    isEvent: false
                };
            }
            return t;
        });
        updateTasks(newTasks);
    };

    const duplicateTask = async (originalTaskId, newDate, duration = 60, hasTime = true) => {
        const originalTask = tasks.find(t => t.id === originalTaskId);
        if (!originalTask) return;

        let finalDate = newDate;
        if (!hasTime && newDate) {
            // Find next available slot
            finalDate = findNextAvailableSlot(newDate, duration);
        }

        // Schedule notification for the new task
        let notificationId = null;
        if (finalDate) {
            notificationId = await NotificationService.scheduleEventReminderNotification(
                originalTask.text,
                new Date(finalDate)
            );
        }

        const newTask = {
            ...originalTask,
            id: Date.now().toString(),
            scheduledAt: finalDate ? finalDate.toISOString() : null,
            duration: duration || originalTask.duration || 60,
            notificationId,
            isEvent: !!finalDate,
            // Reset completion if desired, or keep as is? Usually duplicate implies a new todo
            completed: false,
        };

        const newTasks = [...tasks, newTask];
        // Sort by priority or date? updateTasks might not sort, key logic handles it
        updateTasks(newTasks);
    };

    return (
        <AppContext.Provider
            value={{
                tasks,
                projects,
                user,
                isSyncing,
                signIn,
                signInWithEmail,
                signUpWithEmail,
                sendPasswordReset,
                signOut,
                syncNow,
                updateTasks,
                updateProjects,
                updateTaskTime,
                updateTaskSchedule,
                cancelTaskSchedule,
                duplicateTask,
                calculatePriorityScore,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
