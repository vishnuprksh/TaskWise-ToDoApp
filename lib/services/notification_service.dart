import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  static bool _initialized = false;

  factory NotificationService() {
    return _instance;
  }

  NotificationService._internal();

  /// Initialize notifications
  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;
    print('NotificationService initialized');
  }

  /// Schedule a reminder notification (MVP: just logs for now)
  Future<void> scheduleReminder({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledTime,
    int minutesBefore = 5,
  }) async {
    final reminderTime = scheduledTime.subtract(Duration(minutes: minutesBefore));
    print('Reminder scheduled for $title at $reminderTime');
  }

  /// Show an immediate notification (MVP: just logs)
  Future<void> showNotification({
    required int id,
    required String title,
    required String body,
  }) async {
    print('Notification: $title - $body');
  }
}
