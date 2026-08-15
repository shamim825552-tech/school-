import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// নিচের সবকিছু শুধু নেটিভ Android/iOS শেলে চলবে — ব্রাউজারে (vite dev/preview)
// এসব API নেই বলে চেষ্টা করলে ভেঙে যেত, তাই Capacitor.isNativePlatform() দিয়ে গার্ড করা হয়েছে।
if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: "#059669" }).catch(() => {});
  SplashScreen.hide().catch(() => {});

  // Android হার্ডওয়্যার ব্যাক বাটন: দ্বিতীয়বার ২ সেকেন্ডের মধ্যে না চাপলে
  // অ্যাপ বন্ধ হবে না, শুধু প্রথমবার চাপলে সতর্ক করবে — ভুলবশত অ্যাপ থেকে
  // বেরিয়ে যাওয়া ঠেকাতে।
  let lastBackPress = 0;
  CapApp.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
      return;
    }
    const now = Date.now();
    if (now - lastBackPress < 2000) {
      CapApp.exitApp();
    } else {
      lastBackPress = now;
    }
  });
}
