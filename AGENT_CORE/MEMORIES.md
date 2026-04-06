# Strategic Memories
### 2026-04-06 - Initial Widget Design Request
- **Context:** The user wants a home screen widget for quick access to tasks and Pomodoro status.
- **Decision:** Use the `home_widget` Flutter package to facilitate communication between Flutter and native widget hosts (Android/iOS).
- **Reasoning:** It simplifies the process of updating widget data from the Dart side and handles some of the platform-specific boilerplate.

### 2026-04-06 - Schedule Widget "Centering" Strategy
- **Context:** User requested a schedule widget where current time is always centered.
- **Decision:** Use a "Sliding Window" in `RemoteViewsFactory`.
- **Reasoning:** Since `RemoteViews` lacks programmatic scroll control, we will shift the source data window (e.g., `-3h` to `+3h` from `now`) each time the widget updates. This mimics a centered timeline by ensuring the "Current Time" is always mapped to the middle slot of the `ListView`.
