import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../services/voice_service.dart';

class VoiceAssistant extends ConsumerStatefulWidget {
  const VoiceAssistant({super.key});

  @override
  ConsumerState<VoiceAssistant> createState() => _VoiceAssistantState();
}

class _VoiceAssistantState extends ConsumerState<VoiceAssistant> with SingleTickerProviderStateMixin {
  bool _isListening = false;
  String _transcript = '';
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    );
  }

  void _toggleListening() async {
    final voiceService = ref.read(voiceServiceProvider);
    
    if (_isListening) {
      voiceService.stop();
      setState(() {
        _isListening = false;
        _pulseController.stop();
        _pulseController.reset();
      });
    } else {
      final available = await voiceService.init();
      if (available) {
        setState(() {
          _isListening = true;
          _transcript = 'Listening...';
          _pulseController.repeat(reverse: true);
        });
        
        voiceService.listen(
          onResult: (text) {
            setState(() {
              _transcript = text;
            });
          },
          onCommand: (command) {
            _handleCommand(command);
            _toggleListening(); // Stop listening after command
          },
        );
      }
    }
  }

  void _handleCommand(VoiceCommand command) {
    switch (command.type) {
      case CommandType.showTasks:
        Navigator.of(context).popUntil((route) => route.isFirst);
        break;
      case CommandType.startPomodoro:
        // In a real app, we'd find the first task or prompt for one
        // For now, we emit a notification or just show feedback
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Starting Pomodoro session...')),
        );
        break;
      case CommandType.stopTimer:
      case CommandType.pauseTimer:
      case CommandType.resumeTimer:
      case CommandType.resetTimer:
        // Use a global event bus or provider to communicate with TimerScreen
        // For simplicity, we just show feedback here
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Command: ${command.type.name}')),
        );
        break;
      default:
        break;
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        if (_isListening)
          Positioned(
            bottom: 100,
            right: 20,
            left: 20,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(20),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.white.withAlpha(40)),
                  ),
                  child: Text(
                    _transcript,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),
              ),
            ),
          ),
        Positioned(
          bottom: 100, // Move it higher to avoid overlapping with FAB
          right: 20,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  ScaleTransition(
                    scale: Tween<double>(begin: 1.0, end: 1.8).animate(
                      CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
                    ),
                    child: FadeTransition(
                      opacity: Tween<double>(begin: 0.6, end: 0.0).animate(
                        CurvedAnimation(parent: _pulseController, curve: Curves.easeOut),
                      ),
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: _isListening ? Colors.redAccent : const Color(0xFF6366F1),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: _toggleListening,
                    child: Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: _isListening
                              ? [Colors.redAccent, Colors.red]
                              : [const Color(0xFF818CF8), const Color(0xFF6366F1)],
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: (_isListening ? Colors.redAccent : const Color(0xFF6366F1)).withAlpha(100),
                            blurRadius: 15,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Icon(
                        _isListening ? LucideIcons.x : LucideIcons.mic,
                        color: Colors.white,
                        size: 26,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
