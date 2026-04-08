import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:percent_indicator/percent_indicator.dart';
import '../models/task.dart';
import '../models/project.dart';
import '../models/pomodoro_session.dart';
import '../services/firestore_service.dart';
import '../utils/time_utils.dart';

class PomodoroReportScreen extends ConsumerStatefulWidget {
  const PomodoroReportScreen({super.key});

  @override
  ConsumerState<PomodoroReportScreen> createState() => _PomodoroReportScreenState();
}

class _PomodoroReportScreenState extends ConsumerState<PomodoroReportScreen> {

  @override
  Widget build(BuildContext context) {
    final tasksAsync = ref.watch(tasksProvider);
    final projectsAsync = ref.watch(projectsProvider);
    final sessionsAsync = ref.watch(sessionsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Productivity Report',
          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
      body: tasksAsync.when(
        data: (tasks) => projectsAsync.when(
          data: (projects) => sessionsAsync.when(
            data: (sessions) => _buildReport(tasks, projects, sessions),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
      ),
    );
  }

  Widget _buildReport(List<Task> allTasks, List<Project> projects, List<PomodoroSession> sessions) {
    final totalSeconds = sessions.fold(0, (sum, s) => sum + s.duration);
    
    // Project breakdown from sessions
    final Map<String, int> projectSeconds = {};
    for (var session in sessions) {
      final pid = session.projectId ?? 'no_project';
      projectSeconds[pid] = (projectSeconds[pid] ?? 0) + session.duration;
    }

    final projectList = projectSeconds.entries.map((e) {
      final project = projects.firstWhere((p) => p.id == e.key, 
        orElse: () => Project(id: 'no_project', name: 'No Project', color: '#94A3B8', archived: false));
      return {
        'project': project,
        'seconds': e.value,
        'percentage': totalSeconds > 0 ? e.value / totalSeconds : 0.0,
      };
    }).toList();

    projectList.sort((a, b) => (b['seconds'] as int).compareTo(a['seconds'] as int));

    // Task aggregation from sessions
    final Map<String, int> taskSeconds = {};
    for (var session in sessions) {
      taskSeconds[session.taskId] = (taskSeconds[session.taskId] ?? 0) + session.duration;
    }

    final taskEntries = taskSeconds.entries.map((e) {
      final task = allTasks.firstWhere((t) => t.id == e.key,
          orElse: () => Task(id: e.key, text: 'Deleted Task', attributes: {}));
      return {'task': task, 'seconds': e.value};
    }).toList();

    taskEntries.sort((a, b) => (b['seconds'] as int).compareTo(a['seconds'] as int));

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Text(
          'Lifetime Productivity',
          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 32),
        _buildBigStats(totalSeconds, sessions.length),
        const SizedBox(height: 40),
        _buildSectionHeader('Project Distribution', LucideIcons.pieChart),
        const SizedBox(height: 20),
        ...projectList.map((item) => _buildProjectProgress(item)),
        const SizedBox(height: 40),
        _buildSectionHeader('Top Focused Tasks', LucideIcons.target),
        const SizedBox(height: 20),
        ...taskEntries.take(10).map((e) => _buildTaskFocusItem(e['task'] as Task, e['seconds'] as int, projects)),
        if (sessions.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Text(
                'No focus time recorded yet.',
                style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 14),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildBigStats(int seconds, int sessionCount) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [const Color(0xFF6366F1), const Color(0xFF4F46E5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          const Text(
            'Total Focus Time',
            style: TextStyle(color: Colors.white70, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            TimeUtils.formatSecondsToTime(seconds),
            style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.w900, letterSpacing: -1),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(LucideIcons.flame, size: 16, color: Colors.orangeAccent),
                const SizedBox(width: 8),
                Text(
                  '$sessionCount Sessions Completed',
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: const Color(0xFF6366F1)),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildProjectProgress(Map<String, dynamic> item) {
    final project = item['project'] as Project;
    final seconds = item['seconds'] as int;
    final percentage = item['percentage'] as double;

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(project.name, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
              Text(TimeUtils.formatSecondsToTime(seconds), style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 14)),
            ],
          ),
          const SizedBox(height: 8),
          LinearPercentIndicator(
            lineHeight: 8.0,
            percent: percentage,
            padding: EdgeInsets.zero,
            backgroundColor: const Color(0xFF1E293B),
            progressColor: project.colorValue,
            barRadius: const Radius.circular(4),
            animation: true,
          ),
        ],
      ),
    );
  }

  Widget _buildTaskFocusItem(Task task, int seconds, List<Project> projects) {
    final project = projects.firstWhere((p) => p.id == task.projectId, 
      orElse: () => Project(id: 'no_project', name: 'No Project', color: '#94A3B8', archived: false));

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: project.colorValue,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.text,
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                ),
                Text(
                  project.name,
                  style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12),
                ),
              ],
            ),
          ),
          Text(
            TimeUtils.formatSecondsToTime(seconds),
            style: const TextStyle(color: Colors.greenAccent, fontSize: 14, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
