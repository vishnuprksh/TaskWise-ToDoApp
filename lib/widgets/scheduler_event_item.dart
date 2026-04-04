import 'package:flutter/material.dart';
import '../models/task.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class SchedulerEventItem extends StatefulWidget {
  final Task task;
  final Color projectColor;
  final Function(DateTime?, int) onUpdate;

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
  // Use local state for visual feedback during drag
  double? _draggedTop;
  double? _draggedHeight;
  
  // Track raw cumulative drag to avoid "stickiness" when snapping
  double _rawDragTop = 0;
  double _rawDragHeight = 0;
  
  bool _isMoving = false;
  bool _isResizing = false;

  static const double _pixelsPerHour = 80.0;
  double get _pixelsPerMinute => _pixelsPerHour / 60;
  double get _snapPixels => 15 * _pixelsPerMinute;

  @override
  Widget build(BuildContext context) {
    final scheduledAt = widget.task.scheduledAt!;
    final duration = widget.task.scheduledDuration ?? 60;

    // Calculate initial position
    final hour = scheduledAt.hour;
    final minute = scheduledAt.minute;
    final initialTop = (hour * _pixelsPerHour) + (minute * _pixelsPerMinute);
    final initialHeight = duration * _pixelsPerMinute;

    // Current effective position (either original or dragged)
    final effectiveTop = _draggedTop ?? initialTop;
    final effectiveHeight = _draggedHeight ?? initialHeight;

    // Format strings for display
    final displayedTime = _getTimeFromTop(effectiveTop);
    final displayedDuration = (effectiveHeight / _pixelsPerMinute).round();

    return Transform.translate(
      offset: Offset(0, effectiveTop - initialTop),
      child: Container(
        height: effectiveHeight,
        decoration: BoxDecoration(
          color: widget.projectColor.withAlpha(200),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: widget.projectColor,
            width: (_isMoving || _isResizing) ? 2.5 : 1.5,
          ),
          boxShadow: [
            if (_isMoving || _isResizing)
              BoxShadow(
                color: Colors.black.withAlpha(100),
                blurRadius: 12,
                spreadRadius: 2,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Main Body (Drag to Move)
            GestureDetector(
              onVerticalDragStart: (_) => setState(() {
                _isMoving = true;
                _rawDragTop = initialTop;
                _draggedTop = initialTop;
                _draggedHeight = initialHeight;
              }),
              onVerticalDragUpdate: (details) {
                _rawDragTop = (_rawDragTop + details.delta.dy).clamp(0.0, 24 * _pixelsPerHour - effectiveHeight);
                setState(() {
                  _draggedTop = (_rawDragTop / _snapPixels).round() * _snapPixels;
                });
              },
              onVerticalDragEnd: (_) => _handleMoveEnd(),
              child: Container(
                padding: const EdgeInsets.fromLTRB(12, 10, 36, 10),
                color: Colors.transparent, // Ensure full area is draggable
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.task.text,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(LucideIcons.clock, size: 12, color: Colors.white.withAlpha(180)),
                        const SizedBox(width: 4),
                        Text(
                          "${DateFormat('HH:mm').format(displayedTime)} • ${_formatDuration(displayedDuration)}",
                          style: TextStyle(
                            color: Colors.white.withAlpha(200),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Delete Button (Top Right)
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: () => widget.onUpdate(null, duration),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.black.withAlpha(30),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(LucideIcons.x, color: Colors.white70, size: 16),
                ),
              ),
            ),

            // Resize Handle (Bottom)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              height: 12,
              child: GestureDetector(
                onVerticalDragStart: (_) => setState(() {
                  _isResizing = true;
                  _rawDragHeight = initialHeight;
                  _draggedHeight = initialHeight;
                  _draggedTop = initialTop;
                }),
                onVerticalDragUpdate: (details) {
                  _rawDragHeight = (_rawDragHeight + details.delta.dy).clamp(15 * _pixelsPerMinute, 24 * _pixelsPerHour);
                  setState(() {
                    _draggedHeight = (_rawDragHeight / _snapPixels).round() * _snapPixels;
                  });
                },
                onVerticalDragEnd: (_) => _handleResizeEnd(),
                child: MouseRegion(
                  cursor: SystemMouseCursors.resizeUpDown,
                  child: Container(
                    color: Colors.transparent,
                    child: Center(
                      child: Container(
                        width: 30,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(100),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleMoveEnd() {
    if (_draggedTop == null) return;

    final totalMinutes = (_draggedTop! / _pixelsPerMinute).round();
    
    final newTime = DateTime(
      widget.task.scheduledAt!.year,
      widget.task.scheduledAt!.month,
      widget.task.scheduledAt!.day,
      totalMinutes ~/ 60,
      totalMinutes % 60,
    );

    setState(() {
      _isMoving = false;
      _draggedTop = null;
    });

    widget.onUpdate(newTime, widget.task.scheduledDuration ?? 60);
  }

  void _handleResizeEnd() {
    if (_draggedHeight == null) return;

    final durationMinutes = (_draggedHeight! / _pixelsPerMinute).round();

    setState(() {
      _isResizing = false;
      _draggedHeight = null;
    });

    widget.onUpdate(widget.task.scheduledAt, durationMinutes);
  }

  DateTime _getTimeFromTop(double top) {
    final totalMinutes = (top / _pixelsPerMinute).round();
    return DateTime(
      widget.task.scheduledAt!.year,
      widget.task.scheduledAt!.month,
      widget.task.scheduledAt!.day,
      totalMinutes ~/ 60,
      totalMinutes % 60,
    );
  }

  String _formatDuration(int minutes) {
    if (minutes < 60) return '${minutes}m';
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    return mins == 0 ? '${hours}h' : '${hours}h ${mins}m';
  }
}
