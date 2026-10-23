package com.elifaplatform.mushaf;

/** Preserves the existing v4 wrapper's no-op Application hook. */
public class Application extends android.app.Application {
    @Override
    public void onCreate() {
        super.onCreate();
    }
}
