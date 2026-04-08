import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

/// NOTE: This script is intended to be run manually or as a one-time operation.
/// It performs the following:
/// 1. Migrates existing 'timeSpent' totals into 'pomodoro_sessions' collection.
/// 2. Deletes the 'timeSpent' field from all tasks.
Future<void> migrateAndCleanup(String userId) async {
  final db = FirebaseFirestore.instance;
  final tasksRef = db.collection('users').doc(userId).collection('tasks');
  final sessionsRef = db.collection('users').doc(userId).collection('pomodoro_sessions');

  print('Starting migration for user: $userId');

  final tasksSnapshot = await tasksRef.get();
  final batch = db.batch();
  int migratedCount = 0;

  for (var taskDoc in tasksSnapshot.docs) {
    final data = taskDoc.data();
    final int timeSpent = data['timeSpent'] ?? 0;

    if (timeSpent > 0) {
      // Create a legacy session record
      final sessionRef = sessionsRef.doc();
      batch.set(sessionRef, {
        'taskId': taskDoc.id,
        'projectId': data['projectId'],
        'duration': timeSpent,
        'startTime': Timestamp.now(), // Marking as "now" since we don't know the historical start time
        'endTime': Timestamp.now(),
        'isLegacy': true, // Tagging it as migrated
      });
      migratedCount++;
    }

    // Mark timeSpent for deletion
    batch.update(taskDoc.reference, {'timeSpent': FieldValue.delete()});
  }

  await batch.commit();
  print('Migration complete. Migrated $migratedCount sessions and cleaned up ${tasksSnapshot.docs.length} tasks.');
}
