import 'package:home_widget/home_widget.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'firestore_service.dart';
import '../models/task.dart';
import '../models/project.dart';
import 'dart:convert';
import 'package:flutter/widgets.dart';

@pragma('vm:entry-point')
Future<void> backgroundCallback(Uri? uri) async {
  if (uri?.host.toLowerCase() == 'startpomodoro') {
    final taskId = uri?.queryParameters['taskId'];
    print('WidgetService Background: Starting Pomodoro for $taskId');
    // Here we would ideally trigger the app's timer logic.
    // For now, let's save the 'active_task_id' to shared prefs so the app picks it up on launch.
    await HomeWidget.saveWidgetData<String>('auto_start_task_id', taskId);
  }
}

class WidgetService {
  static const String _groupId = 'group.com.BrightTomorrow.TaskWise'; // For iOS
  static const String _androidWidgetName = 'TaskWidgetProvider';
  static const String _scheduleWidgetName = 'ScheduleWidgetProvider';
  
  static Future<void> updateTasks(List<Task> tasks) async {
    final allTasks = tasks.map((t) => {
      'id': t.id,
      'text': t.text,
      'completed': t.completed,
      'priority': t.attributes['importance'] ?? 'medium',
      'priorityScore': t.priorityScore,
      'projectId': t.projectId,
    }).toList();

    final jsonString = jsonEncode(allTasks);
    await HomeWidget.saveWidgetData<String>('tasks_json', jsonString);
    await _updateWidget();
    
    // Also update schedule if needed
    final scheduledTasks = tasks.where((t) => t.scheduledAt != null && !t.completed).toList();
    await updateSchedule(scheduledTasks);
  }

  static Future<void> updateSchedule(List<Task> tasks) async {
    final scheduleItems = tasks.map((t) => {
      'id': t.id,
      'text': t.text,
      'scheduledAt': t.scheduledAt?.toIso8601String(),
      'duration': t.scheduledDuration,
      'projectId': t.projectId,
    }).toList();

    await HomeWidget.saveWidgetData<String>('schedule_json', jsonEncode(scheduleItems));
    await _updateScheduleWidget();
  }

  static Future<void> updateProjects(List<dynamic> projects) async {
    final projectData = projects.map((p) => {
      'id': p.id,
      'name': p.name,
      // Project.color is stored as a hex string (for example, '#3b82f6'),
      // not as a Flutter Color. Convert it to the ARGB integer expected by
      // the native widget without calling `.value` on the string.
      'color': _colorToArgb(p.color),
    }).toList();
    
    // Add "All Tasks" option
    projectData.insert(0, {'id': 'all', 'name': 'All Tasks'});

    await HomeWidget.saveWidgetData<String>('projects_json', jsonEncode(projectData));
    await _updateWidget();
    await _updateScheduleWidget();
  }

  static int _colorToArgb(Object? color) {
    if (color is int) return color;
    if (color is Color) return color.value;
    if (color is String) {
      final hex = color.replaceFirst('#', '');
      final normalized = hex.length == 6 ? 'FF$hex' : hex;
      final parsed = int.tryParse(normalized, radix: 16);
      if (parsed != null) return parsed;
    }
    return 0xFF000000;
  }

  static Future<void> updateTimer({
    required int timeLeft,
    required bool isActive,
    required String taskText,
  }) async {
    await HomeWidget.saveWidgetData<int>('timer_seconds', timeLeft);
    await HomeWidget.saveWidgetData<bool>('timer_active', isActive);
    await HomeWidget.saveWidgetData<String>('timer_task', taskText);
    await _updateWidget();
    // Schedule widget might want to show timer progress too
    await _updateScheduleWidget();
  }

  static Future<void> _updateWidget() async {
    await HomeWidget.updateWidget(
      name: _androidWidgetName,
      androidName: _androidWidgetName,
      iOSName: 'TaskWidget',
    );
  }

  static Future<void> _updateScheduleWidget() async {
    await HomeWidget.updateWidget(
      name: _scheduleWidgetName,
      androidName: _scheduleWidgetName,
      iOSName: 'ScheduleWidget',
    );
  }
}

final widgetSyncProvider = Provider((ref) {
  // Register background callback once
  HomeWidget.registerBackgroundCallback(backgroundCallback);

  // Sync tasks - exclude tasks belonging to archived projects
  ref.listen<AsyncValue<List<Task>>>(tasksProvider, (previous, next) {
    if (next is AsyncData<List<Task>>) {
      final projects = ref.read(projectsProvider).value ?? [];
      final archivedProjectIds = projects
          .where((p) => p.archived)
          .map((p) => p.id)
          .toSet();
      final activeTasks = next.value
          .where((t) => t.projectId == null || !archivedProjectIds.contains(t.projectId))
          .toList();
      WidgetService.updateTasks(activeTasks);
    }
  });

  // Sync projects - exclude archived projects
  ref.listen<AsyncValue<List<Project>>>(projectsProvider, (previous, next) {
    if (next is AsyncData<List<Project>>) {
      final activeProjects = next.value.where((p) => !p.archived).toList();
      WidgetService.updateProjects(activeProjects);
    }
  });

  return null;
});
