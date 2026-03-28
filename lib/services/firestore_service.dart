import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/task.dart';
import '../models/project.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Projects
  Stream<List<Project>> streamProjects() {
    return _db.collection('projects').snapshots().map((snapshot) =>
        snapshot.docs.map((doc) => Project.fromFirestore(doc)).toList());
  }

  Future<void> addProject(Map<String, dynamic> data) {
    return _db.collection('projects').add(data);
  }

  Future<void> updateProject(String id, Map<String, dynamic> data) {
    return _db.collection('projects').doc(id).update(data);
  }

  Future<void> deleteProject(String id) {
    return _db.collection('projects').doc(id).delete();
  }

  // Tasks
  Stream<List<Task>> streamTasks() {
    return _db.collection('tasks').snapshots().map((snapshot) =>
        snapshot.docs.map((doc) => Task.fromFirestore(doc)).toList());
  }

  Future<void> addTask(Map<String, dynamic> data) {
    return _db.collection('tasks').add(data);
  }

  Future<void> updateTask(String id, Map<String, dynamic> data) {
    return _db.collection('tasks').doc(id).update(data);
  }

  Future<void> deleteTask(String id) {
    return _db.collection('tasks').doc(id).delete();
  }
}

final firestoreServiceProvider = Provider((ref) => FirestoreService());

final projectsProvider = StreamProvider<List<Project>>((ref) {
  return ref.watch(firestoreServiceProvider).streamProjects();
});

final tasksProvider = StreamProvider<List<Task>>((ref) {
  return ref.watch(firestoreServiceProvider).streamTasks();
});
