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
    return PomodoroSession(
      id: doc.id,
      taskId: data['taskId'] ?? '',
      projectId: data['projectId'],
      duration: data['duration'] ?? 0,
      startTime: (data['startTime'] as Timestamp).toDate(),
      endTime: (data['endTime'] as Timestamp).toDate(),
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
