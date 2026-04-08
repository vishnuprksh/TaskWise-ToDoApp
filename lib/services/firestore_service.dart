import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/task.dart';
import '../models/project.dart';
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

  // Pomodoro Sessions removed as per redundancy consolidation
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

/// Returns total lifetime focus time across all tasks in SECONDS.
final totalFocusProvider = Provider<int>((ref) {
  final tasksAsync = ref.watch(tasksProvider);
  return tasksAsync.when(
    data: (tasks) {
      return tasks.fold(0, (sum, task) => sum + task.timeSpent);
    },
    loading: () => 0,
    error: (_, __) => 0,
  );
});
