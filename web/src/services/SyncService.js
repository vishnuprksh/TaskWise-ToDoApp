import {
  collection,
  doc,
  getDocs,
  writeBatch,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from './FirebaseConfig';

const getUserDocRef = () => {
  const user = auth.currentUser;
  if (!user) return null;
  return doc(db, 'users', user.uid);
};

export const syncData = async (localTasks, localProjects) => {
  const userDocRef = getUserDocRef();
  if (!userDocRef) return { tasks: localTasks, projects: localProjects };

  try {
    const tasksSnapshot = await getDocs(collection(userDocRef, 'tasks'));
    const projectsSnapshot = await getDocs(collection(userDocRef, 'projects'));

    const cloudTasks = tasksSnapshot.docs.map((d) => d.data());
    const cloudProjects = projectsSnapshot.docs.map((d) => d.data());

    const mergedTasksMap = new Map();
    localTasks.forEach((t) => mergedTasksMap.set(t.id, t));
    cloudTasks.forEach((t) => mergedTasksMap.set(t.id, t));

    const mergedProjectsMap = new Map();
    localProjects.forEach((p) => mergedProjectsMap.set(p.id, p));
    cloudProjects.forEach((p) => mergedProjectsMap.set(p.id, p));

    const mergedTasks = Array.from(mergedTasksMap.values());
    const mergedProjects = Array.from(mergedProjectsMap.values());

    const batch = writeBatch(db);
    mergedTasks.forEach((task) => {
      const taskDocRef = doc(userDocRef, 'tasks', task.id);
      batch.set(taskDocRef, task);
    });
    mergedProjects.forEach((project) => {
      const projectDocRef = doc(userDocRef, 'projects', project.id);
      batch.set(projectDocRef, project);
    });
    await batch.commit();

    return { tasks: mergedTasks, projects: mergedProjects };
  } catch (error) {
    console.error('Sync Error:', error);
    return { tasks: localTasks, projects: localProjects };
  }
};

export const saveTaskToCloud = async (task) => {
  const userDocRef = getUserDocRef();
  if (!userDocRef) return;
  try {
    await setDoc(doc(userDocRef, 'tasks', task.id), task);
  } catch (error) {
    console.error('Error saving task to cloud:', error);
  }
};

export const saveProjectToCloud = async (project) => {
  const userDocRef = getUserDocRef();
  if (!userDocRef) return;
  try {
    await setDoc(doc(userDocRef, 'projects', project.id), project);
  } catch (error) {
    console.error('Error saving project to cloud:', error);
  }
};

export const deleteTaskFromCloud = async (taskId) => {
  const userDocRef = getUserDocRef();
  if (!userDocRef) return;
  try {
    await deleteDoc(doc(userDocRef, 'tasks', taskId));
  } catch (error) {
    console.error('Error deleting task from cloud:', error);
  }
};

export const deleteProjectFromCloud = async (projectId) => {
  const userDocRef = getUserDocRef();
  if (!userDocRef) return;
  try {
    await deleteDoc(doc(userDocRef, 'projects', projectId));
  } catch (error) {
    console.error('Error deleting project from cloud:', error);
  }
};
