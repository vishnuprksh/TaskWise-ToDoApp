import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/task.dart';
import '../models/project.dart';
import '../services/firestore_service.dart';
import '../widgets/task_item.dart';
import '../widgets/task_form.dart';
import '../widgets/voice_assistant.dart';
import 'projects_screen.dart';

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
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
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
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 10),
                              child: Text('Ongoing', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                            ),
                            ...ongoingTasks.map((task) => _buildTaskItem(task)),
                          ],
                          if (finishedTasks.isNotEmpty) ...[
                            InkWell(
                              onTap: () => setState(() => _isFinishedExpanded = !_isFinishedExpanded),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Finished', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                                    Icon(
                                      _isFinishedExpanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            if (_isFinishedExpanded)
                              ...finishedTasks.map((task) => _buildTaskItem(task)),
                          ],
                          if (filteredTasks.isEmpty)
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.only(top: 50),
                                child: Text('No tasks found', style: TextStyle(color: Colors.grey)),
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
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showTaskForm(),
        backgroundColor: Colors.indigo,
        child: Icon(LucideIcons.plus, color: Colors.white),
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
              child: TextField(
                controller: _searchController,
                onChanged: (val) => setState(() => _searchQuery = val),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Search projects...',
                  hintStyle: const TextStyle(color: Colors.grey),
                  prefixIcon: const Icon(LucideIcons.search, color: Colors.grey, size: 20),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(LucideIcons.x, color: Colors.grey, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: const Color(0xFF1E293B),
                  contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
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
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (val) => setState(() => _selectedProjectId = id),
        backgroundColor: const Color(0xFF1E293B),
        selectedColor: Colors.indigo,
        labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.grey),
        checkmarkColor: Colors.white,
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
