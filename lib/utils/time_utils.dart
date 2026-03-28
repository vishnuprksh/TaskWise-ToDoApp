class TimeUtils {
  static String formatTime(int minutes) {
    if (minutes < 60) {
      return '${minutes}m';
    }
    int hours = minutes ~/ 60;
    int remainingMinutes = minutes % 60;
    if (remainingMinutes == 0) {
      return '${hours}h';
    }
    return '${hours}h ${remainingMinutes}m';
  }

  static String formatSeconds(int totalSeconds) {
    int minutes = totalSeconds ~/ 60;
    int seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}
