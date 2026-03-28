import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class Project {
  final String id;
  final String name;
  final String color;
  final bool archived;

  Project({
    required this.id,
    required this.name,
    required this.color,
    this.archived = false,
  });

  Color get colorValue {
    final hex = color.replaceFirst('#', '');
    return Color(int.parse('0xFF$hex'));
  }

  factory Project.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return Project(
      id: doc.id,
      name: data['name'] ?? '',
      color: data['color'] ?? '#6366F1',
      archived: data['archived'] ?? false,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
      'color': color,
      'archived': archived,
    };
  }
}
