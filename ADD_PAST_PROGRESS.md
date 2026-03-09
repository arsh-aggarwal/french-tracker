# 📅 Add Past Progress - Complete Guide

## **The Problem:**
You've been doing Pimsleur lessons but they weren't tracked. Now you need to backfill your progress.

## **The Solution:**
Use the `addPastProgress()` function in the browser console.

---

## **Quick Start:**

1. Open your tracker
2. Press **F12** (Developer Console)
3. Paste this code (adjust dates and lessons):

```javascript
// Add Feb 24 - Lesson 15
addPastProgress("2026-02-24", 15, ["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]);

// Add Feb 25 - Lesson 16
addPastProgress("2026-02-25", 16, ["pimsleur", "anki-review"]);

// Add Feb 26 - Lesson 17
addPastProgress("2026-02-26", 17, ["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]);

// Add Feb 27 - Lesson 18 (only Pimsleur)
addPastProgress("2026-02-27", 18, ["pimsleur"]);

console.log("✅ All past progress added!");
```

4. Hit **Enter**
5. Refresh page to see updates

---

## **Function Signature:**

```javascript
addPastProgress(date, lessonNumber, tasksCompleted)
```

### **Parameters:**

**1. date** (string): Date in format `"YYYY-MM-DD"`
```javascript
"2026-02-26"  // Feb 26, 2026
```

**2. lessonNumber** (number): Which Pimsleur lesson you completed
```javascript
17  // Lesson 17
```

**3. tasksCompleted** (array): Which tasks you did that day
```javascript
// All 4 core tasks:
["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]

// Only Pimsleur + Anki:
["pimsleur", "anki-review"]

// Just Pimsleur:
["pimsleur"]
```

---

## **Common Scenarios:**

### **Scenario 1: Full Day (All 4 Core Tasks)**

```javascript
addPastProgress("2026-02-26", 16, [
  "pimsleur",
  "anki-review", 
  "podcast-chunk",
  "oral-summary"
]);
```

**Result:**
- ✅ Lesson 16 marked complete
- ✅ All 4 core tasks done
- ✅ Counts toward streak

---

### **Scenario 2: Partial Day (Only Pimsleur)**

```javascript
addPastProgress("2026-02-27", 17, ["pimsleur"]);
```

**Result:**
- ✅ Lesson 17 marked complete
- ❌ Only 1/4 core tasks done
- ❌ Does NOT count toward streak (need all 4)

---

### **Scenario 3: Multiple Days at Once**

```javascript
// Week of Feb 24-28
addPastProgress("2026-02-24", 15, ["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]);
addPastProgress("2026-02-25", 16, ["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]);
addPastProgress("2026-02-26", 17, ["pimsleur", "anki-review"]);
addPastProgress("2026-02-27", 18, ["pimsleur"]);
addPastProgress("2026-02-28", 19, ["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]);

console.log("✅ Week added!");
```

**Result:**
- Lessons 15-19 tracked
- Streak = 3 days (Feb 24, 25, 28 had all 4 tasks)
- Total tasks = 18

---

## **Your Actual Situation:**

Let's say you did lessons 16-22 over the past week but didn't track them.

**Step 1:** Figure out which days you did ALL 4 core tasks vs. just Pimsleur.

**Step 2:** Run this:

```javascript
// Adjust dates and tasks based on YOUR memory

// Feb 24: All tasks
addPastProgress("2026-02-24", 16, ["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]);

// Feb 25: Just Pimsleur
addPastProgress("2026-02-25", 17, ["pimsleur"]);

// Feb 26: All tasks
addPastProgress("2026-02-26", 18, ["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]);

// Feb 27: Just Pimsleur + Anki
addPastProgress("2026-02-27", 19, ["pimsleur", "anki-review"]);

// Today: Continue normally
// (Don't add today - just use the tracker)
```

---

## **How It Updates:**

### **Before:**
```
Pimsleur Progress: 16
Total Tasks: 0
Streak: 0
Daily History: {}
```

### **After running addPastProgress:**
```
Pimsleur Progress: 23 (auto-increments to next lesson)
Total Tasks: 14 (counts all tasks from added days)
Streak: 2 (only days with ALL 4 tasks)
Daily History: {
  "2026-02-24": {...},
  "2026-02-25": {...},
  "2026-02-26": {...}
}
```

---

## **Checking Your Data:**

After adding, verify in console:

```javascript
// See all your history
console.log(appState.dailyHistory);

// Check specific date
console.log(appState.dailyHistory["2026-02-26"]);

// Current progress
console.log("Next lesson:", appState.pimsleurProgress);
console.log("Total tasks:", Object.values(appState.dailyHistory).reduce((sum, day) => {
  return sum + day.coreCompleted.length;
}, 0));
```

---

## **Export for Safety:**

After adding all your progress, export it:

```javascript
exportData(); // Downloads JSON backup
```

Keep this file safe!

---

## **Tips:**

1. **Be honest with yourself** - Only mark tasks you ACTUALLY did
2. **Streak is strict** - Only counts days with ALL 4 core tasks
3. **Pimsleur auto-updates** - System sets next lesson automatically
4. **Can't add future dates** - Only past/today
5. **Can overwrite** - If you make a mistake, just run again with corrected data

---

## **Common Errors:**

**"Progress already exists for this date"**
→ That date is already recorded. To update it, delete first:
```javascript
delete appState.dailyHistory["2026-02-26"];
addPastProgress("2026-02-26", 17, ["pimsleur"]);
```

**"Lesson number is in the past"**
→ Your global pimsleurProgress is ahead. This is fine - old lesson still recorded.

---

## **Example: Real Backfill**

Let's say you're adding a full week:

```javascript
// Monday - Full day
addPastProgress("2026-02-24", 16, ["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]);

// Tuesday - Busy, only Pimsleur
addPastProgress("2026-02-25", 17, ["pimsleur"]);

// Wednesday - Forgot
// (Don't add anything)

// Thursday - Full day
addPastProgress("2026-02-27", 18, ["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]);

// Friday - Full day  
addPastProgress("2026-02-28", 19, ["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]);

// Saturday - Extended session with bonus
addPastProgress("2026-03-01", 20, ["pimsleur", "anki-review", "podcast-chunk", "oral-summary"]);
// Note: Can't add bonus tasks yet - just core for now

console.log("Week added! Streak:", appState.streak);
// Streak = 4 (Mon, Thu, Fri, Sat)
```

---

**Now go add your progress and start fresh today!**
