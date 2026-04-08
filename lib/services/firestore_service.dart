import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/task.dart';
import '../models/project.dart';
import '../models/pomodoro_session.dart';
import 'auth_service.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final String? userId;

  FirestoreService(this.userId);

  // User-specific collections
  CollectionReference get _projectsRef =>
      _db.collection('users').doc(userId).collection('projects');
  CollectionReference get _tasksRef =>
      _db.collection('users').doc(userId).collection('tasks');
  CollectionReference get _sessionsRef =>
      _db.collection('users').doc(userId).collection('pomodoro_sessions');

  // Projects
  Stream<List<Project>> streamProjects() {
    if (userId == null) return Stream.value([]);
    return _projectsRef.snapshots().map((snapshot) =>
        snapshot.docs.map((doc) => Project.fromFirestore(doc)).toList());
  }

  Future<void> addProject(Map<String, dynamic> data) {
    if (userId == null) throw Exception('User not logged in');
    return _projectsRef.add(data);
  }

  Future<void> updateProject(String id, Map<String, dynamic> data) {
    if (userId == null) throw Exception('User not logged in');
    return _projectsRef.doc(id).update(data);
  }

  Future<void> deleteProject(String id) {
    if (userId == null) throw Exception('User not logged in');
    return _projectsRef.doc(id).delete();
  }

  // Tasks
  Stream<List<Task>> streamTasks() {
    if (userId == null) return Stream.value([]);
    return _tasksRef.snapshots().map((snapshot) =>
        snapshot.docs.map((doc) => Task.fromFirestore(doc)).toList());
  }

  Future<void> addTask(Map<String, dynamic> data) {
    if (userId == null) throw Exception('User not logged in');
    return _tasksRef.add(data);
  }

  Future<void> updateTask(String id, Map<String, dynamic> data) {
    if (userId == null) throw Exception('User not logged in');
    return _tasksRef.doc(id).update(data);
  }

  Future<void> deleteTask(String id) {
    if (userId == null) throw Exception('User not logged in');
    return _tasksRef.doc(id).delete();
  }

  // Pomodoro Sessions
  Stream<List<PomodoroSession>> streamPomodoroSessions() {
    if (userId == null) return Stream.value([]);
    return _sessionsRef
        .orderBy('startTime', descending: true)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => PomodoroSession.fromFirestore(doc)).toList());
  }

  Future<void> addPomodoroSession(PomodoroSession session) {
    if (userId == null) throw Exception('User not logged in');
    return _sessionsRef.add(session.toFirestore());
  }

  /// One-time cleanup method to remove legacy timeSpent fields from all tasks.
  Future<void> cleanupLegacyFocusData() async {
    if (userId == null) throw Exception('User not logged in');
    final snapshot = await _tasksRef.get();
    final batch = _db.batch();
    for (var doc in snapshot.docs) {
      batch.update(doc.reference, {'timeSpent': FieldValue.delete()});
    }
    return batch.commit();
  }
}

final firestoreServiceProvider = Provider((ref) {
  final user = ref.watch(authStateProvider).value;
  return FirestoreService(user?.uid);
});

final projectsProvider = StreamProvider<List<Project>>((ref) {
  final firestoreService = ref.watch(firestoreServiceProvider);
  return firestoreService.streamProjects();
});

final tasksProvider = StreamProvider<List<Task>>((ref) {
  final firestoreService = ref.watch(firestoreServiceProvider);
  return firestoreService.streamTasks();
});

final sessionsProvider = StreamProvider<List<PomodoroSession>>((ref) {
  final firestoreService = ref.watch(firestoreServiceProvider);
  return firestoreService.streamPomodoroSessions();
});

/// Returns total lifetime focus time across all SESSIONS in SECONDS.
final totalFocusProvider = Provider<int>((ref) {
  final sessionsAsync = ref.watch(sessionsProvider);
  return sessionsAsync.when(
    data: (sessions) {
      return sessions.fold(0, (sum, session) => sum + session.duration);
    },
    loading: () => 0,
    error: (_, __) => 0,
  );
});

/// Returns total focus time for TODAY in SECONDS.
final todayFocusProvider = Provider<int>((ref) {
  final sessionsAsync = ref.watch(sessionsProvider);
  return sessionsAsync.when(
    data: (sessions) {
      final now = DateTime.now();
      final todayStart = DateTime(now.year, now.month, now.day);
      return sessions
          .where((s) => s.startTime.isAfter(todayStart))
          .fold(0, (sum, session) => sum + session.duration);
    },
    loading: () => 0,
    error: (_, __) => 0,
  );
});
