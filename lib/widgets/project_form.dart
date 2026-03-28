import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/project.dart';
import '../services/firestore_service.dart';

class ProjectForm extends ConsumerStatefulWidget {
  final Project? project;

  const ProjectForm({Key? key, this.project}) : super(key: key);

  @override
  ConsumerState<ProjectForm> createState() => _ProjectFormState();
}

class _ProjectFormState extends ConsumerState<ProjectForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late String _selectedColor;

  final List<String> _colors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.project?.name ?? '');
    _selectedColor = widget.project?.color ?? _colors[0];
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _saveProject() async {
    if (!_formKey.currentState!.validate()) return;

    final firestoreService = ref.read(firestoreServiceProvider);
    final projectData = {
      'name': _nameController.text,
      'color': _selectedColor,
      'archived': widget.project?.archived ?? false,
    };

    if (widget.project == null) {
      await firestoreService.addProject(projectData);
    } else {
      await firestoreService.updateProject(widget.project!.id, projectData);
    }

    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.project == null ? 'New Project' : 'Edit Project',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                hintText: 'Project Name',
                border: OutlineInputBorder(),
              ),
              validator: (value) => value == null || value.isEmpty ? 'Please enter project name' : null,
              autofocus: true,
            ),
            const SizedBox(height: 20),
            const Text('Project Color', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: _colors.map((colorStr) {
                final color = Color(int.parse(colorStr.replaceFirst('#', '0xFF')));
                return GestureDetector(
                  onTap: () => setState(() => _selectedColor = colorStr),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      border: _selectedColor == colorStr
                          ? Border.all(color: Colors.black, width: 2)
                          : null,
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _saveProject,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 15),
                backgroundColor: Colors.indigo,
                foregroundColor: Colors.white,
              ),
              child: Text(widget.project == null ? 'Create Project' : 'Update Project'),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
