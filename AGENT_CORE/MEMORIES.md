# Strategic Memories
### 2026-04-06 - Initial Widget Design Request
- **Context:** The user wants a home screen widget for quick access to tasks and Pomodoro status.
- **Decision:** Use the `home_widget` Flutter package to facilitate communication between Flutter and native widget hosts (Android/iOS).
- **Reasoning:** It simplifies the process of updating widget data from the Dart side and handles some of the platform-specific boilerplate.

### 2026-04-06 - Advanced Widget Features
- **Context:** User requested full task lists, project selection, and per-task Pomodoro triggers.
- **Decision:** Shifted from simple `RemoteViews` to a full `RemoteViewsFactory` (ListView) implementation.
- **Reasoning:** Standard `RemoteViews` are limited in child counts and interactivity. `RemoteViewsFactory` enables smooth scrolling for large task lists and intent-based handling for individual row items (Project navigation and Pomodoro clicks).
