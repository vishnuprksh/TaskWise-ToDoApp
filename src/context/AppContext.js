import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthService from '../services/AuthService';
import * as SyncService from '../services/SyncService';
import { calculatePriorityScore } from '../utils/priority';

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
            setTasks(syncedTasks);
            saveTasks(syncedTasks);
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
        // Diffing logic to sync changes to cloud
        if (user) {
            // Check for added/updated tasks
            newTasks.forEach(newTask => {
                const oldTask = tasks.find(t => t.id === newTask.id);
                if (!oldTask || JSON.stringify(oldTask) !== JSON.stringify(newTask)) {
                    SyncService.saveTaskToCloud(newTask);
                }
            });

            // Check for deleted tasks
            tasks.forEach(oldTask => {
                if (!newTasks.find(t => t.id === oldTask.id)) {
                    SyncService.deleteTaskFromCloud(oldTask.id);
                }
            });
        }

        setTasks(newTasks);
        saveTasks(newTasks);
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
                signOut,
                syncNow,
                updateTasks,
                updateProjects,
                updateTaskTime,
                calculatePriorityScore,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
