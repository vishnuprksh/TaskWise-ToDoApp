import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:percent_indicator/percent_indicator.dart';
import '../models/pomodoro_session.dart';
import '../models/project.dart';
import '../services/firestore_service.dart';
import '../utils/time_utils.dart';

class PomodoroReportScreen extends ConsumerStatefulWidget {
  const PomodoroReportScreen({super.key});

  @override
  ConsumerState<PomodoroReportScreen> createState() => _PomodoroReportScreenState();
}

class _PomodoroReportScreenState extends ConsumerState<PomodoroReportScreen> {
  DateTime _selectedDate = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final sessionsAsync = ref.watch(sessionsProvider);
    final projectsAsync = ref.watch(projectsProvider);

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
      body: sessionsAsync.when(
        data: (sessions) => projectsAsync.when(
          data: (projects) => _buildReport(sessions, projects),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
      ),
    );
  }

  Widget _buildReport(List<PomodoroSession> allSessions, List<Project> projects) {
    final filteredSessions = allSessions.where((s) => 
      s.startTime.year == _selectedDate.year && 
      s.startTime.month == _selectedDate.month && 
      s.startTime.day == _selectedDate.day
    ).toList();

    final totalMinutes = filteredSessions.fold(0, (sum, s) => sum + s.duration);
    
    // Project breakdown
    final Map<String, int> projectMinutes = {};
    for (var session in filteredSessions) {
      final pid = session.projectId ?? 'no_project';
      projectMinutes[pid] = (projectMinutes[pid] ?? 0) + session.duration;
    }

    final projectList = projectMinutes.entries.map((e) {
      final project = projects.firstWhere((p) => p.id == e.key, 
        orElse: () => Project(id: 'no_project', name: 'No Project', color: '#94A3B8', archived: false));
      return {
        'project': project,
        'minutes': e.value,
        'percentage': totalMinutes > 0 ? e.value / totalMinutes : 0.0,
      };
    }).toList();

    projectList.sort((a, b) => (b['minutes'] as int).compareTo(a['minutes'] as int));

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _buildDateHeader(),
        const SizedBox(height: 32),
        _buildBigStats(totalMinutes),
        const SizedBox(height: 40),
        _buildSectionHeader('Project Distribution', LucideIcons.pieChart),
        const SizedBox(height: 20),
        ...projectList.map((item) => _buildProjectProgress(item)),
        const SizedBox(height: 40),
        _buildSectionHeader('Recent Sessions', LucideIcons.history),
        const SizedBox(height: 20),
        ...filteredSessions.take(10).map((s) => _buildSessionItem(s, projects)),
        if (filteredSessions.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Text(
                'No focus sessions recorded for this day.',
                style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 14),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildDateHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white70),
          onPressed: () => setState(() => _selectedDate = _selectedDate.subtract(const Duration(days: 1))),
        ),
        Column(
          children: [
            Text(
              DateFormat('EEEE, MMM d').format(_selectedDate),
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            if (_selectedDate.day == DateTime.now().day && _selectedDate.month == DateTime.now().month)
              const Text(
                'TODAY',
                style: TextStyle(color: Color(0xFF6366F1), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
              ),
          ],
        ),
        IconButton(
          icon: const Icon(LucideIcons.chevronRight, color: Colors.white70),
          onPressed: () {
            if (_selectedDate.isBefore(DateTime.now().subtract(const Duration(hours: 23)))) {
              setState(() => _selectedDate = _selectedDate.add(const Duration(days: 1)));
            }
          },
        ),
      ],
    );
  }

  Widget _buildBigStats(int minutes) {
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
            TimeUtils.formatTime(minutes),
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
                  '${(minutes / 25).floor()} Sessions Completed',
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
    final minutes = item['minutes'] as int;
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
              Text(TimeUtils.formatTime(minutes), style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 14)),
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

  Widget _buildSessionItem(PomodoroSession session, List<Project> projects) {
    final project = projects.firstWhere((p) => p.id == session.projectId, 
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
                  project.name,
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                ),
                Text(
                  DateFormat('hh:mm a').format(session.startTime),
                  style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12),
                ),
              ],
            ),
          ),
          Text(
            '+${session.duration}m',
            style: const TextStyle(color: Colors.greenAccent, fontSize: 14, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
