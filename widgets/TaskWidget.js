import React from 'react';
import {
    FlexWidget,
    TextWidget,
    ListWidget,
} from 'react-native-android-widget';

export function TaskWidget({ tasks, projects, selectedProjectId }) {
    const selectedProject = projects.find(p => p.id === selectedProjectId) || { name: 'All', color: '#6366f1' };

    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: '#0f172a',
                borderRadius: 16,
                padding: 12,
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                }}
            >
                <TextWidget
                    text={selectedProject.name}
                    style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: selectedProject.color || '#f8fafc',
                    }}
                />
                <FlexWidget
                    clickAction="OPEN_APP"
                    style={{
                        backgroundColor: '#334155',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                    }}
                >
                    <TextWidget
                        text="Open"
                        style={{
                            fontSize: 12,
                            color: '#f8fafc',
                        }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* Project Selector (Simplified for widget) */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    marginBottom: 8,
                    gap: 4,
                }}
            >
                {projects.slice(0, 3).map(p => (
                    <FlexWidget
                        key={p.id}
                        clickAction="SWITCH_PROJECT"
                        clickActionData={{ projectId: p.id }}
                        style={{
                            backgroundColor: p.id === selectedProjectId ? p.color : '#1e293b',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 10,
                            marginRight: 4,
                        }}
                    >
                        <TextWidget
                            text={p.name.substring(0, 6)}
                            style={{
                                fontSize: 10,
                                color: p.id === selectedProjectId ? '#fff' : '#94a3b8',
                            }}
                        />
                    </FlexWidget>
                ))}
            </FlexWidget>

            {/* Task List */}
            <ListWidget
                style={{
                    flex: 1,
                }}
            >
                {tasks.length > 0 ? (
                    tasks.map(task => (
                        <FlexWidget
                            key={task.id}
                            style={{
                                backgroundColor: '#1e293b',
                                padding: 8,
                                borderRadius: 8,
                                marginBottom: 4,
                            }}
                        >
                            <TextWidget
                                text={task.text}
                                style={{
                                    fontSize: 14,
                                    color: task.completed ? '#64748b' : '#f1f5f9',
                                    textDecorationLine: task.completed ? 'line-through' : 'none',
                                }}
                            />
                        </FlexWidget>
                    ))
                ) : (
                    <TextWidget
                        text="No tasks found"
                        style={{
                            fontSize: 14,
                            color: '#94a3b8',
                            textAlign: 'center',
                            marginTop: 20,
                        }}
                    />
                )}
            </ListWidget>
        </FlexWidget>
    );
}
