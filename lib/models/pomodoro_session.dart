import 'package:cloud_firestore/cloud_firestore.dart';

class PomodoroSession {
  final String id;
  final String taskId;
  final String? projectId;
  final DateTime startTime;
  final int duration; // In minutes

  PomodoroSession({
    required this.id,
    required this.taskId,
    this.projectId,
    required this.startTime,
    required this.duration,
  });

  factory PomodoroSession.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return PomodoroSession(
      id: doc.id,
      taskId: data['taskId'] ?? '',
      projectId: data['projectId'],
      startTime: (data['startTime'] as Timestamp).toDate(),
      duration: data['duration'] ?? 0,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'taskId': taskId,
      'projectId': projectId,
      'startTime': Timestamp.fromDate(startTime),
      'duration': duration,
    };
  }
}
