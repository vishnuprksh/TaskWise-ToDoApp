import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/project.dart';
import '../models/task.dart';
import '../services/firestore_service.dart';
import '../widgets/project_item.dart';
import '../widgets/project_form.dart';

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsAsync = ref.watch(projectsProvider);
    final tasksAsync = ref.watch(tasksProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Projects', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.plus, color: Colors.white),
            onPressed: () => _showProjectForm(context),
          ),
        ],
      ),
      body: projectsAsync.when(
        data: (projects) {
          return tasksAsync.when(
            data: (tasks) {
              return ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: projects.length,
                itemBuilder: (context, index) {
                  final project = projects[index];
                  final totalTime = tasks
                      .where((t) => t.projectId == project.id)
                      .fold(0, (sum, t) => sum + (t.timeSpent));

                  return ProjectItem(
                    project: project,
                    totalTime: totalTime,
                    onEdit: () => _showProjectForm(context, project: project),
                    onToggleArchive: () {
                      ref.read(firestoreServiceProvider).updateProject(project.id, {
                        'archived': !project.archived,
                      });
                    },
                    onDelete: () => _confirmDelete(context, ref, project.id),
                  );
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.white))),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.white))),
      ),
    );
  }

  void _showProjectForm(BuildContext context, {Project? project}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ProjectForm(project: project),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, String projectId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Project'),
        content: const Text('Are you sure? Tasks in this project will remain but lose their project tag.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              ref.read(firestoreServiceProvider).deleteProject(projectId);
              Navigator.pop(context);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
