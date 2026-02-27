# 🔧 Fix Yesterday's Lost Progress

You completed lessons yesterday but they're not recorded. Here's how to fix it manually:

## **Option A: Fix in Browser Console (Easiest)**

1. Open your tracker
2. Press **F12** to open Console
3. Copy-paste this code (adjust the numbers):

```javascript
// ADJUST THESE NUMBERS:
const lessonsYouActuallyDid = 18;  // What lesson are you ACTUALLY on?
const tasksYouDidYesterday = 4;    // How many tasks did you complete yesterday?
const yourActualStreak = 2;        // What's your real streak?

// Apply the fix:
appState.pimsleurProgress = lessonsYouActuallyDid;
appState.totalCompleted += tasksYouDidYesterday;
appState.streak = yourActualStreak;

// Save it
await saveState();
console.log('✅ Progress fixed!');

// Reload to see changes
location.reload();
```

4. Hit **Enter**
5. Page reloads with correct progress

---

## **Option B: Fix in Firestore Console**

1. Go to https://console.firebase.google.com/
2. Open your project
3. Click **Firestore Database**
4. Find collection: `users`
5. Click document: `me`
6. Edit these fields:
   - `pimsleurProgress`: set to your actual lesson (e.g., 18)
   - `totalCompleted`: add yesterday's tasks (e.g., +4)
   - `streak`: set your real streak
7. Click **Update**
8. Refresh your tracker

---

## **What Numbers to Use?**

### **Pimsleur Progress:**
- Think: "What lesson should I do TODAY?"
- If today you should do Lesson 18 → set to 18

### **Total Completed:**
- Estimate yesterday's tasks
- 4 core tasks = add 4
- Plus weekly/bonus = add more

### **Streak:**
- How many consecutive days have you ACTUALLY done all core tasks?
- Be honest with yourself

---

## **Example:**

```
You did:
- Feb 26: All 4 core tasks (Pimsleur 16, 17, 18)
- Feb 27: Nothing recorded (but you did Pimsleur 19)

Fix:
- pimsleurProgress = 20 (because tomorrow is Lesson 20)
- totalCompleted += 4 (add yesterday's 4 tasks)
- streak = 2 (Feb 26 + Feb 27 = 2 days)
```

---

## **After Fixing:**

1. Verify in tracker:
   - Pimsleur shows correct lesson
   - Total tasks looks right
   - Streak is accurate

2. Going forward, the Pimsleur bug is fixed (new app.js)

---

## **Still Confused?**

Just set:
```javascript
appState.pimsleurProgress = 19;  // Next lesson you'll do
appState.totalCompleted = 8;     // Rough estimate is fine
appState.streak = 1;             // Start fresh
```

It's okay to estimate. The important thing is moving forward!
