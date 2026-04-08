# Strategic Memories
### 2026-04-06 - Initial Widget Design Request
- **Context:** The user wants a home screen widget for quick access to tasks and Pomodoro status.
- **Decision:** Use the `home_widget` Flutter package to facilitate communication between Flutter and native widget hosts (Android/iOS).
- **Reasoning:** It simplifies the process of updating widget data from the Dart side and handles some of the platform-specific boilerplate.

### 2026-04-06 - Schedule Widget "Centering" strategy
- **Context:** User requested a schedule widget where current time is always centered.
- **Decision:** Use a "Sliding Window" in `RemoteViewsFactory`.
- **Reasoning:** Since `RemoteViews` lacks programmatic scroll control, we will shift the source data window (e.g., `-3h` to `+3h` from `now`) each time the widget updates. This mimics a centered timeline by ensuring the "Current Time" is always mapped to the middle slot of the `ListView`.

### 2026-04-08 - Focusing Consolidating & Session Removal
- **Context:** User requested removal of `pomodoro_sessions` as they were redundant with `Task.timeSpent`.
- **Decision:** Deleted `pomodoro_sessions` collection and model. Refactored reporting to aggregate statistics directly from the `tasks` collection.
- **Reasoning:** Reduces database complexity and storage costs. Simplifies the state management by having a single source of truth for focus time. Historical daily granularity was traded off for architectural simplicity as per user requirement.

### 2026-04-08 - Navigation Refactor & Settings Separation
- **Context:** The Projects navigation was using the Settings icon, creating confusion.
- **Decision:** Reassigned `LucideIcons.layers` to Projects and created a dedicated `SettingsScreen` accessible via the Settings icon.
- **Reasoning:** Improves UX by aligning iconography with actual functionality. Adding a dedicated Settings page provides a clear location for account management (Google Auth) and future configuration.

### 2026-04-08 - Feature Verification & Mobile Launch
- **Context:** Final verification of Pomodoro features and launching the mobile app.
- **Decision:** Verified that `FieldValue.increment` is correctly used in `TimerScreen` and that `PomodoroReportScreen` is fully implemented. Launched the app on the motorola edge 50 neo.
- **Reasoning:** Ensuring code correctness before final handover. Observed some Firestore DNS warnings on the device, possibly due to local network state.
### 2026-04-08 - Precision Focus Reporting
- **Context:** User wants to see today's focus time in hours directly on the timer screen.
- **Decision:** Implement a decimal hour format (X.XX hrs) and a daily aggregation provider.
- **Reasoning:** Decimal hours provide a more analytical view suitable for "total hrs" and align with professional productivity tracking standards. Filtering sessions by date ensures real-time feedback on daily progress.
