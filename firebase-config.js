// ========================================
// FIREBASE CONFIGURATION
// ========================================
// This file contains ONLY your Firebase credentials
// It is loaded BEFORE app.js and never gets overwritten

// REPLACE THESE with your actual Firebase project details:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};

// ========================================
// HOW TO GET YOUR CONFIG:
// ========================================
// 1. Go to https://console.firebase.google.com/
// 2. Open your project
// 3. Click ⚙️ → Project settings
// 4. Scroll to "Your apps" section
// 5. Click the web icon </> (if you haven't created an app yet)
// 6. Copy the firebaseConfig object above
// 7. Replace the values in this file
// 8. Save and deploy
//
// This file will NEVER be overwritten by future updates!
