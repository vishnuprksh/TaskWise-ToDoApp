import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/task.dart';
import '../services/firestore_service.dart';
import '../utils/time_utils.dart';

enum TimerMode { work, shortBreak, longBreak }

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
    TimerMode.shortBreak: 5,
    TimerMode.longBreak: 15,
  };
  bool _showBreaks = true;

  late AnimationController _progressController;
  late AnimationController _breathingController;
  final AudioPlayer _audioPlayer = AudioPlayer();

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

    _loadSettings();
    _startTimer(); // Auto-start as per React implementation
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _durations[TimerMode.work] = prefs.getInt('work_duration') ?? 25;
      _durations[TimerMode.shortBreak] = prefs.getInt('short_break_duration') ?? 5;
      _durations[TimerMode.longBreak] = prefs.getInt('long_break_duration') ?? 15;
      _showBreaks = prefs.getBool('show_breaks') ?? true;
      
      if (!_isActive) {
        _timeLeft = _durations[_currentMode]! * 60;
      }
    });
  }

  void _startTimer() {
    setState(() {
      _isActive = true;
    });
    WakelockPlus.enable();
    
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        setState(() {
          _timeLeft--;
          if (_currentMode == TimerMode.work) {
            // Update time spent in Firestore every minute to avoid too many writes
            if (_timeLeft % 60 == 0) {
              _updateTimeSpent(1);
            }
          }
        });
      } else {
        _onTimerFinished();
      }
    });
  }

  void _stopTimer() {
    _timer?.cancel();
    setState(() {
      _isActive = false;
    });
    WakelockPlus.disable();
  }

  void _onTimerFinished() {
    _stopTimer();
    _audioPlayer.play(AssetSource('sounds/happy_bells.wav'));
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Timer Finished'),
        content: Text(_currentMode == TimerMode.work 
          ? 'Great job focusing! Time for a break?' 
          : 'Break is over. Ready to get back to work?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _updateTimeSpent(int minutes) {
    final service = ref.read(firestoreServiceProvider);
    service.updateTask(widget.task.id, {
      'timeSpent': (widget.task.timeSpent ?? 0) + minutes,
    });
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
    WakelockPlus.disable();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _currentMode == TimerMode.work 
        ? const Color(0xFF6366F1) 
        : (_currentMode == TimerMode.shortBreak ? const Color(0xFF10B981) : const Color(0xFF3B82F6));

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildModeButton('Work', TimerMode.work, color),
              if (_showBreaks) ...[
                _buildModeButton('Short', TimerMode.shortBreak, color),
                _buildModeButton('Long', TimerMode.longBreak, color),
              ],
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.settings, color: Colors.white),
            onPressed: () {
              // TODO: Implement settings modal
            },
          ),
        ],
      ),
      body: Center(
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
                      'Total Focus: ${TimeUtils.formatTime(widget.task.timeSpent ?? 0)}',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 40),
            ScaleTransition(
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
                      value: _timeLeft / (_durations[_currentMode]! * 60),
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
    );
  }

  Widget _buildModeButton(String label, TimerMode mode, Color activeColor) {
    bool isSelected = _currentMode == mode;
    return GestureDetector(
      onTap: () => _switchMode(mode),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF334155) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : const Color(0xFF94A3B8),
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
