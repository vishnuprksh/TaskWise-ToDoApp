import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/task.dart';
import '../models/project.dart';
import '../services/firestore_service.dart';
import '../widgets/task_item.dart';
import '../widgets/task_form.dart';
import '../widgets/voice_assistant.dart';
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
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
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
          child: Stack(
            children: [
              Column(
                children: [
                  _buildHeader(context),
                  _buildProjectFilter(projectsAsync),
                  Expanded(
                    child: tasksAsync.when(
                      data: (tasks) {
                        final filteredTasks = _selectedProjectId == null
                            ? tasks
                            : tasks.where((t) => t.projectId == _selectedProjectId).toList();

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
                            const SizedBox(height: 100), // Space for VoiceAssistant
                          ],
                        );
                      },
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.white))),
                    ),
                  ),
                ],
              ),
              const VoiceAssistant(),
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

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Welcome back,', style: TextStyle(color: Colors.grey, fontSize: 16)),
              Text('TaskWise', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
            ],
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
                icon: const Icon(LucideIcons.calendar, color: Colors.white, size: 28),
              ),
              IconButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const ProjectsScreen()),
                  );
                },
                icon: const Icon(LucideIcons.layoutGrid, color: Colors.white, size: 28),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProjectFilter(AsyncValue<List<Project>> projectsAsync) {
    return projectsAsync.when(
      data: (projects) {
        final activeProjects = projects.where((p) => !p.archived).toList();
        final filteredProjects = activeProjects
            .where((p) => p.name.toLowerCase().contains(_searchQuery.toLowerCase()))
            .toList();

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (val) => setState(() => _searchQuery = val),
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Search projects...',
                      hintStyle: TextStyle(color: Colors.white.withAlpha(80)),
                      prefixIcon: Icon(LucideIcons.search, color: Colors.white.withAlpha(100), size: 20),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(LucideIcons.x, color: Colors.white70, size: 18),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: Colors.white.withAlpha(20),
                      contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: Colors.white.withAlpha(30)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: Colors.white.withAlpha(20)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: Colors.indigo.withAlpha(150)),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Container(
              height: 50,
              margin: const EdgeInsets.only(bottom: 10),
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  if (_searchQuery.isEmpty) _buildFilterChip(null, 'All Tasks'),
                  ...filteredProjects.map((p) => _buildFilterChip(p.id, p.name)),
                  if (filteredProjects.isEmpty && _searchQuery.isNotEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 15),
                      child: Text('No projects found', style: TextStyle(color: Colors.grey, fontSize: 14)),
                    ),
                ],
              ),
            ),
          ],
        );
      },
      loading: () => const SizedBox(height: 110), // Adjusted for search bar height
      error: (_, __) => const SizedBox(height: 110),
    );
  }

  Widget _buildFilterChip(String? id, String label) {
    final isSelected = _selectedProjectId == id;
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        child: FilterChip(
          label: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.white.withAlpha(150),
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
          selected: isSelected,
          onSelected: (val) => setState(() => _selectedProjectId = id),
          backgroundColor: Colors.white.withAlpha(20),
          selectedColor: Colors.indigo.withAlpha(180),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          checkmarkColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
            side: BorderSide(
              color: isSelected ? Colors.indigo.withAlpha(200) : Colors.white.withAlpha(30),
            ),
          ),
          showCheckmark: false,
          elevation: 0,
          pressElevation: 0,
        ),
      ),
    );
  }

  Widget _buildTaskItem(Task task) {
    return TaskItem(
      task: task,
      onToggle: () {
        ref.read(firestoreServiceProvider).updateTask(task.id, {
          'completed': !task.completed,
        });
      },
      onDelete: () {
        ref.read(firestoreServiceProvider).deleteTask(task.id);
      },
      onTap: () => _showTaskForm(task: task),
    );
  }
}
