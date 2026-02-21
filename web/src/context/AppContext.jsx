import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import * as AuthService from '../services/AuthService';
import * as SyncService from '../services/SyncService';
import { calculatePriorityScore } from '../utils/priority';

const AppContext = createContext();

const STORAGE_KEY_TASKS = 'taskwise_tasks';
const STORAGE_KEY_PROJECTS = 'taskwise_projects';

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
  const [authLoading, setAuthLoading] = useState(true);
  const tasksRef = useRef([]);
  const projectsRef = useRef([]);
  const userRef = useRef(null);

  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { projectsRef.current = projects; }, [projects]);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    loadData();
    const subscriber = AuthService.onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  const onAuthStateChanged = async (u) => {
    setUser(u);
    setAuthLoading(false);
    if (u) {
      // Sync once on login
      await doSync();
    }
  };

  const doSync = async () => {
    setIsSyncing(true);
    try {
      const { tasks: syncedTasks, projects: syncedProjects } = await SyncService.syncData(
        tasksRef.current,
        projectsRef.current
      );
      setTasks(syncedTasks);
      saveTasks(syncedTasks);
      setProjects(syncedProjects);
      saveProjects(syncedProjects);
    } catch (error) {
      console.error('Sync failed', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncNow = useCallback(doSync, []);

  const signIn = async () => {
    try {
      await AuthService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed', error);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    await AuthService.signInWithEmail(email, password);
  };

  const signUpWithEmail = async (email, password) => {
    await AuthService.signUpWithEmail(email, password);
  };

  const sendPasswordReset = async (email) => {
    await AuthService.sendPasswordReset(email);
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      setTasks([]);
      setProjects([...DEFAULT_PROJECTS].sort((a, b) => a.name.localeCompare(b.name)));
      localStorage.removeItem(STORAGE_KEY_TASKS);
      localStorage.removeItem(STORAGE_KEY_PROJECTS);
    } catch (error) {
      console.error('Sign out failed', error);
    }
  };

  const loadData = () => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
      const savedProjects = localStorage.getItem(STORAGE_KEY_PROJECTS);

      if (savedTasks) {
        let parsedTasks = JSON.parse(savedTasks);
        parsedTasks = parsedTasks.map((task) => {
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
              priorityScore:
                task.priorityScore !== undefined
                  ? task.priorityScore
                  : calculatePriorityScore(defaultAttributes),
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

  const saveTasks = (newTasks) => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(newTasks));
    } catch (error) {
      console.error('Failed to save tasks', error);
    }
  };

  const saveProjects = (newProjects) => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(newProjects));
    } catch (error) {
      console.error('Failed to save projects', error);
    }
  };

  const updateTasks = (newTasks) => {
    if (userRef.current) {
      newTasks.forEach((newTask) => {
        const oldTask = tasksRef.current.find((t) => t.id === newTask.id);
        if (!oldTask || JSON.stringify(oldTask) !== JSON.stringify(newTask)) {
          SyncService.saveTaskToCloud(newTask);
        }
      });
      tasksRef.current.forEach((oldTask) => {
        if (!newTasks.find((t) => t.id === oldTask.id)) {
          SyncService.deleteTaskFromCloud(oldTask.id);
        }
      });
    }
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const updateProjects = (newProjects) => {
    if (userRef.current) {
      newProjects.forEach((newProject) => {
        const oldProject = projectsRef.current.find((p) => p.id === newProject.id);
        if (!oldProject || JSON.stringify(oldProject) !== JSON.stringify(newProject)) {
          SyncService.saveProjectToCloud(newProject);
        }
      });
      projectsRef.current.forEach((oldProject) => {
        if (!newProjects.find((p) => p.id === oldProject.id)) {
          SyncService.deleteProjectFromCloud(oldProject.id);
        }
      });
    }
    const sortedProjects = [...newProjects].sort((a, b) => a.name.localeCompare(b.name));
    setProjects(sortedProjects);
    saveProjects(sortedProjects);
  };

  const updateTaskTime = (taskId, secondsToAdd) => {
    const newTasks = tasksRef.current.map((t) => {
      if (t.id === taskId) {
        return { ...t, timeSpent: (t.timeSpent || 0) + secondsToAdd };
      }
      return t;
    });
    updateTasks(newTasks);
  };

  const updateTaskSchedule = (taskId, date, duration = 60) => {
    const newTasks = tasksRef.current.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          scheduledAt: date ? date.toISOString() : null,
          duration,
          isEvent: !!date,
        };
      }
      return t;
    });
    updateTasks(newTasks);
  };

  const cancelTaskSchedule = (taskId) => {
    const newTasks = tasksRef.current.map((t) => {
      if (t.id === taskId) {
        return { ...t, scheduledAt: null, duration: 60, isEvent: false };
      }
      return t;
    });
    updateTasks(newTasks);
  };

  const duplicateTask = (originalTaskId, newDate, duration = 60) => {
    const originalTask = tasksRef.current.find((t) => t.id === originalTaskId);
    if (!originalTask) return;

    const newTask = {
      ...originalTask,
      id: Date.now().toString(),
      scheduledAt: newDate ? newDate.toISOString() : null,
      duration: duration || originalTask.duration || 60,
      isEvent: !!newDate,
      completed: false,
    };

    const newTasks = [...tasksRef.current, newTask];
    updateTasks(newTasks);
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        projects,
        user,
        isSyncing,
        authLoading,
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
