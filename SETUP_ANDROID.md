# React (Vite + Supabase) অ্যাপকে Android APK বানানো — ধাপে ধাপে গাইড

আমি এই প্রজেক্টে যা যা করে দিয়েছি:

- `package.json` — Capacitor ও প্রয়োজনীয় প্লাগইন (`@capacitor/core`, `@capacitor/android`,
  `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/keyboard`)
  যোগ করা হয়েছে, সাথে `android:build` / `android:run` স্ক্রিপ্ট।
- `capacitor.config.ts` — নতুন তৈরি করা হয়েছে (appId: `com.vhs.attendance`)।
- `src/main.tsx` — নেটিভ প্ল্যাটফর্মে StatusBar/SplashScreen কনফিগার ও Android
  হার্ডওয়্যার ব্যাক বাটন হ্যান্ডলিং যোগ করা হয়েছে (ব্রাউজারে এফেক্ট নেই, শুধু APK-তে চলবে)।
- `src/index.css` — নচ/স্ট্যাটাসবারের জন্য safe-area প্যাডিং যোগ করা হয়েছে।
- `index.html` — `viewport-fit=cover` যোগ করা হয়েছে।
- `android-setup/` — এই ফোল্ডারে ৩টা ফাইল আছে, যেগুলো নিচের ধাপে native android
  প্রজেক্ট তৈরির পর কপি/মার্জ করতে হবে:
  - `android-setup/AndroidManifest.xml` (ক্যামেরা, মাইক্রোফোন, ইন্টারনেট পারমিশন)
  - `android-setup/java/com/vhs/attendance/MainActivity.java` (মাইক্রোফোন পারমিশন
    গ্র্যান্ট + `window.print()` কে নেটিভ প্রিন্ট/Save-as-PDF-এ কনভার্ট করে — কোডে
    ID কার্ড ও রেজাল্ট শীট প্রিন্ট করার বাটনগুলো ভাঙা থাকতো, এটা ছাড়া)
  - `android-setup/res/xml/file_paths.xml` (ছবি আপলোডের FileProvider পাথ)

**⚠️ গুরুত্বপূর্ণ:** নিচের সব ধাপ তোমার নিজের কম্পিউটারে (ইন্টারনেট + Node.js + Android
Studio ইনস্টল করা অবস্থায়) চালাতে হবে — কারণ `npm install` এবং `npx cap add android`
ইন্টারনেট থেকে প্যাকেজ ডাউনলোড করে, যা এই চ্যাট থেকে করা সম্ভব না।

---

## ধাপ ০: প্রয়োজনীয় জিনিস ইনস্টল থাকতে হবে
- Node.js 18+ (`node -v` দিয়ে চেক করো)
- Android Studio (সাথে Android SDK, একটা emulator বা রিয়েল ডিভাইস)
- JDK 17 (Android Studio-এর সাথেই আসে)

## ধাপ ১: ডিপেন্ডেন্সি ইনস্টল
```bash
npm install
```

## ধাপ ২: প্রজেক্ট বিল্ড করো (dist/ ফোল্ডার তৈরি হবে)
```bash
npm run build
```

## ধাপ ৩: Android নেটিভ প্রজেক্ট যোগ করো
```bash
npx cap add android
```
এটা `android/` নামে একটা নতুন ফোল্ডার তৈরি করবে (পুরো নেটিভ Android Studio প্রজেক্ট,
Gradle wrapper সহ)।

## ধাপ ৪: আমার তৈরি করা পারমিশন/প্রিন্ট/মাইক্রোফোন প্যাচ কপি করো

১. **AndroidManifest.xml** replace করো:
```bash
cp android-setup/AndroidManifest.xml android/app/src/main/AndroidManifest.xml
```

২. **MainActivity.java** replace করো (ডিফল্টটা মুছে আমারটা বসাও):
```bash
mkdir -p android/app/src/main/java/com/vhs/attendance
cp android-setup/java/com/vhs/attendance/MainActivity.java \
   android/app/src/main/java/com/vhs/attendance/MainActivity.java
```
> যদি `npx cap add android`-এর সময় তুমি appId হিসেবে `com.vhs.attendance` ছাড়া
> অন্য কিছু ব্যবহার করে থাকো, তাহলে উপরের ফোল্ডার পাথ এবং MainActivity.java-এর
> ১ম লাইনের `package com.vhs.attendance;` — দুটোই সেই নতুন appId অনুযায়ী বদলাতে হবে।

৩. **file_paths.xml** কপি করো:
```bash
mkdir -p android/app/src/main/res/xml
cp android-setup/res/xml/file_paths.xml android/app/src/main/res/xml/file_paths.xml
```

## ধাপ ৫: Capacitor সিঙ্ক করো
```bash
npx cap sync android
```

## ধাপ ৬: APK তৈরি করো

**অপশন A — Android Studio দিয়ে (সহজ, রিকমেন্ডেড):**
```bash
npx cap open android
```
Android Studio খুলে যাবে। উপরের মেনু থেকে **Build → Build Bundle(s) / APK(s) → Build APK(s)**
এ ক্লিক করো। বিল্ড শেষে `android/app/build/outputs/apk/debug/app-debug.apk` পাবে।

**অপশন B — টার্মিনাল দিয়ে (Debug APK):**
```bash
cd android
./gradlew assembleDebug
```
আউটপুট: `android/app/build/outputs/apk/debug/app-debug.apk`

**প্রোডাকশন/সাইনড রিলিজ APK** (Play Store বা সরাসরি ডিভাইসে ইনস্টলের জন্য পলিশড
ভার্সন) বানাতে Android Studio-তে **Build → Generate Signed Bundle / APK** ব্যবহার
করো — এতে একটা keystore বানাতে হবে, সেটা সাবধানে সংরক্ষণ করবে (হারালে পরে আপডেট
পাবলিশ করা যাবে না)।

## কোড আপডেট করলে পরে যা করতে হবে
প্রতিবার React কোডে পরিবর্তন করার পর APK রিবিল্ড করতে হলে শুধু এটা চালালেই হবে:
```bash
npm run android:build
npx cap open android
```

---

## যা যা যাচাই করে নেওয়া হয়েছে (broken functionality এড়াতে)

| ফিচার | কোথায় ব্যবহার হয়েছে | মোবাইলে স্ট্যাটাস |
|---|---|---|
| Supabase API কল | সব ডেটা অপারেশন | ✅ INTERNET পারমিশন যোগ করা আছে |
| ছবি/NID/জন্মনিবন্ধন আপলোড (`<input type="file">`) | StudentManager, ParentVerificationForm, TeacherStudentCards, AIAssistant, TeacherGroupChat | ✅ CAMERA পারমিশন + FileProvider যোগ করা আছে, Android-এর নিজস্ব ফাইল-চুজার (ক্যামেরা/গ্যালারি) কাজ করবে |
| ভয়েস মেসেজ রেকর্ডিং (`getUserMedia` + `MediaRecorder`) | TeacherGroupChat | ✅ RECORD_AUDIO পারমিশন + MainActivity-তে `onPermissionRequest` override করে দেওয়া হয়েছে, নাহলে WebView নিজে থেকে মাইক্রোফোন এক্সেস দেয় না |
| `window.print()` | ParentIDCard, IDCardGenerator, VerificationManager, ResultAnalytics, FeeManager | ✅ MainActivity-তে নেটিভ `PrintManager` দিয়ে ধরা হয়েছে, তাই "Save as PDF" / প্রিন্টার শেয়ার শীট খুলবে |
| `localStorage` (লগইন সেশন) | App.tsx | ✅ Android WebView-তে normally কাজ করে, অ্যাপ বন্ধ করলেও থাকে — আলাদা কিছু করার দরকার নেই |
| হার্ডওয়্যার ব্যাক বাটন | সব পেজ | ✅ main.tsx-এ যোগ করা হয়েছে (একবার চাপলে সতর্ক, ২ সেকেন্ডে দ্বিতীয়বার চাপলে অ্যাপ বন্ধ) |
| স্ট্যাটাসবার/নচ ওভারল্যাপ | পুরো UI | ✅ safe-area CSS + StatusBar কালার সেট করা হয়েছে |

## একটা জিনিস মাথায় রাখবে
- অ্যাপটা পুরোপুরি Supabase-এর উপর নির্ভরশীল — ইন্টারনেট না থাকলে ডেটা লোড/সেভ হবে
  না (এটা original ওয়েব অ্যাপেও একই আচরণ, Capacitor-এর কারণে নতুন সমস্যা না)।
- `.env`-এর Supabase URL/key ইতিমধ্যে `src/lib/supabaseClient.ts`-এ ফলব্যাক হিসেবেও
  আছে, তাই বিল্ডে `.env` মিস হলেও অ্যাপ ভাঙবে না।
