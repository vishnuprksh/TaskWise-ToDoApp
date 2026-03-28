import 'package:flutter/material.dart';
import 'dart:ui';
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
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Dismissible(
        key: Key(task.id),
        direction: DismissDirection.endToStart,
        background: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Container(
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            color: Colors.red.withAlpha(200),
            child: const Icon(LucideIcons.trash2, color: Colors.white),
          ),
        ),
        confirmDismiss: (direction) async {
          return await showDialog(
            context: context,
            builder: (BuildContext context) {
              return BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: AlertDialog(
                  backgroundColor: Colors.white.withAlpha(30),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                    side: BorderSide(color: Colors.white.withAlpha(40)),
                  ),
                  title: const Text('Confirm', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  content: const Text('Are you sure you want to delete this task?', style: TextStyle(color: Colors.white70)),
                  actions: <Widget>[
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      child: Text('CANCEL', style: TextStyle(color: Colors.white.withAlpha(200))),
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(true),
                      child: const Text('DELETE', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              );
            },
          );
        },
        onDismissed: (_) => onDelete(),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              decoration: BoxDecoration(
                color: task.completed ? Colors.white.withAlpha(10) : Colors.white.withAlpha(25),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: task.completed ? Colors.white.withAlpha(15) : Colors.white.withAlpha(35),
                  width: 1,
                ),
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                onTap: onTap,
                leading: GestureDetector(
                  onTap: onToggle,
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: task.completed ? Colors.greenAccent : Colors.white.withAlpha(100),
                        width: 2,
                      ),
                      color: task.completed ? Colors.greenAccent.withAlpha(50) : Colors.transparent,
                    ),
                    child: task.completed
                        ? const Icon(LucideIcons.check, size: 16, color: Colors.greenAccent)
                        : null,
                  ),
                ),
                title: Text(
                  task.text,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: task.completed ? FontWeight.w400 : FontWeight.w600,
                    decoration: task.completed ? TextDecoration.lineThrough : null,
                    color: task.completed ? Colors.white.withAlpha(100) : Colors.white,
                  ),
                ),
                subtitle: task.scheduledAt != null
                    ? Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          children: [
                            Icon(LucideIcons.calendar, size: 12, color: Colors.white.withAlpha(150)),
                            const SizedBox(width: 4),
                            Text(
                              '${task.scheduledAt!.day}/${task.scheduledAt!.month} ${task.scheduledAt!.hour.toString().padLeft(2, '0')}:${task.scheduledAt!.minute.toString().padLeft(2, '0')}',
                              style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150)),
                            ),
                          ],
                        ),
                      )
                    : null,
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: Icon(
                        LucideIcons.play,
                        size: 20,
                        color: task.completed ? Colors.white24 : Colors.white70,
                      ),
                      onPressed: task.completed
                          ? null
                          : () {
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
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            _getPriorityColor(task.priorityScore).withAlpha(40),
                            _getPriorityColor(task.priorityScore).withAlpha(80),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _getPriorityColor(task.priorityScore).withAlpha(100),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: _getPriorityColor(task.priorityScore).withAlpha(50),
                            blurRadius: 8,
                            spreadRadius: -2,
                          ),
                        ],
                      ),
                      child: Text(
                        task.priorityScore.toStringAsFixed(1),
                        style: TextStyle(
                          color: _getPriorityColor(task.priorityScore),
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
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
