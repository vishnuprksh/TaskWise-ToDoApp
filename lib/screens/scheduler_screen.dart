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
    _timeIndicatorStream = Stream.periodic(const Duration(minutes: 1)).asBroadcastStream();
    
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
    const headerHeight = 120.0;
    
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

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        color: const Color(0xFF0F172A),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              _buildDateNavigation(),
              Expanded(
                child: tasksAsync.when(
                  data: (allTasks) {
                    return FutureBuilder(
                      future: ref.watch(projectsProvider.future),
                      builder: (context, snapshot) {
                        if (snapshot.hasData) {
                          final projects = snapshot.data!;
                          final archivedProjectIds = projects
                              .where((p) => p.archived)
                              .map((p) => p.id)
                              .toSet();
                          // Exclude tasks from archived projects
                          final activeTasks = allTasks
                              .where((t) => t.projectId == null || !archivedProjectIds.contains(t.projectId))
                              .toList();
                          final schedulerService = ref.read(schedulerServiceProvider);
                          final tasksForDay = schedulerService.getTasksForDate(_currentDate, activeTasks);
                          final projectMap = {for (var p in projects) p.id: p};

                          return _buildTimeline(tasksForDay, projectMap);
                        } else if (snapshot.hasError) {
                          return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
                        } else {
                          return Center(child: CircularProgressIndicator());
                        }
                      },
                    );
                  },
                  loading: () => Center(child: CircularProgressIndicator()),
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
                  fontSize: 28, 
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(15),
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.calendarDays, color: Colors.white, size: 20),
            ),
            onPressed: _goToToday,
          ),
        ],
      ),
    );
  }

  Widget _buildDateNavigation() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(LucideIcons.chevronLeft, color: Colors.white70),
            onPressed: _previousDay,
          ),
          Column(
            children: [
              Text(
                DateFormat('MMMM yyyy').format(_currentDate),
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              Text(
                _isToday(_currentDate) ? 'Today' : DateFormat('EEEE, d').format(_currentDate),
                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(LucideIcons.chevronRight, color: Colors.white70),
            onPressed: _nextDay,
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline(List<Task> tasks, Map<String, Project> projectMap) {
    const pixelsPerHour = 80.0;
    final schedulerService = ref.read(schedulerServiceProvider);

    return SingleChildScrollView(
      controller: _scrollController,
      padding: const EdgeInsets.only(top: 20, bottom: 100),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Hour Grid Background
          Column(
            children: List.generate(24, (hour) {
              return Container(
                height: pixelsPerHour,
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: Colors.white.withAlpha(10), width: 0.5),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      padding: const EdgeInsets.only(top: 8, left: 16),
                      child: Text(
                        DateFormat('ha').format(DateTime(2024, 1, 1, hour)),
                        style: TextStyle(color: Colors.white.withAlpha(100), fontSize: 12),
                      ),
                    ),
                    Expanded(child: Container()),
                  ],
                ),
              );
            }),
          ),

          // Current Time Indicator
          if (_isToday(_currentDate))
            StreamBuilder(
              stream: _timeIndicatorStream,
              builder: (context, snapshot) {
                final now = DateTime.now();
                final topOffset = (now.hour * pixelsPerHour) + (now.minute / 60) * pixelsPerHour;
                return Positioned(
                  top: topOffset,
                  left: 60,
                  right: 0,
                  child: Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(color: Color(0xFF6366F1), shape: BoxShape.circle),
                      ),
                      Expanded(
                        child: Container(height: 2, color: const Color(0xFF6366F1)),
                      ),
                    ],
                  ),
                );
              },
            ),

          // Events Overlay
          ...tasks.map((task) {
            final project = projectMap[task.projectId];
            final position = schedulerService.calculateEventPosition(
              task.scheduledAt!,
              task.scheduledDuration ?? 60,
            );

            return Positioned(
              top: position['top'],
              left: 70,
              right: 16,
              height: position['height'],
              child: SchedulerEventItem(
                task: task,
                projectColor: project?.colorValue ?? Colors.blue,
                onUpdate: (newTime, newDuration) {
                  if (newTime == null) {
                    ref.read(firestoreServiceProvider).updateTask(task.id, {
                      'scheduledAt': null,
                    });
                  } else {
                    ref.read(firestoreServiceProvider).updateTask(task.id, {
                      'scheduledAt': newTime,
                      'scheduledDuration': newDuration,
                    });
                  }
                },
              ),
            );
          }).toList(),
        ],
      ),
    );
  }
}
