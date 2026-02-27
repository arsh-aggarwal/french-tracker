# 🚀 FINAL DEPLOYMENT - Complete Setup Guide

## **What's New:**

✅ **Firebase config in separate file** (never overwritten again!)
✅ **All podcast sources** researched and added (8 A2, 7 B1, 6 B2 sources)
✅ **Pimsleur bug fixed** (only increments once per day)
✅ **Refresh button** for podcast rotation
✅ **Manual progress fix** guide included

---

## **Step 1: Update Your Firebase Config (ONE TIME ONLY)**

1. Open `firebase-config.js`
2. Replace with YOUR actual Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",  // YOUR key
  authDomain: "french-tracker-abc123.firebaseapp.com",
  projectId: "french-tracker-abc123",
  storageBucket: "french-tracker-abc123.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

3. Save and commit to GitHub

**This file is NEVER overwritten in future updates!**

---

## **Step 2: Update index.html**

Find this section (around line 69):

```html
<!-- Firebase SDKs -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

<!-- App Script -->
<script src="app.js"></script>
```

**Replace with:**

```html
<!-- Firebase SDKs -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

<!-- YOUR CONFIG (loaded first, never overwritten) -->
<script src="firebase-config.js"></script>

<!-- App Script -->
<script src="app.js"></script>
```

---

## **Step 3: Update app.js**

**Remove lines 6-13** (the old firebaseConfig object).

Your app.js should start with:

```javascript
// ========================================
// FIREBASE INITIALIZATION
// ========================================
// Config loaded from firebase-config.js

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
```

---

## **Step 4: Replace tasks.json**

Use the new `tasks-WITH-SOURCES.json` file.

Rename it to `tasks.json` and replace your old one.

**What's included:**
- 8 A2 podcast sources (InnerFrench, RFI, Easy French, etc.)
- 7 B1 podcast sources (Ohlala la France, Français Authentique, etc.)
- 6 B2 podcast sources (France Culture, Transfert, Émotions, etc.)

---

## **Step 5: Deploy to GitHub**

Upload these files to your repo:

```
✅ firebase-config.js (NEW - your credentials)
✅ index.html (UPDATED - loads config first)
✅ app.js (UPDATED - no hardcoded config)
✅ tasks.json (UPDATED - all podcast sources)
✅ styles.css (unchanged)
```

Commit and push!

---

## **Step 6: Fix Yesterday's Lost Progress**

See `FIX_YESTERDAY_PROGRESS.md` for instructions.

**Quick fix in console:**

```javascript
appState.pimsleurProgress = 19;  // Your actual lesson
appState.totalCompleted += 4;    // Add yesterday's tasks
appState.streak = 2;             // Your real streak
await saveState();
location.reload();
```

---

## **How the New Podcast System Works:**

### **Before:**
- No sources shown
- Had to remember which podcast you were using

### **Now:**
- Task shows current podcast: "Listening to: InnerFrench #1"
- Click **🔄 New Podcast** button to rotate
- Cycles through 8 curated A2 sources
- Each source has description + direct link

### **Example:**

```
Day 1: InnerFrench #1 - Pourquoi le français est difficile
Day 2: (same) InnerFrench #1 (continue from yesterday)
Day 3: (same) InnerFrench #1 (finish episode)
Day 4: Click 🔄 → Journal en français facile (RFI)
Day 5: (same) RFI news
```

---

## **Testing Checklist:**

After deployment, test these:

### ✅ **Firebase Config:**
Console should show:
```
☁️ Synced to Firestore
```
NOT:
```
Permission denied on resource project REPLACE_ME
```

### ✅ **Pimsleur Increment:**
1. Check Pimsleur ✅
2. See "Lesson 17" (or your number)
3. Uncheck ❌
4. See "Lesson 16"
5. Check again ✅
6. **Still shows "Lesson 17"** (NOT 18!)
7. Console: "⏸️ Pimsleur already completed today"

### ✅ **Podcast Sources:**
1. See "3-Minute Podcast Segment"
2. Below it: "Listening to: [podcast name]"
3. See 🔄 button
4. Click it → source changes
5. See direct link to that podcast

### ✅ **Cross-Device Sync:**
1. Complete task on Device A
2. Open tracker on Device B
3. Same progress shows

---

## **File Structure (Final):**

```
french-tracker/
├── firebase-config.js     ← YOUR credentials (never overwritten)
├── index.html             ← Loads config first
├── app.js                 ← No hardcoded config
├── tasks.json             ← All podcast sources
├── styles.css             ← Unchanged
└── README.md              ← Documentation
```

---

## **Future Updates:**

When I give you new code:

**Before (OLD WAY):**
- You get app.js
- Firebase config gets overwritten
- You have to manually restore it

**Now (NEW WAY):**
- You get app.js
- Firebase config stays in `firebase-config.js`
- Nothing to restore!

Just replace app.js, commit, done.

---

## **Podcast Sources Included:**

### **A2 (Beginner):**
1. InnerFrench - Slow episodes
2. Journal en français facile (RFI)
3. La Pause Café Croissant
4. LanguaTalk Slow French
5. Easy French - Super Easy
6. French BlaBla
7. One Thing In A French Day
8. InnerFrench pronunciation tips

### **B1 (Intermediate):**
1. InnerFrench - Normal speed
2. Ohlala la France
3. Français Authentique
4. Easy French - Regular
5. LanguaTalk - Intermediate
6. French Etc
7. News in Slow French

### **B2 (Advanced):**
1. France Culture
2. Le Monde Podcasts
3. Transfert (storytelling)
4. Émotions by Louie Média
5. InnerFrench - Advanced
6. Choses à Savoir

All with descriptions and direct links!

---

## **Questions?**

**Q: Do I need to update firebase-config.js every time?**
A: No! Only once. Then never touch it again.

**Q: What if I want to add my own podcast?**
A: Edit `tasks.json`, add to the `sources` array.

**Q: Can I change the podcast rotation order?**
A: Yes, just reorder the array in `tasks.json`.

**Q: Will future updates break my config?**
A: No! That's the whole point. Your config is safe.

---

**Deploy and let me know if anything breaks!**
