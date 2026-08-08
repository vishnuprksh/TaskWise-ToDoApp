import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/project.dart';
import '../services/firestore_service.dart';
import '../widgets/project_item.dart';
import '../widgets/project_form.dart';

class ProjectsScreen extends ConsumerWidget {
  const ProjectsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsAsync = ref.watch(projectsProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        color: const Color(0xFF0F172A),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(LucideIcons.arrowLeft, color: Colors.white, size: 20),
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Text(
                      'Projects',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                      ),
                    ),
                    IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF6366F1).withAlpha(40),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFF6366F1).withAlpha(100)),
                        ),
                        child: const Icon(LucideIcons.plus, color: Color(0xFF818CF8), size: 20),
                      ),
                      onPressed: () => _showProjectForm(context),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: projectsAsync.when(
                  data: (projects) {
                      final sortedProjects = [...projects]
                        ..sort((a, b) {
                          if (a.archived != b.archived) {
                            return a.archived ? 1 : -1;
                          }

                          return a.name.toLowerCase().compareTo(b.name.toLowerCase());
                        });

                      return ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                        itemCount: sortedProjects.length,
                        itemBuilder: (context, index) {
                          final project = sortedProjects[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: ProjectItem(
                              project: project,
                              // Focus-session history is loaded separately.
                              // Keeping this screen independent of malformed
                              // legacy session documents ensures projects can
                              // always be opened.
                              totalTime: 0,
                              onEdit: () => _showProjectForm(context, project: project),
                              onToggleArchive: () {
                                ref.read(firestoreServiceProvider).updateProject(project.id, {
                                  'archived': !project.archived,
                                });
                              },
                              onDelete: () => _confirmDelete(context, ref, project.id),
                            ),
                          );
                        },
                      );
                    },
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.white))),
                ),
              ),
            ],
          ),
        ),
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
