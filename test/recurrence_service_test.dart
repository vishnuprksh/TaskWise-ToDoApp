import 'package:flutter_test/flutter_test.dart';
import 'package:taskwise/models/recurrence.dart';
import 'package:taskwise/models/task.dart';
import 'package:taskwise/services/recurrence_service.dart';

Task recurring({
  required DateTime due,
  RecurrenceRule? rule,
  Set<String> completed = const {},
}) => Task(
  id: 'task',
  text: 'Recurring task',
  scheduledAt: due,
  recurrence:
      rule ?? const RecurrenceRule(frequency: RecurrenceFrequency.daily),
  completedOccurrences: completed,
  attributes: Task.defaultAttributes,
);

void main() {
  test('uses a configurable trigger lead time', () {
    final task = recurring(
      due: DateTime(2026, 8, 10),
      rule: const RecurrenceRule(
        frequency: RecurrenceFrequency.daily,
        triggerLeadDays: 3,
      ),
    );

    expect(
      RecurrenceService.statusFor(task, now: DateTime(2026, 8, 6)),
      RecurringTaskStatus.upcoming,
    );
    expect(
      RecurrenceService.statusFor(task, now: DateTime(2026, 8, 7)),
      RecurringTaskStatus.current,
    );
  });

  test('zero lead time triggers on the due date', () {
    final task = recurring(
      due: DateTime(2026, 8, 10),
      rule: const RecurrenceRule(
        frequency: RecurrenceFrequency.daily,
        triggerLeadDays: 0,
      ),
    );

    expect(
      RecurrenceService.statusFor(task, now: DateTime(2026, 8, 9, 23, 59)),
      RecurringTaskStatus.upcoming,
    );
    expect(
      RecurrenceService.statusFor(task, now: DateTime(2026, 8, 10)),
      RecurringTaskStatus.current,
    );
  });

  test('completing an occurrence advances to the next occurrence', () {
    final task = recurring(
      due: DateTime(2026, 8, 10),
      completed: {'2026-08-10'},
    );

    expect(
      RecurrenceService.nextOccurrence(task, DateTime(2026, 8, 10)),
      DateTime(2026, 8, 11),
    );
  });

  test('monthly day outside 28 is invalid by first-version policy', () {
    const rule = RecurrenceRule(
      frequency: RecurrenceFrequency.monthly,
      dayOfMonth: 31,
    );
    expect(rule.isValid, isTrue);
    expect(
      RecurrenceService.isDueOn(
        recurring(due: DateTime(2026, 1, 31), rule: rule),
        DateTime(2026, 2, 28),
      ),
      isFalse,
    );
  });
}
