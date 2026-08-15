package com.vhs.attendance;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

/**
 * এই কাস্টম MainActivity দুটো কাজ করে, যা ডিফল্ট Capacitor টেমপ্লেটে নেই:
 *
 * ১. WebView-এর ভেতরে getUserMedia() (ভয়েস রেকর্ডিং এর জন্য মাইক্রোফোন)
 *    কল করা হলে, Android WebView নিজে থেকে অনুমতি পপআপ দেখায় না —
 *    onPermissionRequest() override করে সেটা গ্র্যান্ট করে দেওয়া হচ্ছে।
 *    (রানটাইম CAMERA/RECORD_AUDIO পারমিশন আলাদাভাবে চাওয়া হবে, নিচের
 *    ensurePermissions() দ্রষ্টব্য)
 *
 * ২. window.print() — যেটা ID কার্ড, রেজাল্ট শীট, ফি রিসিট প্রিন্ট করতে
 *    কোডে ব্যবহার হয়েছে — সাধারণ Android WebView-তে কিছুই করে না।
 *    এখানে window.print() কে জাভাস্ক্রিপ্ট ইন্টারফেসের মাধ্যমে ধরে
 *    Android-এর নিজস্ব PrintManager (Save as PDF / প্রিন্টার শেয়ার শীট)
 *    এ পাঠানো হচ্ছে, যাতে প্রিন্ট বাটনগুলো ভাঙা না থাকে।
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();

        // --- ১. ক্যামেরা / মাইক্রোফোন পারমিশন (getUserMedia) ---
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        // --- ২. window.print() -> নেটিভ Android প্রিন্ট ---
        webView.addJavascriptInterface(new PrintBridge(), "AndroidPrint");
        String injectPrintOverride =
                "window.print = function() { window.AndroidPrint.print(); };";
        webView.setWebViewClient(new com.getcapacitor.CapacitorWebViewClient(this.bridge) {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.evaluateJavascript(injectPrintOverride, null);
            }
        });
    }

    private class PrintBridge {
        @JavascriptInterface
        public void print() {
            runOnUiThread(() -> {
                WebView webView = bridge.getWebView();
                PrintManager printManager =
                        (PrintManager) getSystemService(PRINT_SERVICE);
                String jobName = getString(R.string.app_name) + " - Document";
                android.print.PrintDocumentAdapter adapter =
                        webView.createPrintDocumentAdapter(jobName);
                printManager.print(jobName, adapter,
                        new PrintAttributes.Builder().build());
            });
        }
    }
}
