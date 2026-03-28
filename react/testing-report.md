# Closed Testing Notes - TaskWise

### 1. Recruitment of Testers

**How did you find people to test?**
I invited 20 people I know, including CS students and friends with busy schedules. I also posted in a small Discord dev group. This gave a mix of "power users" and testers who could check technical stability across different Android devices.

**How easy was it to recruit testers?**
**Neither difficult nor easy**

### 2. Engagement from Testers

**What did people actually do in the app?**
Testers stayed active for the full 14 days. They used the Pomodoro timer during work shifts and tested the Firebase sync by adding tasks on Android and checking the web version. They also verified that the 5-minute event reminders worked even when the app was closed.

### 3. Feedback Summary

**What did they tell you and how did you get that info?**
Feedback came via Google Forms and Discord:
1. Fixed sync race conditions in `SyncService.js` using Firestore batches.
2. Updated `NotificationService.js` for Android 13+ permission requirements.
3. Optimized timer UI with `react-native-reanimated` for low-end phones.
4. Added a calendar view.

---

## 2. About your app

**Who is the intended audience?**
TaskWise is for developers and professionals who juggle complex daily tasks. It’s built for focus-heavy roles where micromanagement is a burden. It helps those who need a hands-free way (via voice) to start focus sessions and manage high-priority backlogs.

**How does your app provide value to users?**
It reduces cognitive load by automating prioritization and focus. Users don’t have to "decide" what’s next; the app suggests the priority. The integrated Pomodoro timer and calendar ensure deep work cycles are protected, while Firebase sync keeps their schedule safe across devices.

---

### 3. Your production readiness

**What changes did you make based on your closed test?**
I added a Calendar/Timeline view and a `UserMenu` for better project organization. I also simplified the onboarding because testers missed the voice assistant feature. I overhauled the `TaskForm` to be more intuitive, ensuring first-time users can navigate core features without guidance.

**How did you decide the app is ready for production?**
The app is stable. All critical bugs in the `SyncService` were fixed, and testers reported that the app now provides immediate value for their daily planning. Performance is fluid at 60fps, and the core utility—reducing focus-related stress—has been validated by 14 days of consistent use.

---

### 4. Additional testing (Re-application)

**What did you do differently in this closed test?**
In this second testing cycle, I used a structured Google Form to collect specific feedback on the voice assistant and Firestore sync reliability. I actively engaged with 20 testers daily, leading to the overhaul of the Calendar UI and the addition of the User/Project menu for better usability.

---

### 5. Extra Technical Verification (Indie Developer Internal Checklist)