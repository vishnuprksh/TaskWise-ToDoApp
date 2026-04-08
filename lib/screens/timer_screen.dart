import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/task.dart';
import '../models/pomodoro_session.dart';
import '../services/firestore_service.dart';
import '../services/widget_service.dart';
import '../utils/time_utils.dart';
import 'pomodoro_report_screen.dart';

enum TimerMode { work }

class TimerScreen extends ConsumerStatefulWidget {
  final Task task;

  const TimerScreen({super.key, required this.task});

  @override
  ConsumerState<TimerScreen> createState() => _TimerScreenState();
}

class _TimerScreenState extends ConsumerState<TimerScreen> with TickerProviderStateMixin {
  late TimerMode _currentMode = TimerMode.work;
  late int _timeLeft;
  bool _isActive = false;
  Timer? _timer;
  
  // Settings
  Map<TimerMode, int> _durations = {
    TimerMode.work: 25,
  };
  double _dragDistance = 0;

  late AnimationController _progressController;
  late AnimationController _breathingController;
  final AudioPlayer _audioPlayer = AudioPlayer();
  final AudioPlayer _rainPlayer = AudioPlayer();

  @override
  void initState() {
    super.initState();
    _timeLeft = _durations[_currentMode]! * 60;
    
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    
    _breathingController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _initializeApp();
  }

  Future<void> _initializeApp() async {
    await _loadSettings();
    await _initAudio();
    if (mounted) {
      _startTimer();
    }
  }

  Future<void> _initAudio() async {
    await _rainPlayer.setReleaseMode(ReleaseMode.loop);
    await _rainPlayer.setSource(AssetSource('sounds/rain.mp3'));
    await _audioPlayer.setSource(AssetSource('sounds/bell.mp3'));
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _durations[TimerMode.work] = prefs.getInt('work_duration') ?? 25;
      
      if (!_isActive) {
        _timeLeft = _durations[_currentMode]! * 60;
      }
    });
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('work_duration', _durations[TimerMode.work]!);
  }

  void _startTimer() {
    setState(() {
      _isActive = true;
    });
    WakelockPlus.enable();
    _rainPlayer.resume();
    
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        setState(() {
          _timeLeft--;
          if (_currentMode == TimerMode.work) {
            // Update time spent in Firestore every minute to avoid too many writes
            if (_timeLeft % 60 == 0) {
              _recordMinute();
            }
          }
          // Update Home Widget
          WidgetService.updateTimer(
            timeLeft: _timeLeft,
            isActive: _isActive,
            taskText: widget.task.text,
          );
        });
      } else {
        _onTimerFinished();
      }
    });
  }

  void _stopTimer() {
    _timer?.cancel();
    _rainPlayer.pause();
    setState(() {
      _isActive = false;
    });
    // Update Home Widget
    WidgetService.updateTimer(
      timeLeft: _timeLeft,
      isActive: false,
      taskText: widget.task.text,
    );
    WakelockPlus.disable();
  }

  void _onTimerFinished() {
    _stopTimer();
    _audioPlayer.resume();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Timer Finished'),
        content: const Text('Great job focusing!'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _resetTimer();
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _recordMinute() {
    final service = ref.read(firestoreServiceProvider);
    
    // 1. Update total time on task using atomic increment to fix the bug
    service.updateTask(widget.task.id, {
      'timeSpent': FieldValue.increment(1),
    });

    // 2. Add as a Pomodoro Session for tracking/reporting
    final session = PomodoroSession(
      id: '', // Firestore will assign ID
      taskId: widget.task.id,
      projectId: widget.task.projectId,
      startTime: DateTime.now(),
      duration: 1,
    );
    service.addSession(session);
  }

  void _toggleTimer() {
    if (_isActive) {
      _stopTimer();
    } else {
      _startTimer();
    }
  }

  void _resetTimer() {
    _stopTimer();
    setState(() {
      _timeLeft = _durations[_currentMode]! * 60;
    });
  }

  void _showSettingsModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pomodoro Settings',
                    style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Work Duration',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 16),
                      ),
                      Text(
                        '${_durations[TimerMode.work]} min',
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  Slider(
                    value: _durations[TimerMode.work]!.toDouble(),
                    min: 1,
                    max: 120,
                    divisions: 119,
                    activeColor: const Color(0xFF6366F1),
                    inactiveColor: const Color(0xFF334155),
                    onChanged: (value) {
                      setModalState(() {
                        _durations[TimerMode.work] = value.toInt();
                      });
                      setState(() {
                        if (!_isActive) {
                          _timeLeft = _durations[TimerMode.work]! * 60;
                        }
                      });
                    },
                    onChangeEnd: (value) {
                      _saveSettings();
                    },
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Tip: You can also swipe up/down on the timer to adjust length.',
                    style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Save'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _switchMode(TimerMode mode) {
    if (_isActive) return;
    setState(() {
      _currentMode = mode;
      _timeLeft = _durations[mode]! * 60;
    });
  }

  String _formatTime(int seconds) {
    int minutes = seconds ~/ 60;
    int remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _timer?.cancel();
    _progressController.dispose();
    _breathingController.dispose();
    _audioPlayer.dispose();
    _rainPlayer.dispose();
    WakelockPlus.disable();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = const Color(0xFF6366F1);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        _showExitConfirmation();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
            onPressed: () async {
              _showExitConfirmation();
            },
          ),
          title: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'Pomodoro',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
          actions: [
            IconButton(
              icon: const Icon(LucideIcons.barChart2, color: Colors.white),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const PomodoroReportScreen()),
                );
              },
            ),
            IconButton(
              icon: const Icon(LucideIcons.settings, color: Colors.white),
              onPressed: () {
                _showSettingsModal();
              },
            ),
          ],
        ),
        body: Column(
          children: [
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _currentMode == TimerMode.work ? 'Current Task' : 'Take a Break',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 14,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 40),
                      child: Text(
                        widget.task.text,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (_currentMode == TimerMode.work) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.clock, size: 16, color: Color(0xFF94A3B8)),
                            const SizedBox(width: 6),
                            Text(
                              'Today\'s Total: ${TimeUtils.formatTime(ref.watch(todayFocusProvider))}',
                              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B).withOpacity(0.5),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.target, size: 14, color: Color(0xFF64748B)),
                            const SizedBox(width: 6),
                            Text(
                              'Task Focus: ${TimeUtils.formatTime(widget.task.timeSpent ?? 0)}',
                              style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 40),
                    GestureDetector(
                      onVerticalDragUpdate: (details) {
                        if (_isActive) return;
                        setState(() {
                          _dragDistance += details.primaryDelta!;
                          if (_dragDistance.abs() > 20) {
                            int change = -(_dragDistance ~/ 20);
                            int newDuration = (_durations[TimerMode.work]! + change).clamp(1, 120);
                            _durations[TimerMode.work] = newDuration;
                            _timeLeft = newDuration * 60;
                            _dragDistance = 0;
                          }
                        });
                      },
                      onVerticalDragEnd: (details) {
                        _dragDistance = 0;
                        _saveSettings();
                      },
                      child: ScaleTransition(
                        scale: Tween<double>(begin: 1.0, end: 1.05).animate(
                          CurvedAnimation(parent: _breathingController, curve: Curves.easeInOut),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            SizedBox(
                              width: 280,
                              height: 280,
                              child: CircularProgressIndicator(
                                value: _durations[_currentMode] == 0 ? 0 : _timeLeft / (_durations[_currentMode]! * 60),
                                strokeWidth: 12,
                                backgroundColor: const Color(0xFF1E293B),
                                valueColor: AlwaysStoppedAnimation<Color>(color),
                              ),
                            ),
                            Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  _formatTime(_timeLeft),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 56,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  _isActive ? 'FOCUS' : 'PAUSED',
                                  style: TextStyle(
                                    color: color,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 2,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 60),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        GestureDetector(
                          onTap: _toggleTimer,
                          child: Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: color.withOpacity(0.4),
                                  blurRadius: 16,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Icon(
                              _isActive ? LucideIcons.pause : LucideIcons.play,
                              size: 32,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 30),
                        GestureDetector(
                          onTap: _resetTimer,
                          child: Container(
                            width: 50,
                            height: 50,
                            decoration: const BoxDecoration(
                              color: Color(0xFF1E293B),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(LucideIcons.rotateCcw, size: 24, color: Color(0xFF94A3B8)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showExitConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Wait! Don\'t leave!', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Your Pomodoro is still running. If you leave now, you\'ll lose your momentum! Are you sure you want to stop?',
          style: TextStyle(color: Color(0xFF94A3B8)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Stay Focused', style: TextStyle(color: Color(0xFF6366F1))),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Exit screen
            },
            child: const Text('Exit Anyway', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }

  Widget _buildModeButton(String label, TimerMode mode, Color activeColor) {
    return const SizedBox.shrink();
  }
}
