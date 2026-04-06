import 'package:home_widget/home_widget.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/task.dart';
import 'firestore_service.dart';
import 'dart:convert';

class WidgetService {
  static const String _groupId = 'group.com.BrightTomorrow.TaskWise'; // For iOS
  static const String _androidWidgetName = 'TaskWidgetProvider';

  static Future<void> updateTasks(List<Task> tasks) async {
    final topTasks = tasks.take(3).map((t) => {
      'id': t.id,
      'text': t.text,
      'completed': t.completed,
      'priority': t.attributes['importance'] ?? 'medium',
    }).toList();

    await HomeWidget.saveWidgetData<String>('tasks_json', jsonEncode(topTasks));
    await _updateWidget();
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
  }

  static Future<void> _updateWidget() async {
    await HomeWidget.updateWidget(
      name: _androidWidgetName,
      androidName: _androidWidgetName,
      iOSName: 'TaskWidget',
    );
  }

  static void initializeTaskListener(WidgetRef ref) {
    ref.listen<AsyncValue<List<Task>>>(tasksProvider, (previous, next) {
      if (next is AsyncData<List<Task>>) {
        updateTasks(next.value);
      }
    });
  }
}
