import 'package:cloud_firestore/cloud_firestore.dart';

class PomodoroSession {
  final String id;
  final String taskId;
  final String? projectId;
  final int duration; // In seconds
  final DateTime startTime;
  final DateTime endTime;
  final bool isLegacy;

  PomodoroSession({
    required this.id,
    required this.taskId,
    this.projectId,
    required this.duration,
    required this.startTime,
    required this.endTime,
    this.isLegacy = false,
  });

  factory PomodoroSession.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    final startTime = data['startTime'];
    final endTime = data['endTime'];

    if (startTime is! Timestamp || endTime is! Timestamp) {
      throw FormatException(
        'Pomodoro session ${doc.id} has invalid startTime or endTime',
      );
    }

    return PomodoroSession(
      id: doc.id,
      taskId: data['taskId'] ?? '',
      projectId: data['projectId'],
      duration: data['duration'] ?? 0,
      startTime: startTime.toDate(),
      endTime: endTime.toDate(),
      isLegacy: data['isLegacy'] ?? false,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'taskId': taskId,
      'projectId': projectId,
      'duration': duration,
      'startTime': Timestamp.fromDate(startTime),
      'endTime': Timestamp.fromDate(endTime),
      'isLegacy': isLegacy,
    };
  }
}
