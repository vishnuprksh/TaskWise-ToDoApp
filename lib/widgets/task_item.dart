import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/task.dart';
import '../screens/timer_screen.dart';

class TaskItem extends StatelessWidget {
  final Task task;
  final VoidCallback onToggle;
  final VoidCallback onDelete;
  final VoidCallback onTap;

  const TaskItem({
    Key? key,
    required this.task,
    required this.onToggle,
    required this.onDelete,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(task.id),
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
              content: const Text('Are you sure you want to delete this task?', style: TextStyle(color: Colors.white70)),
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
      child: ListTile(
        onTap: onTap,
        leading: IconButton(
          icon: Icon(
            task.completed ? LucideIcons.checkCircle2 : LucideIcons.circle,
            color: task.completed ? Colors.green : Colors.grey,
          ),
          onPressed: onToggle,
        ),
        title: Text(
          task.text,
          style: TextStyle(
            decoration: task.completed ? TextDecoration.lineThrough : null,
            color: task.completed ? Colors.grey : Colors.white.withOpacity(0.9),
          ),
        ),
        subtitle: task.scheduledAt != null
            ? Text(
                'Scheduled: ${task.scheduledAt!.day}/${task.scheduledAt!.month} ${task.scheduledAt!.hour}:${task.scheduledAt!.minute}',
                style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.6)),
              )
            : null,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Icon(LucideIcons.play, size: 20),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => TimerScreen(task: task),
                  ),
                );
              },
              tooltip: 'Start Timer',
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getPriorityColor(task.priorityScore).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                task.priorityScore.toStringAsFixed(1),
                style: TextStyle(
                  color: _getPriorityColor(task.priorityScore),
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getPriorityColor(double score) {
    if (score >= 2.5) return Colors.red;
    if (score >= 1.5) return Colors.orange;
    return Colors.blue;
  }
}
