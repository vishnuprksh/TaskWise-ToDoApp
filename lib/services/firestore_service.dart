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
  Stream<List<PomodoroSession>> streamSessions() {
    if (userId == null) return Stream.value([]);
    return _sessionsRef.orderBy('startTime', descending: true).snapshots().map(
        (snapshot) => snapshot.docs
            .map((doc) => PomodoroSession.fromFirestore(doc))
            .toList());
  }

  Future<void> addSession(PomodoroSession session) {
    if (userId == null) throw Exception('User not logged in');
    return _sessionsRef.add(session.toFirestore());
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
  return firestoreService.streamSessions();
});

final todayFocusProvider = Provider<int>((ref) {
  final sessionsAsync = ref.watch(sessionsProvider);
  return sessionsAsync.when(
    data: (sessions) {
      final now = DateTime.now();
      final todaySessions = sessions.where((s) {
        return s.startTime.year == now.year &&
            s.startTime.month == now.month &&
            s.startTime.day == now.day;
      });
      return todaySessions.fold(0, (sum, s) => sum + s.duration);
    },
    loading: () => 0,
    error: (_, __) => 0,
  );
});
