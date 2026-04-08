class TimeUtils {
  /// Formats minutes into a human-readable string (e.g., "1h 20m" or "45m")
  static String formatMinutes(int minutes) {
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

  /// Formats seconds into a short clock format (e.g., "25:00")
  static String formatSeconds(int totalSeconds) {
    int minutes = totalSeconds ~/ 60;
    int seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  /// Formats seconds into a human-readable string (e.g., "1h 20m" or "45s")
  static String formatSecondsToTime(int seconds) {
    if (seconds < 60) {
      return '${seconds}s';
    }
    return formatMinutes(seconds ~/ 60);
  }

  /// Formats seconds into decimal hours (e.g., "1.25 hrs")
  static String formatSecondsToDecimalHours(int seconds) {
    double hours = seconds / 3600;
    return '${hours.toStringAsFixed(2)} hrs';
  }
}
