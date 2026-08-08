import '../models/recurrence.dart';
import '../models/task.dart';

enum RecurringTaskStatus { upcoming, current, finished }

class RecurrenceService {
  const RecurrenceService._();

  static RecurringTaskStatus statusFor(Task task, {DateTime? now}) {
    final rule = task.recurrence;
    if (rule == null || !rule.isValid || task.scheduledAt == null) {
      return RecurringTaskStatus.finished;
    }

    final current = now ?? DateTime.now();
    final due = nextOccurrence(task, current);
    if (due == null) return RecurringTaskStatus.finished;

    final key = occurrenceKey(due);
    if (task.completedOccurrences.contains(key)) {
      final next = _nextAfter(task, due);
      if (next == null) return RecurringTaskStatus.finished;
      return current.isBefore(_triggerAt(next, rule))
          ? RecurringTaskStatus.upcoming
          : RecurringTaskStatus.current;
    }

    return current.isBefore(_triggerAt(due, rule))
        ? RecurringTaskStatus.upcoming
        : RecurringTaskStatus.current;
  }

  static DateTime? nextOccurrence(Task task, DateTime now) {
    final rule = task.recurrence;
    final anchor = task.scheduledAt;
    if (rule == null || anchor == null || !rule.isValid) return null;

    DateTime? candidate = DateTime(anchor.year, anchor.month, anchor.day);
    DateTime? firstFuture;
    for (var i = 0; i < 10000; i++) {
      if (candidate == null) return firstFuture;
      if (!task.completedOccurrences.contains(occurrenceKey(candidate))) {
        if (!now.isBefore(_triggerAt(candidate, rule))) return candidate;
        firstFuture ??= candidate;
      }
      candidate = _nextAfter(task, candidate);
    }
    return firstFuture;
  }

  static bool isDueOn(Task task, DateTime date) {
    final rule = task.recurrence;
    final anchor = task.scheduledAt;
    if (rule == null || anchor == null || !rule.isValid) return false;
    if (date.isBefore(DateTime(anchor.year, anchor.month, anchor.day)))
      return false;

    switch (rule.frequency) {
      case RecurrenceFrequency.daily:
        return date
                    .difference(DateTime(anchor.year, anchor.month, anchor.day))
                    .inDays %
                rule.interval ==
            0;
      case RecurrenceFrequency.weekly:
        final days = date
            .difference(DateTime(anchor.year, anchor.month, anchor.day))
            .inDays;
        return date.weekday == rule.weekday &&
            days >= 0 &&
            (days ~/ 7) % rule.interval == 0;
      case RecurrenceFrequency.monthly:
        final months =
            (date.year - anchor.year) * 12 + date.month - anchor.month;
        return date.day == rule.dayOfMonth &&
            months >= 0 &&
            months % rule.interval == 0;
    }
  }

  static String occurrenceKey(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  static DateTime _triggerAt(DateTime due, RecurrenceRule rule) => DateTime(
    due.year,
    due.month,
    due.day,
  ).subtract(Duration(days: rule.triggerLeadDays));

  static DateTime? _nextAfter(Task task, DateTime date) =>
      _nextDate(date, task.recurrence!);

  static DateTime? _nextDate(DateTime date, RecurrenceRule rule) {
    switch (rule.frequency) {
      case RecurrenceFrequency.daily:
        return date.add(Duration(days: rule.interval));
      case RecurrenceFrequency.weekly:
        return date.add(Duration(days: 7 * rule.interval));
      case RecurrenceFrequency.monthly:
        final nextMonth = DateTime(date.year, date.month + rule.interval, 1);
        final day = rule.dayOfMonth!;
        final lastDay = DateTime(nextMonth.year, nextMonth.month + 1, 0).day;
        if (day > lastDay) return null;
        return DateTime(nextMonth.year, nextMonth.month, day);
    }
  }
}
