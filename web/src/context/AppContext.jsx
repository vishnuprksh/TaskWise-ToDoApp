import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import * as AuthService from '../services/AuthService';
import * as SyncService from '../services/SyncService';
import { calculatePriorityScore } from '../utils/priority';
import { isValidDate } from '../utils/time';
import { isSameDay } from 'date-fns';

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
      const sortedSyncedTasks = [...syncedTasks].sort((a, b) => b.priorityScore - a.priorityScore);
      setTasks(sortedSyncedTasks);
      saveTasks(sortedSyncedTasks);
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
              easiness: 'high',
              importance: 'high',
              emergency: 'high',
              interest: 'high',
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
    // Sort tasks by priority score (descending) before saving
    const sortedTasks = [...newTasks].sort((a, b) => b.priorityScore - a.priorityScore);

    if (userRef.current) {
      sortedTasks.forEach((newTask) => {
        const oldTask = tasksRef.current.find((t) => t.id === newTask.id);
        if (!oldTask || JSON.stringify(oldTask) !== JSON.stringify(newTask)) {
          SyncService.saveTaskToCloud(newTask);
        }
      });
      tasksRef.current.forEach((oldTask) => {
        if (!sortedTasks.find((t) => t.id === oldTask.id)) {
          SyncService.deleteTaskFromCloud(oldTask.id);
        }
      });
    }
    setTasks(sortedTasks);
    saveTasks(sortedTasks);
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

  const findNextAvailableSlot = (date, duration) => {
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0); // Default start at 9 AM for future days
    const now = new Date();
    const startTime = isSameDay(date, now) ? now : dayStart; // For today, start from current time; for future days, from 9 AM

    // Get all tasks on this day
    const dayTasks = tasksRef.current.filter(t =>
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

  const updateTaskSchedule = (taskId, date, duration = 60, hasTime = true) => {
    let finalDate = date;
    if (!hasTime && date) {
      // Find next available slot
      finalDate = findNextAvailableSlot(date, duration);
    }

    const newTasks = tasksRef.current.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          scheduledAt: finalDate ? finalDate.toISOString() : null,
          duration,
          isEvent: !!finalDate,
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

  const duplicateTask = (originalTaskId, newDate, duration = 60, hasTime = true) => {
    const originalTask = tasksRef.current.find((t) => t.id === originalTaskId);
    if (!originalTask) return;

    let finalDate = newDate;
    if (!hasTime && newDate) {
      // Find next available slot
      finalDate = findNextAvailableSlot(newDate, duration);
    }

    const newTask = {
      ...originalTask,
      id: Date.now().toString(),
      scheduledAt: finalDate ? finalDate.toISOString() : null,
      duration: duration || originalTask.duration || 60,
      isEvent: !!finalDate,
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
