import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/task.dart';
import '../models/project.dart';
import '../services/firestore_service.dart';
import '../widgets/task_item.dart';
import '../widgets/task_form.dart';
import 'projects_screen.dart';
import 'scheduler_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String? _selectedProjectId;
  bool _isFinishedExpanded = false;
  String _searchQuery = '';

  @override
  void dispose() {
    super.dispose();
  }

  void _showTaskForm({Task? task}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => TaskForm(task: task, initialProjectId: _selectedProjectId),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tasksAsync = ref.watch(tasksProvider);
    final projectsAsync = ref.watch(projectsProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        color: const Color(0xFF0F172A),
        child: SafeArea(
          child: Stack(
            children: [
              Column(
                children: [
                  _buildHeader(context, projectsAsync),
                  Expanded(
                    child: tasksAsync.when(
                      data: (tasks) {
                        final filteredTasks = (_selectedProjectId == null
                            ? tasks
                            : tasks.where((t) => t.projectId == _selectedProjectId).toList());

                        // Sort by priorityScore descending
                        filteredTasks.sort((a, b) => b.priorityScore.compareTo(a.priorityScore));

                        final ongoingTasks = filteredTasks.where((t) => !t.completed).toList();
                        final finishedTasks = filteredTasks.where((t) => t.completed).toList();

                        return ListView(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          children: [
                            if (ongoingTasks.isNotEmpty) ...[
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 15),
                                child: Text(
                                  'Ongoing',
                                  style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white.withAlpha(230),
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ),
                              ...ongoingTasks.map((task) => _buildTaskItem(task)),
                            ],
                            if (finishedTasks.isNotEmpty) ...[
                              const SizedBox(height: 20),
                              ClipRect(
                                child: BackdropFilter(
                                  filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                                  child: InkWell(
                                    onTap: () => setState(() => _isFinishedExpanded = !_isFinishedExpanded),
                                    borderRadius: BorderRadius.circular(15),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 15),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withAlpha(15),
                                        borderRadius: BorderRadius.circular(15),
                                        border: Border.all(color: Colors.white.withAlpha(20)),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            'Finished',
                                            style: TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.white.withAlpha(180),
                                            ),
                                          ),
                                          Icon(
                                            _isFinishedExpanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                                            color: Colors.white.withAlpha(180),
                                            size: 20,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              if (_isFinishedExpanded) ...[
                                const SizedBox(height: 10),
                                ...finishedTasks.map((task) => _buildTaskItem(task)),
                              ],
                            ],
                            if (filteredTasks.isEmpty)
                              Center(
                                child: Padding(
                                  padding: const EdgeInsets.only(top: 80),
                                  child: Column(
                                    children: [
                                      Icon(LucideIcons.clipboardList, size: 60, color: Colors.white.withAlpha(30)),
                                      const SizedBox(height: 16),
                                      Text(
                                        'No tasks found',
                                        style: TextStyle(color: Colors.white.withAlpha(100), fontSize: 16),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            const SizedBox(height: 80),
                          ],
                        );
                      },
                      loading: () => Center(child: CircularProgressIndicator()),
                      error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.white))),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.indigo.withAlpha(100),
              blurRadius: 15,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: FloatingActionButton(
          onPressed: () => _showTaskForm(),
          backgroundColor: Colors.indigo,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: const Icon(LucideIcons.plus, color: Colors.white, size: 28),
        ),
      ),
    );
  }

  void _showProjectSelector(List<Project> projects) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final activeProjects = projects.where((p) => !p.archived).toList();
          final filteredProjects = activeProjects
              .where((p) => p.name.toLowerCase().contains(_searchQuery.toLowerCase()))
              .toList();

          return Container(
            height: MediaQuery.of(context).size.height * 0.75,
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
              border: Border.all(color: Colors.white.withAlpha(20)),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(40),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Row(
                    children: [
                      const Text(
                        'Select Project',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      if (_selectedProjectId != null)
                        TextButton(
                          onPressed: () {
                            setState(() => _selectedProjectId = null);
                            Navigator.pop(context);
                          },
                          child: const Text('Clear Filter', style: TextStyle(color: Colors.indigoAccent)),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: TextField(
                    onChanged: (val) {
                      setModalState(() => _searchQuery = val);
                      setState(() => _searchQuery = val);
                    },
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Search projects...',
                      hintStyle: TextStyle(color: Colors.white.withAlpha(80)),
                      prefixIcon: const Icon(LucideIcons.search, color: Colors.white70, size: 20),
                      filled: true,
                      fillColor: Colors.white.withAlpha(10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(15),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filteredProjects.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return ListTile(
                          onTap: () {
                            setState(() => _selectedProjectId = null);
                            Navigator.pop(context);
                          },
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: _selectedProjectId == null ? Colors.indigo : Colors.white.withAlpha(10),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(LucideIcons.layers, color: Colors.white, size: 18),
                          ),
                          title: const Text('All Tasks', style: TextStyle(color: Colors.white)),
                          trailing: _selectedProjectId == null ? const Icon(LucideIcons.check, color: Colors.indigoAccent) : null,
                        );
                      }
                      final project = filteredProjects[index - 1];
                      final isSelected = _selectedProjectId == project.id;
                      return ListTile(
                        onTap: () {
                          setState(() => _selectedProjectId = project.id);
                          Navigator.pop(context);
                        },
                        leading: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: project.colorValue.withAlpha(40),
                            shape: BoxShape.circle,
                            border: Border.all(color: project.colorValue.withAlpha(100)),
                          ),
                          child: Center(
                            child: Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: project.colorValue,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        ),
                        title: Text(project.name, style: const TextStyle(color: Colors.white)),
                        trailing: isSelected ? const Icon(LucideIcons.check, color: Colors.indigoAccent) : null,
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context, AsyncValue<List<Project>> projectsAsync) {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Welcome back,', style: TextStyle(color: Colors.grey, fontSize: 14)),
                const SizedBox(height: 4),
                projectsAsync.when(
                  data: (projects) {
                    final selectedProject = _selectedProjectId == null 
                        ? null 
                        : projects.firstWhere((p) => p.id == _selectedProjectId);
                    return InkWell(
                      onTap: () => _showProjectSelector(projects),
                      borderRadius: BorderRadius.circular(12),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              selectedProject?.name ?? 'All Projects',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(LucideIcons.chevronDown, color: Colors.white.withAlpha(150), size: 20),
                        ],
                      ),
                    );
                  },
                  loading: () => const Text('TaskWise', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                  error: (_, __) => const Text('TaskWise', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          Row(
            children: [
              IconButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const SchedulerScreen()),
                  );
                },
                icon: const Icon(LucideIcons.calendar, color: Colors.white, size: 24),
              ),
              IconButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const ProjectsScreen()),
                  );
                },
                icon: const Icon(LucideIcons.settings, color: Colors.white, size: 24),
              ),
            ],
          ),
        ],
      ),
    );
  }


  Widget _buildTaskItem(Task task) {
    final projects = ref.read(projectsProvider).value ?? [];
    final project = projects.where((p) => p.id == task.projectId).firstOrNull;

    return TaskItem(
      task: task,
      projectName: project?.name,
      onToggle: () {
        ref.read(firestoreServiceProvider).updateTask(task.id, {
          'completed': !task.completed,
        });
      },
      onDelete: () {
        ref.read(firestoreServiceProvider).deleteTask(task.id);
      },
      onTap: () => _showTaskForm(task: task),
      onSchedule: () async {
        final DateTime? pickedDate = await showDatePicker(
          context: context,
          initialDate: DateTime.now(),
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
          builder: (context, child) {
            return Theme(
              data: Theme.of(context).copyWith(
                colorScheme: const ColorScheme.dark(
                  primary: Colors.indigoAccent,
                  onPrimary: Colors.white,
                  surface: Color(0xFF1E293B),
                  onSurface: Colors.white,
                ),
              ),
              child: child!,
            );
          },
        );

        if (pickedDate != null) {
          final TimeOfDay? pickedTime = await showTimePicker(
            context: context,
            initialTime: TimeOfDay.now(),
            builder: (context, child) {
              return Theme(
                data: Theme.of(context).copyWith(
                  colorScheme: const ColorScheme.dark(
                    primary: Colors.indigoAccent,
                    onPrimary: Colors.white,
                    surface: Color(0xFF1E293B),
                    onSurface: Colors.white,
                  ),
                ),
                child: child!,
              );
            },
          );

          if (pickedTime != null) {
            final scheduledDateTime = DateTime(
              pickedDate.year,
              pickedDate.month,
              pickedDate.day,
              pickedTime.hour,
              pickedTime.minute,
            );

            await ref.read(firestoreServiceProvider).updateTask(task.id, {
              'scheduledAt': scheduledDateTime,
            });

            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Task scheduled for ${scheduledDateTime.toString().substring(0, 16)}'),
                  backgroundColor: Colors.indigo,
                ),
              );
            }
          }
        }
      },
    );
  }
}
