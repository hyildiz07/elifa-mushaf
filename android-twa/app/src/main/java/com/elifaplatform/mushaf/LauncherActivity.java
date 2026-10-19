package com.elifaplatform.mushaf;

import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Bundle;

/** Browser-backed TWA, preserving the v4 launcher URL and orientation behavior. */
public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    @Override
    protected Uri getLaunchingUrl() {
        return super.getLaunchingUrl();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Both API branches of the inspected v4 method set -1 (unspecified).
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
    }
}
