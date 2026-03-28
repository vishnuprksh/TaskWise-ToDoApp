import 'package:flutter/material.dart';
import '../models/task.dart';
import 'package:intl/intl.dart';

class SchedulerEventItem extends StatefulWidget {
  final Task task;
  final Color projectColor;
  final Function(DateTime, int) onUpdate;

  const SchedulerEventItem({
    super.key,
    required this.task,
    required this.projectColor,
    required this.onUpdate,
  });

  @override
  State<SchedulerEventItem> createState() => _SchedulerEventItemState();
}

class _SchedulerEventItemState extends State<SchedulerEventItem> {
  late Offset _dragStart;
  late Offset _dragCurrent;

  static const double _pixelsPerHour = 80.0;

  double get _pixelsPerMinute => _pixelsPerHour / 60;

  void _onPanDown(DragDownDetails details) {
    _dragStart = details.globalPosition;
    _dragCurrent = details.globalPosition;
  }

  void _onPanUpdate(DragUpdateDetails details) {
    setState(() {
      _dragCurrent = details.globalPosition;
    });
  }

  void _onPanEnd(DragEndDetails details) {
    // Calculate the delta in minutes
    final dy = _dragCurrent.dy - _dragStart.dy;
    final minutesDelta = (dy / _pixelsPerMinute).round();

    // Snap to 15-minute intervals
    final snappedMinutes = ((minutesDelta + 7) ~/ 15) * 15;

    // Calculate new time
    final newDateTime = widget.task.scheduledAt!.add(Duration(minutes: snappedMinutes));

    // Ensure time stays within valid bounds (00:00 - 23:59)
    if (newDateTime.hour >= 0 && newDateTime.hour < 24) {
      widget.onUpdate(newDateTime, widget.task.scheduledDuration ?? 60);
    } else {
      // Out of bounds, don't update
      setState(() {
        _dragCurrent = _dragStart;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('HH:mm').format(widget.task.scheduledAt!);
    final durationStr = _formatDuration(widget.task.scheduledDuration ?? 60);

    return GestureDetector(
      onPanDown: _onPanDown,
      onPanUpdate: _onPanUpdate,
      onPanEnd: _onPanEnd,
      child: Container(
        decoration: BoxDecoration(
          color: widget.projectColor.withValues(alpha: 0.9),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: widget.projectColor.withValues(alpha: 1.0), width: 2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    widget.task.text,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$timeStr • $durationStr',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 11,
                  ),
                ),
                const Icon(Icons.drag_indicator, color: Colors.white60, size: 14),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDuration(int minutes) {
    if (minutes < 60) {
      return '${minutes}m';
    }
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (mins == 0) {
      return '${hours}h';
    }
    return '${hours}h ${mins}m';
  }
}
