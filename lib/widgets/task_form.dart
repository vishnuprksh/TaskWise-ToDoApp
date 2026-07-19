import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/task.dart';
import '../models/project.dart';
import '../services/firestore_service.dart';

class TaskForm extends ConsumerStatefulWidget {
  final Task? task;
  final String? initialProjectId;

  const TaskForm({Key? key, this.task, this.initialProjectId}) : super(key: key);

  @override
  ConsumerState<TaskForm> createState() => _TaskFormState();
}

class _TaskFormState extends ConsumerState<TaskForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _textController;
  String? _selectedProjectId;
  late Map<String, String> _attributes;
  DateTime? _scheduledAt;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController(text: widget.task?.text ?? '');
    _selectedProjectId = widget.task?.projectId ?? widget.initialProjectId;
    _attributes = widget.task?.attributes != null
        ? Map<String, String>.from(widget.task!.attributes)
        : {
            'easiness': 'medium',
            'importance': 'high',
            'emergency': 'medium',
            'interest': 'medium',
          };
    _scheduledAt = widget.task?.scheduledAt;
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _saveTask() async {
    if (!_formKey.currentState!.validate()) return;

    final firestoreService = ref.read(firestoreServiceProvider);
    final priorityScore = Task.calculatePriority(_attributes);

    final taskData = {
      'text': _textController.text,
      'projectId': _selectedProjectId,
      'attributes': _attributes,
      'priorityScore': priorityScore,
      'scheduledAt': _scheduledAt != null ? _scheduledAt : null,
      'completed': widget.task?.completed ?? false,
    };

    if (widget.task == null) {
      await firestoreService.addTask(taskData);
    } else {
      await firestoreService.updateTask(widget.task!.id, taskData);
    }

    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final projectsAsync = ref.watch(projectsProvider);

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B), // Dark blue-gray background
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    widget.task == null ? 'New Task' : 'Edit Task',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(LucideIcons.x, color: Colors.white70),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _textController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'What needs to be done?',
                  hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                  ),
                ),
                validator: (value) => value == null || value.isEmpty ? 'Please enter task text' : null,
                autofocus: false,
              ),
              const SizedBox(height: 20),
              projectsAsync.when(
                data: (projects) {
                  final activeProjects = projects.where((p) => !p.archived || p.id == _selectedProjectId).toList();
                  return DropdownButtonFormField<String>(
                    value: _selectedProjectId,
                    style: const TextStyle(color: Colors.white),
                    dropdownColor: const Color(0xFF1E293B),
                    decoration: InputDecoration(
                      labelText: 'Project',
                      labelStyle: TextStyle(color: Colors.white.withOpacity(0.7)),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.05),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                      ),
                      prefixIcon: const Icon(LucideIcons.folder, color: Colors.white70),
                    ),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('No Project')),
                      ...activeProjects.map((p) => DropdownMenuItem(value: p.id, child: Text(p.name))),
                    ],
                    onChanged: (val) => setState(() => _selectedProjectId = val),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, __) => Text('Error: $err', style: const TextStyle(color: Colors.redAccent)),
              ),
              const SizedBox(height: 28),
              const Text(
                'Task Attributes',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              _buildAttributeSelector('Easiness', 'easiness'),
              _buildAttributeSelector('Importance', 'importance'),
              _buildAttributeSelector('Emergency', 'emergency'),
              _buildAttributeSelector('Interest', 'interest'),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _scheduledAt ?? DateTime.now(),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                    builder: (context, child) {
                      return Theme(
                        data: Theme.of(context).copyWith(
                          colorScheme: const ColorScheme.dark(
                            primary: Colors.blueAccent,
                            onPrimary: Colors.white,
                            surface: Color(0xFF1E293B),
                            onSurface: Colors.white,
                          ),
                        ),
                        child: child!,
                      );
                    },
                  );
                  if (date != null) {
                    final time = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay.fromDateTime(_scheduledAt ?? DateTime.now()),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: const ColorScheme.dark(
                              primary: Colors.blueAccent,
                              onPrimary: Colors.white,
                              surface: Color(0xFF1E293B),
                              onSurface: Colors.white,
                            ),
                          ),
                          child: child!,
                        );
                      },
                    );
                    if (time != null) {
                      setState(() {
                        _scheduledAt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                      });
                    }
                  }
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white70,
                  side: BorderSide(color: Colors.white.withOpacity(0.1)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(LucideIcons.calendar, size: 20),
                label: Text(
                  _scheduledAt == null
                      ? 'Schedule Task'
                      : 'Scheduled: ${_scheduledAt!.day}/${_scheduledAt!.month} ${_scheduledAt!.hour}:${_scheduledAt!.minute}',
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _saveTask,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: Text(
                  widget.task == null ? 'Create Task' : 'Update Task',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAttributeSelector(String label, String key) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 14, fontWeight: FontWeight.w500)),
          const SizedBox(width: 8),
          ToggleButtons(
            constraints: const BoxConstraints(minHeight: 32, minWidth: 60),
            borderRadius: BorderRadius.circular(10),
            selectedColor: Colors.white,
            fillColor: const Color(0xFF6366F1).withAlpha(100),
            color: Colors.white.withAlpha(100),
            borderColor: Colors.white.withAlpha(20),
            selectedBorderColor: const Color(0xFF6366F1),
            isSelected: [
              _attributes[key] == 'low',
              _attributes[key] == 'medium',
              _attributes[key] == 'high',
            ],
            onPressed: (index) {
              setState(() {
                _attributes[key] = index == 0 ? 'low' : (index == 1 ? 'medium' : 'high');
              });
            },
            children: const [
              Text('Low', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              Text('Med', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              Text('High', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }
}
