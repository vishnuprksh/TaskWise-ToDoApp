import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart';

enum CommandType {
  startPomodoro,
  stopTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  showTasks,
  unknown
}

class VoiceCommand {
  final CommandType type;
  final double confidence;

  VoiceCommand({required this.type, required this.confidence});
}

final voiceServiceProvider = Provider((ref) => VoiceService());

class VoiceService {
  final SpeechToText _speech = SpeechToText();

  static const _keywords = {
    'start': ['start', 'begin', 'go', 'play', 'run'],
    'stop': ['stop', 'end', 'finish', 'cancel'],
    'pause': ['pause', 'hold', 'wait'],
    'resume': ['resume', 'continue', 'keep'],
    'reset': ['reset', 'restart'],
    'pomodoro': ['pomodoro', 'timer', 'focus', 'session', 'work'],
    'tasks': ['tasks', 'todo', 'list', 'home'],
  };

  Future<bool> init() async {
    return await _speech.initialize();
  }

  void listen({
    required Function(String) onResult,
    required Function(VoiceCommand) onCommand,
  }) {
    _speech.listen(
      onResult: (result) {
        onResult(result.recognizedWords);
        if (result.finalResult) {
          final command = _parseCommand(result.recognizedWords);
          onCommand(command);
        }
      },
    );
  }

  void stop() {
    _speech.stop();
  }

  VoiceCommand _parseCommand(String transcript) {
    final text = transcript.toLowerCase();

    bool hasKeyword(List<String> keywords) =>
        keywords.any((k) => text.contains(k));

    final hasPomodoro = hasKeyword(_keywords['pomodoro']!);
    final hasStart = hasKeyword(_keywords['start']!);
    final hasStop = hasKeyword(_keywords['stop']!);
    final hasPause = hasKeyword(_keywords['pause']!);
    final hasResume = hasKeyword(_keywords['resume']!);
    final hasReset = hasKeyword(_keywords['reset']!);
    final hasTasks = hasKeyword(_keywords['tasks']!);

    if (hasPomodoro || hasStart || hasStop || hasPause || hasResume || hasReset) {
      if (hasStop) return VoiceCommand(type: CommandType.stopTimer, confidence: 0.9);
      if (hasPause) return VoiceCommand(type: CommandType.pauseTimer, confidence: 0.9);
      if (hasResume) return VoiceCommand(type: CommandType.resumeTimer, confidence: 0.9);
      if (hasReset) return VoiceCommand(type: CommandType.resetTimer, confidence: 0.9);
      if (hasStart || hasPomodoro) return VoiceCommand(type: CommandType.startPomodoro, confidence: 0.9);
    }

    if (hasTasks) {
      return VoiceCommand(type: CommandType.showTasks, confidence: 0.8);
    }

    return VoiceCommand(type: CommandType.unknown, confidence: 0.0);
  }
}
