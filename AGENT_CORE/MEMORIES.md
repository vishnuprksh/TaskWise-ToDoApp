# Strategic Memories
### 2026-04-06 - Initial Widget Design Request
- **Context:** The user wants a home screen widget for quick access to tasks and Pomodoro status.
- **Decision:** Use the `home_widget` Flutter package to facilitate communication between Flutter and native widget hosts (Android/iOS).
- **Reasoning:** It simplifies the process of updating widget data from the Dart side and handles some of the platform-specific boilerplate.

### 2026-04-06 - Schedule Widget "Centering" strategy
- **Context:** User requested a schedule widget where current time is always centered.
- **Decision:** Use a "Sliding Window" in `RemoteViewsFactory`.
- **Reasoning:** Since `RemoteViews` lacks programmatic scroll control, we will shift the source data window (e.g., `-3h` to `+3h` from `now`) each time the widget updates. This mimics a centered timeline by ensuring the "Current Time" is always mapped to the middle slot of the `ListView`.

### 2026-04-08 - Pomodoro Tracking Strategy
- **Context:** User reported incorrect focus time estimation and requested global/project-wise tracking.
- **Decision:** Use a separate `pomodoro_sessions` collection in Firestore to record minutes spent. Use `FieldValue.increment(1)` for updating the aggregate `timeSpent` on tasks.
- **Reasoning:** Atomic increments solve the stale data issue where the UI was using initial state values for updates. Recording sessions allows for flexible reporting (daily, weekly, project-wise) without cluttering the `Task` model with list of timestamps.

### 2026-04-08 - Navigation Refactor & Settings Separation
- **Context:** The Projects navigation was using the Settings icon, creating confusion.
- **Decision:** Reassigned `LucideIcons.layers` to Projects and created a dedicated `SettingsScreen` accessible via the Settings icon.
- **Reasoning:** Improves UX by aligning iconography with actual functionality. Adding a dedicated Settings page provides a clear location for account management (Google Auth) and future configuration.

### 2026-04-08 - Feature Verification & Mobile Launch
- **Context:** Final verification of Pomodoro features and launching the mobile app.
- **Decision:** Verified that `FieldValue.increment` is correctly used in `TimerScreen` and that `PomodoroReportScreen` is fully implemented. Launched the app on the motorola edge 50 neo.
- **Reasoning:** Ensuring code correctness before final handover. Observed some Firestore DNS warnings on the device, possibly due to local network state.
