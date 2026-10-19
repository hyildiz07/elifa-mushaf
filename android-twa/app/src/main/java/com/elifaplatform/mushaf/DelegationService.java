package com.elifaplatform.mushaf;

/** Preserves the existing v4 delegation hook; disabled by enableNotification. */
public class DelegationService extends com.google.androidbrowserhelper.trusted.DelegationService {
    @Override
    public void onCreate() {
        super.onCreate();
    }
}
