import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaskWidget } from './TaskWidget';

const STORAGE_KEY_TASKS = '@taskwise_tasks';
const STORAGE_KEY_PROJECTS = '@taskwise_projects';
const STORAGE_KEY_WIDGET_PROJECT = '@taskwise_widget_selected_project';

export async function widgetTaskHandler(props) {
    const { widgetName, action, clickActionData } = props;

    let selectedProjectId = await AsyncStorage.getItem(STORAGE_KEY_WIDGET_PROJECT);

    if (action === 'SWITCH_PROJECT' && clickActionData?.projectId) {
        selectedProjectId = clickActionData.projectId;
        await AsyncStorage.setItem(STORAGE_KEY_WIDGET_PROJECT, selectedProjectId);
    }

    const tasksJson = await AsyncStorage.getItem(STORAGE_KEY_TASKS);
    const projectsJson = await AsyncStorage.getItem(STORAGE_KEY_PROJECTS);

    const allTasks = tasksJson ? JSON.parse(tasksJson) : [];
    const projects = projectsJson ? JSON.parse(projectsJson) : [];

    if (!selectedProjectId && projects.length > 0) {
        selectedProjectId = projects[0].id;
    }

    const filteredTasks = allTasks.filter(t => t.projectId === selectedProjectId && !t.completed);

    props.renderWidget(
        <TaskWidget
            tasks={filteredTasks.slice(0, 5)}
            projects={projects}
            selectedProjectId={selectedProjectId}
        />
    );
}
