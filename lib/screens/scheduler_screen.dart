import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/task.dart';
import '../models/project.dart';
import '../services/scheduler_service.dart';
import '../services/firestore_service.dart';
import '../widgets/scheduler_event_item.dart';

class SchedulerScreen extends ConsumerStatefulWidget {
  const SchedulerScreen({super.key});

  @override
  ConsumerState<SchedulerScreen> createState() => _SchedulerScreenState();
}

class _SchedulerScreenState extends ConsumerState<SchedulerScreen> {
  late DateTime _currentDate;
  ScrollController _scrollController = ScrollController();
  late Stream<void> _timeIndicatorStream;

  @override
  void initState() {
    super.initState();
    _currentDate = DateTime.now();
    _scrollController = ScrollController();
    _timeIndicatorStream = Stream.periodic(const Duration(minutes: 1));
    
    // Scroll to current hour on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToCurrentHour();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToCurrentHour() {
    final now = DateTime.now();
    const pixelsPerHour = 80.0;
    const headerHeight = 120.0; // Approximate header + date nav height
    
    final offset = (now.hour * pixelsPerHour) + headerHeight - 100;
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        offset,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    }
  }

  void _goToToday() {
    setState(() {
      _currentDate = DateTime.now();
    });
    _scrollToCurrentHour();
  }

  void _previousDay() {
    setState(() {
      _currentDate = _currentDate.subtract(const Duration(days: 1));
    });
  }

  void _nextDay() {
    setState(() {
      _currentDate = _currentDate.add(const Duration(days: 1));
    });
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && date.month == now.month && date.day == now.day;
  }

  @override
  Widget build(BuildContext context) {
    final tasksAsync = ref.watch(tasksProvider);
    final projectsAsync = ref.watch(projectsProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0F172A),
              Color(0xFF1E1B4B),
              Color(0xFF0F172A),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              _buildDateNavigation(),
              Expanded(
                child: tasksAsync.when(
                  data: (allTasks) {
                    return projectsAsync.when(
                      data: (projects) {
                        final schedulerService = ref.watch(schedulerServiceProvider);
                        final tasksForDay = schedulerService.getTasksForDate(_currentDate, allTasks);
                        final projectMap = {for (var p in projects) p.id: p};

                        return _buildTimeline(tasksForDay, projectMap);
                      },
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (err, _) => Center(
                        child: Text('Error loading projects: $err', style: const TextStyle(color: Colors.red)),
                      ),
                    );
                  },
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, _) => Center(
                    child: Text('Error loading tasks: $err', style: const TextStyle(color: Colors.red)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Calendar', 
                style: TextStyle(
                  color: Color(0xFF6366F1), 
                  fontSize: 14, 
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
              Text(
                'Schedule', 
                style: TextStyle(
                  color: Colors.white, 
                  fontSize: 32, 
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(15),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withAlpha(20)),
              ),
              child: const Icon(LucideIcons.x, color: Colors.white, size: 24),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateNavigation() {
    final dateStr = DateFormat('EEE, MMM d').format(_currentDate);
    final isToday = _isToday(_currentDate);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildNavButton(LucideIcons.chevronLeft, _previousDay),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: _goToToday,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: isToday ? const Color(0xFF6366F1).withAlpha(40) : Colors.white.withAlpha(15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isToday ? const Color(0xFF6366F1).withAlpha(100) : Colors.white.withAlpha(20),
                        width: 1.5,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        dateStr,
                        style: TextStyle(
                          color: isToday ? const Color(0xFF818CF8) : Colors.white, 
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          _buildNavButton(LucideIcons.chevronRight, _nextDay),
        ],
      ),
    );
  }

  Widget _buildNavButton(IconData icon, VoidCallback onPressed) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(10),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withAlpha(15)),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _buildTimeline(List<Task> tasksForDay, Map<String, Project> projectMap) {
    if (tasksForDay.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(LucideIcons.calendar, color: Colors.grey, size: 48),
            SizedBox(height: 16),
            Text('No tasks scheduled', style: TextStyle(color: Colors.grey, fontSize: 16)),
            SizedBox(height: 8),
            Text('Drag tasks here to schedule them', style: TextStyle(color: Colors.grey, fontSize: 14)),
          ],
        ),
      );
    }

    return StreamBuilder<void>(
      stream: _timeIndicatorStream,
      builder: (context, snapshot) {
        return SingleChildScrollView(
          controller: _scrollController,
          child: Stack(
            children: [
              _buildGridLines(),
              Column(
                children: [
                  ...List.generate(24, (hour) {
                    return _buildHourRow(hour);
                  }),
                  const SizedBox(height: 40),
                ],
              ),
              ..._buildEventItems(tasksForDay, projectMap),
              if (_isToday(_currentDate)) _buildTimeIndicator(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildGridLines() {
    return Column(
      children: List.generate(24, (hour) {
        return Container(
          height: 80,
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(color: const Color(0xFF1E293B), width: 1),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildHourRow(int hour) {
    return Container(
      height: 80,
      padding: const EdgeInsets.only(left: 50, right: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 45,
            child: Text(
              '${hour.toString().padLeft(2, '0')}:00',
              style: const TextStyle(color: Colors.grey, fontSize: 12),
              textAlign: TextAlign.right,
            ),
          ),
          Expanded(child: Container()),
        ],
      ),
    );
  }

  List<Widget> _buildEventItems(List<Task> tasksForDay, Map<String, Project> projectMap) {
    final schedulerService = ref.watch(schedulerServiceProvider);
    const leftPadding = 95.0;
    const rightPadding = 16.0;

    return tasksForDay.map((task) {
      final position = schedulerService.calculateEventPosition(
        task.scheduledAt!,
        task.scheduledDuration ?? 60,
      );

      final project = projectMap[task.projectId];
      final projectColor = project?.colorValue ?? const Color(0xFF6366F1);

      return Positioned(
        top: position['top'],
        left: leftPadding,
        right: rightPadding,
        height: position['height'],
        child: SchedulerEventItem(
          task: task,
          projectColor: projectColor,
          onUpdate: (newDateTime, newDuration) async {
            final schedulerService = ref.read(schedulerServiceProvider);
            final timeOfDay = TimeOfDay(hour: newDateTime.hour, minute: newDateTime.minute);
            
            try {
              await schedulerService.updateTaskSchedule(
                task.id,
                _currentDate,
                timeOfDay,
                newDuration,
              );
            } catch (e) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Error updating task: $e')),
              );
            }
          },
        ),
      );
    }).toList();
  }

  Widget _buildTimeIndicator() {
    final now = DateTime.now();
    const pixelsPerHour = 80.0;
    const pixelsPerMinute = pixelsPerHour / 60;

    final topOffset = (now.hour * pixelsPerHour) + (now.minute * pixelsPerMinute);

    return Positioned(
      top: topOffset,
      left: 0,
      right: 0,
      child: Container(
        height: 2,
        color: Colors.red,
      ),
    );
  }
}
