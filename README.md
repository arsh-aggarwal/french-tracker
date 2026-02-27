# French Tracker v2.0 - Setup & Deployment Guide

## 📁 What You Have

Your French tracker now has a professional, modular architecture:

```
french-tracker-v2/
├── index.html          # UI structure (clean, minimal)
├── styles.css          # All styling + light/dark theme
├── app.js              # All logic (Firebase, task generation, state management)
├── tasks.json          # Task database (edit this to add/modify tasks!)
└── README.md           # This file
```

## ✨ Features

- ✅ **Modular architecture** - Easy to maintain and extend
- ✅ **Light/Dark theme** - Auto-detects system preference + manual toggle
- ✅ **Cloud-synced** - Works across all your devices
- ✅ **JSON-based tasks** - Edit `tasks.json` to add/modify resources
- ✅ **Smart progression** - Automatically moves you from A2 → B1 → B2
- ✅ **Visual priority system** - MUST / SHOULD / BONUS bands
- ✅ **Export/Import** - Backup your progress anytime

---

## 🚀 Quick Start (5 minutes)

### Step 1: Set up Firebase (Free)

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Name it `french-tracker` (or anything)
4. **Disable** Google Analytics (not needed)
5. Click **"Create project"**

### Step 2: Enable Firestore Database

1. In your project, click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select region close to you (e.g., `europe-west1` for France)
5. Click **"Enable"**

### Step 3: Set Firestore Security Rules

1. Go to **"Firestore Database" → "Rules"** tab
2. Replace everything with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

> ⚠️ **Note**: These rules allow anyone to read/write. For personal use only. For production, add authentication.

### Step 4: Firebase Storage (OPTIONAL - Skip This!)

⚠️ **You can skip this step!** Firebase Storage is no longer free in EU regions.

**The app automatically falls back to loading `tasks.json` from your GitHub Pages deployment.**

If you want to use Firebase Storage anyway (only available in US regions or with Blaze plan):
1. Click **"Storage"** in left sidebar
2. Click **"Get started"**
3. Keep default security rules
4. Click **"Done"**
5. Upload `tasks.json` to the root

**For most users: Just skip this and move to Step 5.**

### Step 5: Get Your Firebase Configuration

1. Click the **gear icon ⚙️** next to "Project Overview"
2. Click **"Project settings"**
3. Scroll to **"Your apps"** section
4. Click the **web icon `</>`**
5. Register app (name it anything, e.g., "French Tracker Web")
6. Copy the `firebaseConfig` object

### Step 6: Update app.js with Your Firebase Config

1. Open `app.js`
2. Find this section (lines 6-13):

```javascript
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};
```

3. Replace with YOUR config from Step 5
4. Save the file

### Step 7: Deploy to GitHub Pages

#### Option A: Using GitHub Website (Easiest)

1. Create new repository: https://github.com/new
   - Name: `french-tracker` (or anything)
   - Public or Private (your choice)
   - Don't initialize with README
2. Click **"uploading an existing file"**
3. Upload ALL 4 files:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `tasks.json`
4. Commit files
5. Go to **Settings → Pages**
6. Under "Source", select **"main"** branch
7. Click **"Save"**
8. Your site will be live at: `https://YOUR_USERNAME.github.io/french-tracker`

#### Option B: Using Git Command Line

```bash
cd french-tracker-v2
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/french-tracker.git
git push -u origin main
```

Then enable GitHub Pages in Settings → Pages.

---

## 🎯 How to Use

### Daily Routine

1. Open your tracker URL (bookmark it!)
2. You'll see 3 priority bands:
   - **🔴 Bare Minimum** (MUST): Anki + Clémence
   - **🔵 Normal Day** (SHOULD): Listening + Speaking
   - **🟣 Extra Credit** (BONUS): Reading + Writing
3. Click checkboxes as you complete tasks
4. Progress saves automatically across devices

### Understanding the Bands

- **MUST** = Do these even on your worst days (10-15min total)
- **SHOULD** = Your normal daily routine (30-40min total)
- **BONUS** = When you have extra energy (45-60min+ total)

You always see ALL tasks. The bands tell you priority, not "yes/no".

### Theme Toggle

- Click the 🌙/☀️ button in top-right corner
- Auto-detects your system preference on first visit
- Preference is saved

---

## 🛠️ Customization

### Adding/Modifying Tasks

1. Edit `tasks.json` locally
2. Upload new version to Firebase Storage
3. **OR** just edit the local file if not using Firebase Storage
4. Refresh tracker → new tasks appear!

**Example**: Add a new A2 listening task:

```json
{
  "name": "Listen to Coffee Break French A2",
  "description": "Short, bite-sized lessons. Great for commuting.",
  "time": "10min",
  "type": "listen",
  "url": "https://coffeebreakfrench.com/"
}
```

Just add this to `resources.listening.A2` array in `tasks.json`.

### Changing Task Distribution

Edit `taskTemplates` in `tasks.json`:

```json
"taskTemplates": {
  "MUST": ["anki", "clemence"],
  "SHOULD": ["listening", "speaking"],
  "BONUS": ["reading", "writing"]
}
```

Want more speaking practice? Move it to MUST:

```json
"taskTemplates": {
  "MUST": ["anki", "clemence", "speaking"],
  "SHOULD": ["listening"],
  "BONUS": ["reading", "writing"]
}
```

### Adjusting Phase Durations

In `app.js`, find `getCurrentLevel()` function (line ~180):

```javascript
if (monthsElapsed < 4) return 'A2';  // Change 4 to whatever
if (monthsElapsed < 8) return 'B1';  // Change 8 to whatever
return 'B2';
```

---

## 📊 Data Management

### Export Your Progress

1. Click **"Export Data"** button
2. Downloads JSON file with all your progress
3. Save this somewhere safe (Dropbox, Google Drive, etc.)

### Reset Progress

1. Click **"Reset Progress"** button
2. Confirm
3. Everything starts fresh

### Manual Backup

Your data is in two places:
1. **Firestore** (cloud) → users/me document
2. **localStorage** (browser) → key: `french_tracker_state`

---

## 🐛 Troubleshooting

### Tasks not saving?

1. Check Firebase config is correct in `app.js`
2. Check Firestore rules are set (Step 3)
3. Open browser console (F12) → look for errors
4. Check you're online

### Tasks.json not loading?

1. Make sure you uploaded it to Firebase Storage (Step 4)
2. Or make sure it's in the same folder as index.html
3. Check browser console for errors

### Theme not working?

1. Clear browser cache
2. Check `localStorage` in browser dev tools
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Firebase quota exceeded?

Free tier limits:
- **Firestore**: 50K reads/day, 20K writes/day
- **Storage**: 1GB stored, 10GB/month bandwidth

You won't hit these with personal use. If you do, Firebase will just pause until next day.

---

## 🎨 Customizing the UI

All styling is in `styles.css`. It uses CSS variables, so changes are easy.

### Change Colors

In `:root` section of `styles.css`:

```css
:root {
  --accent: #3b82f6;  /* Change this to any color */
  --green: #10b981;
  --must: #ef4444;
  /* etc */
}
```

### Change Fonts

Add to `<head>` in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

Then in `styles.css`:

```css
body {
  font-family: 'Poppins', sans-serif;
}
```

### Adjust Animations

Search for `@keyframes` in `styles.css` to modify or disable animations.

---

## 🔐 Security Notes

### Current Setup (Development)

- ✅ Good for: Personal use, learning
- ⚠️ Not good for: Multiple users, public deployment

### For Production (Multiple Users)

You need to add Firebase Authentication:

1. Enable Auth in Firebase Console
2. Add sign-in method (Email, Google, etc.)
3. Update Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Update `app.js` to use `request.auth.uid` instead of `'me'`

---

## 🚀 Future Enhancements (AI Layer)

Once you're comfortable with the system, we can add:

### Option 1: Intelligent Task Selection with Claude API

- Daily personalized task lists based on your actual progress
- Identifies weak areas and adjusts focus
- ~$2-5/month via Anthropic API

### Option 2: Smart Reminders & Notifications

- Browser notifications when you haven't studied
- SMS/Email reminders via Twilio (optional)

### Option 3: Progress Analytics Dashboard

- Charts of your streak, completion rates
- Weak area identification
- Time spent per task type

**Let me know when you're ready to add these!**

---

## 📞 Need Help?

If you get stuck:

1. Check browser console (F12) for errors
2. Verify Firebase setup (most common issue)
3. Check that all 4 files are in the same folder
4. Try the troubleshooting section above

---

## 📝 Version History

**v2.0** (Current)
- Modular architecture (HTML + CSS + JS + JSON)
- Light/Dark theme support
- Improved UI with better animations
- Export/Import functionality
- Firebase Storage support for tasks.json

**v1.0** (Previous)
- Single-file monolithic design
- Basic task generation
- Dark theme only

---

## 🎉 You're All Set!

Your tracker is now professional, maintainable, and ready to scale. 

**Next steps:**
1. Deploy it (Steps 1-7 above)
2. Use it daily for 1-2 weeks
3. Come back and tell me what you want to improve
4. We'll add the AI layer when you're ready

Bonne chance! 🇫🇷
