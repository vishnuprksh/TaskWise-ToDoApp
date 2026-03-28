import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/project.dart';
import '../utils/time_utils.dart';

class ProjectItem extends StatelessWidget {
  final Project project;
  final int totalTime;
  final VoidCallback onEdit;
  final VoidCallback onToggleArchive;
  final VoidCallback onDelete;

  const ProjectItem({
    Key? key,
    required this.project,
    required this.totalTime,
    required this.onEdit,
    required this.onToggleArchive,
    required this.onDelete,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final color = Color(int.parse(project.color.replaceFirst('#', '0xFF')));

    return Dismissible(
      key: Key('project-${project.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        color: Colors.red,
        child: Icon(LucideIcons.trash2, color: Colors.white),
      ),
      confirmDismiss: (direction) async {
        return await showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              backgroundColor: const Color(0xFF1E293B),
              title: const Text('Confirm', style: TextStyle(color: Colors.white)),
              content: const Text('Are you sure you want to delete this project and all its tasks?', style: TextStyle(color: Colors.white70)),
              actions: <Widget>[
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('CANCEL'),
                ),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  child: const Text('DELETE', style: TextStyle(color: Colors.red)),
                ),
              ],
            );
          },
        );
      },
      onDismissed: (_) => onDelete(),
      child: Card(
        margin: const EdgeInsets.only(bottom: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        color: const Color(0xFF1E293B),
        child: ListTile(
          onTap: onEdit,
          leading: Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          title: Row(
            children: [
              Text(
                project.name,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              if (project.archived)
                Container(
                  margin: const EdgeInsets.only(left: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Archived',
                    style: TextStyle(color: Colors.orange, fontSize: 10),
                  ),
                ),
            ],
          ),
          subtitle: Row(
            children: [
              Icon(LucideIcons.clock, size: 12, color: Colors.grey),
              const SizedBox(width: 4),
              Text(
                TimeUtils.formatTime(totalTime),
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
          trailing: IconButton(
            icon: Icon(
              project.archived ? LucideIcons.eyeOff : LucideIcons.eye,
              color: project.archived ? Colors.orange : Colors.grey,
            ),
            onPressed: onToggleArchive,
          ),
        ),
      ),
    );
  }
}
