import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../models/task.dart';
import 'firestore_service.dart';
import 'notification_service.dart';

class SchedulerService {
  final FirestoreService _firestoreService;

  SchedulerService(this._firestoreService);

  /// Updates a task's schedule (date, start time, and duration)
  /// Also schedules a 5-minute reminder notification
  Future<void> updateTaskSchedule(
    String taskId,
    DateTime date,
    TimeOfDay startTime,
    int durationMinutes,
  ) async {
    final scheduledAt = DateTime(
      date.year,
      date.month,
      date.day,
      startTime.hour,
      startTime.minute,
    );

    await _firestoreService.updateTask(taskId, {
      'scheduledAt': scheduledAt,
      'scheduledDuration': durationMinutes,
    });

    // Schedule reminder notification for 5 minutes before
    try {
      final notificationService = NotificationService();
      await notificationService.scheduleReminder(
        id: taskId.hashCode,
        title: 'Task Reminder',
        body: 'Your scheduled task is starting in 5 minutes',
        scheduledTime: scheduledAt,
        minutesBefore: 5,
      );
    } catch (e) {
      print('Error scheduling notification: $e');
    }
  }

  /// Finds the next available time slot to avoid conflicts
  /// Returns a TimeOfDay for the next available slot on the given date
  Future<TimeOfDay?> findNextAvailableSlot(
    DateTime date,
    int durationMinutes,
    List<Task> scheduledTasks,
  ) async {
    final dayStart = DateTime(date.year, date.month, date.day);
    const dayEnd = Duration(hours: 24);
    final dayEndTime = dayStart.add(dayEnd);

    // Get tasks scheduled on this date
    final tasksOnDate = scheduledTasks.where((task) {
      if (task.scheduledAt == null) return false;
      return _isSameDay(task.scheduledAt!, date);
    }).toList();

    // Sort by start time
    tasksOnDate.sort((a, b) => a.scheduledAt!.compareTo(b.scheduledAt!));

    // Find first available slot starting from 00:00
    DateTime currentSlot = dayStart;

    for (final task in tasksOnDate) {
      final taskEnd = task.scheduledAt!.add(
        Duration(minutes: task.scheduledDuration ?? 60),
      );

      // Check if current slot fits before this task
      final slotEnd = currentSlot.add(Duration(minutes: durationMinutes));
      if (slotEnd.isBefore(task.scheduledAt!) || slotEnd.isAtSameMomentAs(task.scheduledAt!)) {
        // Found available slot
        return TimeOfDay(hour: currentSlot.hour, minute: currentSlot.minute);
      }

      // Move to after this task
      currentSlot = taskEnd;
    }

    // Check if there's space at the end of the day
    final slotEnd = currentSlot.add(Duration(minutes: durationMinutes));
    if (slotEnd.isBefore(dayEndTime) || slotEnd.isAtSameMomentAs(dayEndTime)) {
      return TimeOfDay(hour: currentSlot.hour, minute: currentSlot.minute);
    }

    return null; // No available slot found
  }

  /// Gets all tasks scheduled for a specific date
  List<Task> getTasksForDate(DateTime date, List<Task> allTasks) {
    return allTasks.where((task) {
      if (task.scheduledAt == null) return false;
      return _isSameDay(task.scheduledAt!, date);
    }).toList()
      ..sort((a, b) => a.scheduledAt!.compareTo(b.scheduledAt!));
  }

  /// Calculates the vertical position and height for event rendering
  /// Returns {top: pixels from top, height: pixels for duration}
  /// Each hour = 80 pixels
  Map<String, double> calculateEventPosition(
    DateTime scheduledAt,
    int durationMinutes,
  ) {
    const pixelsPerHour = 80.0;
    const pixelsPerMinute = pixelsPerHour / 60;

    final hour = scheduledAt.hour;
    final minute = scheduledAt.minute;

    final topOffset = (hour * pixelsPerHour) + (minute * pixelsPerMinute);
    final height = durationMinutes * pixelsPerMinute;

    return {
      'top': topOffset,
      'height': height.clamp(40.0, double.infinity), // Min height 40px
    };
  }

  /// Routes conflicting events when dragging
  /// Returns the new time if there's a conflict, otherwise null
  TimeOfDay? getConflictResolution(
    DateTime newDateTime,
    int durationMinutes,
    List<Task> tasksOnDay,
    String excludeTaskId,
  ) {
    final newEnd = newDateTime.add(Duration(minutes: durationMinutes));

    // Check for conflicts with other tasks
    for (final task in tasksOnDay) {
      if (task.id == excludeTaskId || task.scheduledAt == null) continue;

      final taskEnd = task.scheduledAt!.add(
        Duration(minutes: task.scheduledDuration ?? 60),
      );

      // Check if there's an overlap
      if ((newDateTime.isBefore(taskEnd) || newDateTime.isAtSameMomentAs(taskEnd)) &&
          (newEnd.isAfter(task.scheduledAt!) || newEnd.isAtSameMomentAs(task.scheduledAt!))) {
        // Conflict detected, return next available slot
        return TimeOfDay(hour: taskEnd.hour, minute: taskEnd.minute);
      }
    }

    return null; // No conflict
  }

  /// Helper to check if two dates are the same day
  bool _isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
        date1.month == date2.month &&
        date1.day == date2.day;
  }

  /// Format time for display (e.g., "14:30")
  String formatTime(DateTime dateTime) {
    return DateFormat('HH:mm').format(dateTime);
  }

  /// Format duration for display (e.g., "1h 30m")
  String formatDuration(int minutes) {
    if (minutes < 60) {
      return '${minutes}m';
    }
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (mins == 0) {
      return '${hours}h';
    }
    return '${hours}h ${mins}m';
  }
}

// Riverpod provider for SchedulerService
final schedulerServiceProvider = Provider((ref) {
  final firestoreService = ref.watch(firestoreServiceProvider);
  return SchedulerService(firestoreService);
});

// Provider for tasks on a specific date
final tasksForDateProvider = FutureProvider.family<List<Task>, DateTime>((ref, date) async {
  final tasks = await ref.watch(tasksProvider.future);
  final schedulerService = ref.watch(schedulerServiceProvider);
  return schedulerService.getTasksForDate(date, tasks);
});

// Helper TimeOfDay extension for convenience
extension TimeOfDayExtension on TimeOfDay {
  DateTime toDateTime(DateTime date) {
    return DateTime(date.year, date.month, date.day, hour, minute);
  }
}
