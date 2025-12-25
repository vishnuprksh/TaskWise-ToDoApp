import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const getUserDocRef = () => {
    const user = auth().currentUser;
    if (!user) return null;
    return firestore().collection('users').doc(user.uid);
};

export const syncData = async (localTasks, localProjects) => {
    const userDoc = getUserDocRef();
    if (!userDoc) return { tasks: localTasks, projects: localProjects };

    try {
        // 1. Get cloud data
        const tasksSnapshot = await userDoc.collection('tasks').get();
        const projectsSnapshot = await userDoc.collection('projects').get();

        const cloudTasks = tasksSnapshot.docs.map(doc => doc.data());
        const cloudProjects = projectsSnapshot.docs.map(doc => doc.data());

        // 2. Merge logic (Simple merge: Cloud wins if conflict, or union)
        // For now, let's just use a simple map to merge by ID
        const mergedTasksMap = new Map();
        localTasks.forEach(t => mergedTasksMap.set(t.id, t));
        cloudTasks.forEach(t => mergedTasksMap.set(t.id, t)); // Cloud overwrites local for now

        const mergedProjectsMap = new Map();
        localProjects.forEach(p => mergedProjectsMap.set(p.id, p));
        cloudProjects.forEach(p => mergedProjectsMap.set(p.id, p));

        const mergedTasks = Array.from(mergedTasksMap.values());
        const mergedProjects = Array.from(mergedProjectsMap.values());

        // 3. Upload merged data back to cloud (batch write)
        const batch = firestore().batch();

        mergedTasks.forEach(task => {
            const docRef = userDoc.collection('tasks').doc(task.id);
            batch.set(docRef, task);
        });

        mergedProjects.forEach(project => {
            const docRef = userDoc.collection('projects').doc(project.id);
            batch.set(docRef, project);
        });

        await batch.commit();

        return { tasks: mergedTasks, projects: mergedProjects };

    } catch (error) {
        console.error('Sync Error:', error);
        return { tasks: localTasks, projects: localProjects };
    }
};

export const saveTaskToCloud = async (task) => {
    const userDoc = getUserDocRef();
    if (!userDoc) return;
    try {
        await userDoc.collection('tasks').doc(task.id).set(task);
    } catch (error) {
        console.error('Error saving task to cloud:', error);
    }
};

export const saveProjectToCloud = async (project) => {
    const userDoc = getUserDocRef();
    if (!userDoc) return;
    try {
        await userDoc.collection('projects').doc(project.id).set(project);
    } catch (error) {
        console.error('Error saving project to cloud:', error);
    }
};

export const deleteTaskFromCloud = async (taskId) => {
    const userDoc = getUserDocRef();
    if (!userDoc) return;
    try {
        await userDoc.collection('tasks').doc(taskId).delete();
    } catch (error) {
        console.error('Error deleting task from cloud:', error);
    }
};

export const deleteProjectFromCloud = async (projectId) => {
    const userDoc = getUserDocRef();
    if (!userDoc) return;
    try {
        await userDoc.collection('projects').doc(projectId).delete();
    } catch (error) {
        console.error('Error deleting project from cloud:', error);
    }
};
