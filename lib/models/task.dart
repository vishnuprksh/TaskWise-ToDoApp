import 'package:cloud_firestore/cloud_firestore.dart';
import 'recurrence.dart';

class Task {
  static const Map<String, String> defaultAttributes = {
    'easiness': 'high',
    'importance': 'high',
    'emergency': 'high',
    'interest': 'high',
  };

  final String id;
  final String text;
  final bool completed;
  final String? projectId;
  final double priorityScore;
  final DateTime? scheduledAt;
  final int? scheduledDuration; // Duration in minutes
  final DateTime? startDate;
  final DateTime? endDate;
  final Map<String, String> attributes;
  final RecurrenceRule? recurrence;
  final Set<String> completedOccurrences;

  Task({
    required this.id,
    required this.text,
    this.completed = false,
    this.projectId,
    this.priorityScore = 0.0,
    this.scheduledAt,
    this.scheduledDuration = 60, // Default 60 minutes
    this.startDate,
    this.endDate,
    required this.attributes,
    this.recurrence,
    this.completedOccurrences = const {},
  });

  factory Task.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return Task(
      id: doc.id,
      text: data['text'] ?? '',
      completed: data['completed'] ?? false,
      projectId: data['projectId'],
      priorityScore: (data['priorityScore'] ?? 0.0).toDouble(),
      scheduledAt: _parseDateTime(data['scheduledAt']),
      scheduledDuration: data['scheduledDuration'] ?? 60,
      startDate: _parseDateTime(data['startDate']),
      endDate: _parseDateTime(data['endDate']),
      attributes: {
        ...defaultAttributes,
        ...Map<String, String>.from(data['attributes'] ?? const {}),
      },
      recurrence: _parseRecurrence(data['recurrence']),
      completedOccurrences: Set<String>.from(
        data['completedOccurrences'] ?? const [],
      ),
    );
  }

  static RecurrenceRule? _parseRecurrence(dynamic value) {
    if (value == null) return null;
    try {
      return RecurrenceRule.fromFirestore(value);
    } on FormatException {
      return null;
    }
  }

  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    if (value is Timestamp) return value.toDate();
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  Map<String, dynamic> toFirestore() {
    return {
      'text': text,
      'completed': completed,
      'projectId': projectId,
      'priorityScore': priorityScore,
      'scheduledAt': scheduledAt != null
          ? Timestamp.fromDate(scheduledAt!)
          : null,
      'scheduledDuration': scheduledDuration,
      'startDate': startDate != null ? Timestamp.fromDate(startDate!) : null,
      'endDate': endDate != null ? Timestamp.fromDate(endDate!) : null,
      'attributes': attributes,
      'recurrence': recurrence?.toFirestore(),
      'completedOccurrences': completedOccurrences.toList(),
    };
  }

  static double calculatePriority(Map<String, String> attributes) {
    const weights = {
      'easiness': 0.4,
      'importance': 0.3,
      'emergency': 0.2,
      'interest': 0.1,
    };
    const values = {'low': 1.0, 'medium': 2.0, 'high': 3.0};

    double score = 0;
    weights.forEach((key, weight) {
      score += (values[attributes[key] ?? 'medium'] ?? 2.0) * weight;
    });
    return double.parse(score.toStringAsFixed(2));
  }

  Task copyWith({
    String? text,
    bool? completed,
    String? projectId,
    double? priorityScore,
    DateTime? scheduledAt,
    int? scheduledDuration,
    DateTime? startDate,
    DateTime? endDate,
    Map<String, String>? attributes,
    RecurrenceRule? recurrence,
    Set<String>? completedOccurrences,
  }) {
    return Task(
      id: id,
      text: text ?? this.text,
      completed: completed ?? this.completed,
      projectId: projectId ?? this.projectId,
      priorityScore: priorityScore ?? this.priorityScore,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      scheduledDuration: scheduledDuration ?? this.scheduledDuration,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      attributes: attributes ?? this.attributes,
      recurrence: recurrence ?? this.recurrence,
      completedOccurrences: completedOccurrences ?? this.completedOccurrences,
    );
  }
}
