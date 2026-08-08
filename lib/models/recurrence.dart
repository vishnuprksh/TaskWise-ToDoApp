import 'package:cloud_firestore/cloud_firestore.dart';

enum RecurrenceFrequency { daily, weekly, monthly }

class RecurrenceRule {
  static const defaultTriggerLeadDays = 1;

  final RecurrenceFrequency frequency;
  final int interval;
  final int? weekday; // DateTime weekday, used by weekly recurrence.
  final int? dayOfMonth; // Used by monthly recurrence.
  final int triggerLeadDays;

  const RecurrenceRule({
    required this.frequency,
    this.interval = 1,
    this.weekday,
    this.dayOfMonth,
    this.triggerLeadDays = defaultTriggerLeadDays,
  });

  bool get isValid {
    if (interval < 1 || triggerLeadDays < 0) return false;
    if (frequency == RecurrenceFrequency.weekly &&
        (weekday == null || weekday! < 1 || weekday! > 7)) {
      return false;
    }
    if (frequency == RecurrenceFrequency.monthly &&
        (dayOfMonth == null || dayOfMonth! < 1 || dayOfMonth! > 31)) {
      return false;
    }
    return true;
  }

  Map<String, dynamic> toFirestore() => {
    'frequency': frequency.name,
    'interval': interval,
    if (weekday != null) 'weekday': weekday,
    if (dayOfMonth != null) 'dayOfMonth': dayOfMonth,
    'triggerLeadDays': triggerLeadDays,
  };

  factory RecurrenceRule.fromFirestore(dynamic value) {
    if (value is! Map) {
      throw const FormatException('Invalid recurrence rule');
    }
    final frequencyName = value['frequency'] as String?;
    final frequency = RecurrenceFrequency.values.firstWhere(
      (item) => item.name == frequencyName,
      orElse: () => throw const FormatException('Unknown recurrence frequency'),
    );
    return RecurrenceRule(
      frequency: frequency,
      interval: (value['interval'] as num?)?.toInt() ?? 1,
      weekday: (value['weekday'] as num?)?.toInt(),
      dayOfMonth: (value['dayOfMonth'] as num?)?.toInt(),
      triggerLeadDays:
          (value['triggerLeadDays'] as num?)?.toInt() ?? defaultTriggerLeadDays,
    );
  }

  RecurrenceRule copyWith({
    RecurrenceFrequency? frequency,
    int? interval,
    int? weekday,
    int? dayOfMonth,
    int? triggerLeadDays,
  }) => RecurrenceRule(
    frequency: frequency ?? this.frequency,
    interval: interval ?? this.interval,
    weekday: weekday ?? this.weekday,
    dayOfMonth: dayOfMonth ?? this.dayOfMonth,
    triggerLeadDays: triggerLeadDays ?? this.triggerLeadDays,
  );
}

DateTime? parseFirestoreDate(dynamic value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}
