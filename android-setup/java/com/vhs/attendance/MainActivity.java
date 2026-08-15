package com.vhs.attendance;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        webView.addJavascriptInterface(new PrintBridge(), "AndroidPrint");

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            webView.evaluateJavascript(
                "window.print = function() { window.AndroidPrint.print(); };",
                null
            );
        }, 2000);
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
