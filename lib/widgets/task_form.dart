import 'package:flutter/material.dart';
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
            'importance': 'medium',
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
      'timeSpent': widget.task?.timeSpent ?? 0,
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
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
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
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(LucideIcons.x),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _textController,
                decoration: const InputDecoration(
                  hintText: 'What needs to be done?',
                  border: OutlineInputBorder(),
                ),
                validator: (value) => value == null || value.isEmpty ? 'Please enter task text' : null,
                autofocus: true,
              ),
              const SizedBox(height: 20),
              projectsAsync.when(
                data: (projects) => DropdownButtonFormField<String>(
                  value: _selectedProjectId,
                  decoration: const InputDecoration(
                    labelText: 'Project',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(LucideIcons.folder),
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('No Project')),
                    ...projects.map((p) => DropdownMenuItem(value: p.id, child: Text(p.name))),
                  ],
                  onChanged: (val) => setState(() => _selectedProjectId = val),
                ),
                loading: () => const CircularProgressIndicator(),
                error: (_, __) => const Text('Error loading projects'),
              ),
              const SizedBox(height: 20),
              const Text('Task Attributes', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              _buildAttributeSelector('Easiness', 'easiness'),
              _buildAttributeSelector('Importance', 'importance'),
              _buildAttributeSelector('Emergency', 'emergency'),
              _buildAttributeSelector('Interest', 'interest'),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _scheduledAt ?? DateTime.now(),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (date != null) {
                    final time = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay.fromDateTime(_scheduledAt ?? DateTime.now()),
                    );
                    if (time != null) {
                      setState(() {
                        _scheduledAt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
                      });
                    }
                  }
                },
                icon: Icon(LucideIcons.calendar),
                label: Text(_scheduledAt == null ? 'Schedule Task' : 'Scheduled: ${_scheduledAt.toString().split('.')[0]}'),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _saveTask,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  backgroundColor: Colors.blueAccent,
                  foregroundColor: Colors.white,
                ),
                child: Text(widget.task == null ? 'Create Task' : 'Update Task'),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAttributeSelector(String label, String key) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'low', label: Text('Low')),
              ButtonSegment(value: 'medium', label: Text('Med')),
              ButtonSegment(value: 'high', label: Text('High')),
            ],
            selected: {_attributes[key]!},
            onSelectionChanged: (Set<String> newSelection) {
              setState(() {
                _attributes[key] = newSelection.first;
              });
            },
          ),
        ],
      ),
    );
  }
}
